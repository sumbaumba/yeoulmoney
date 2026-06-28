import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  baseAmount: number;
  vatIncluded: boolean;
  recurring: boolean;
  recurringGroupId?: string;
  category: string;
  date: string;
  method: 'card' | 'transfer' | 'cash';
  title: string;
  memo: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface CompanyInfo {
  name: string;
  currency: string;
}

interface DbTransaction {
  id: string;
  type: Transaction['type'];
  amount: number;
  base_amount: number;
  vat_included: boolean;
  recurring: boolean;
  recurring_group_id: string | null;
  category: string;
  date: string;
  method: Transaction['method'];
  title: string;
  memo: string;
}

interface DbBudget {
  category: string;
  limit_amount: number;
}

interface DbCompanyInfo {
  name: string;
  currency: string;
}

export const INCOME_CATEGORIES = ['매출/판매액', '투자 유치', '정부지원금', '기타 수입'];

export const EXPENSE_CATEGORIES = [
  '인건비/급여',
  '마케팅/광고',
  '자재/원가',
  '사무실 임차료/공과금',
  '소프트웨어/SaaS',
  '사업 운영비',
  '세금/공과금',
  '기타 지출',
];

const DEFAULT_BUDGETS: Budget[] = [
  { category: '인건비/급여', limit: 4000000 },
  { category: '마케팅/광고', limit: 1000000 },
  { category: '자재/원가', limit: 2000000 },
  { category: '사무실 임차료/공과금', limit: 1500000 },
  { category: '소프트웨어/SaaS', limit: 500000 },
  { category: '사업 운영비', limit: 500000 },
  { category: '세금/공과금', limit: 300000 },
  { category: '기타 지출', limit: 200000 },
];

const DEFAULT_COMPANY: CompanyInfo = { name: '여울 (Yeoul)', currency: '₩' };

const fromDbTransaction = (row: DbTransaction): Transaction => ({
  id: row.id,
  type: row.type,
  amount: Number(row.amount),
  baseAmount: Number(row.base_amount),
  vatIncluded: row.vat_included,
  recurring: row.recurring,
  recurringGroupId: row.recurring_group_id ?? undefined,
  category: row.category,
  date: row.date,
  method: row.method,
  title: row.title,
  memo: row.memo,
});

const toDbTransaction = (transaction: Transaction): DbTransaction => ({
  id: transaction.id,
  type: transaction.type,
  amount: transaction.amount,
  base_amount: transaction.baseAmount,
  vat_included: transaction.vatIncluded,
  recurring: transaction.recurring,
  recurring_group_id: transaction.recurringGroupId ?? null,
  category: transaction.category,
  date: transaction.date,
  method: transaction.method,
  title: transaction.title,
  memo: transaction.memo,
});

const addMonthsToDate = (date: string, months: number) => {
  const [year, month, day] = date.split('-').map(Number);
  const firstOfTargetMonth = new Date(Date.UTC(year, month - 1 + months, 1));
  const targetYear = firstOfTargetMonth.getUTCFullYear();
  const targetMonth = firstOfTargetMonth.getUTCMonth();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
};

const reportError = (message: string, error: unknown) => {
  console.error(message, error);
  window.alert(message);
};

export const useLedger = (enabled: boolean) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(enabled);
  const [legacyDataAvailable, setLegacyDataAvailable] = useState(() =>
    Boolean(localStorage.getItem('yeoul_ledger_transactions')),
  );
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLedger = useCallback(async () => {
    if (!enabled || !supabase) return;

    const [transactionResult, budgetResult, companyResult] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('budgets').select('category, limit_amount').order('category'),
      supabase.from('company_info').select('name, currency').eq('id', 1).limit(1),
    ]);

    const error = transactionResult.error ?? budgetResult.error ?? companyResult.error;
    if (error) throw error;

    const transactionRows = (transactionResult.data ?? []) as DbTransaction[];
    const budgetRows = (budgetResult.data ?? []) as DbBudget[];
    const companyRows = (companyResult.data ?? []) as DbCompanyInfo[];

    setTransactions(transactionRows.map(fromDbTransaction));
    setBudgets(
      budgetRows.length
        ? budgetRows.map((row) => ({ category: row.category, limit: Number(row.limit_amount) }))
        : DEFAULT_BUDGETS,
    );
    setCompanyInfo(companyRows[0] ?? DEFAULT_COMPANY);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    loadLedger()
      .catch((error) => reportError('가계부 데이터를 불러오지 못했습니다.', error))
      .finally(() => {
        if (active) setLoading(false);
      });

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        void loadLedger().catch((error) => console.error('Realtime refresh failed:', error));
      }, 100);
    };

    const channel = supabase
      .channel('ledger-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_info' }, scheduleRefresh)
      .subscribe();

    return () => {
      active = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      void supabase?.removeChannel(channel);
    };
  }, [enabled, loadLedger]);

  const addTransaction = async (input: Omit<Transaction, 'id'>) => {
    if (!supabase) return;
    const recurringGroupId = input.recurring ? crypto.randomUUID() : undefined;
    const count = input.recurring ? 12 : 1;
    const rows = Array.from({ length: count }, (_, index) =>
      toDbTransaction({
        ...input,
        id: crypto.randomUUID(),
        date: addMonthsToDate(input.date, index),
        recurringGroupId,
      }),
    );

    const { error } = await supabase.from('transactions').insert(rows);
    if (error) reportError('거래를 저장하지 못했습니다.', error);
    else await loadLedger();
  };

  const updateTransaction = async (id: string, fields: Partial<Transaction>) => {
    if (!supabase) return;
    const current = transactions.find((transaction) => transaction.id === id);
    if (!current) return;

    const { id: ignoredId, ...row } = toDbTransaction({ ...current, ...fields, id });
    void ignoredId;
    const { error } = await supabase
      .from('transactions')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) reportError('거래를 수정하지 못했습니다.', error);
    else await loadLedger();
  };

  const deleteTransaction = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) reportError('거래를 삭제하지 못했습니다.', error);
    else await loadLedger();
  };

  const setBudget = async (category: string, limit: number) => {
    if (!supabase) return;
    const { error } = await supabase.from('budgets').upsert({
      category,
      limit_amount: limit,
      updated_at: new Date().toISOString(),
    });
    if (error) reportError('예산을 저장하지 못했습니다.', error);
    else await loadLedger();
  };

  const updateCompanyInfo = async (info: CompanyInfo) => {
    if (!supabase) return;
    const { error } = await supabase.from('company_info').upsert({
      id: 1,
      ...info,
      updated_at: new Date().toISOString(),
    });
    if (error) reportError('회사 정보를 저장하지 못했습니다.', error);
    else await loadLedger();
  };

  const exportToCSV = () => {
    const headers = ['ID', '구분', '날짜', '카테고리', '금액', '결제수단', '내역', '메모'];
    const rows = transactions.map((transaction) => [
      transaction.id,
      transaction.type === 'income' ? '수입' : '지출',
      transaction.date,
      transaction.category,
      transaction.amount,
      transaction.method === 'card' ? '카드' : transaction.method === 'transfer' ? '계좌이체' : '현금',
      transaction.title.replace(/"/g, '""'),
      transaction.memo.replace(/"/g, '""'),
    ]);
    const content = '\uFEFF' + [headers, ...rows].map((row) => row.map((value) => `"${value}"`).join(',')).join('\n');
    downloadFile(content, 'text/csv;charset=utf-8', `${companyInfo.name}_가계부_${today()}.csv`);
  };

  const exportToJSON = () => {
    const content = JSON.stringify(
      { transactions, budgets, companyInfo, version: '2.0.0', exportedAt: new Date().toISOString() },
      null,
      2,
    );
    downloadFile(content, 'application/json', `${companyInfo.name}_가계부_백업_${today()}.json`);
  };

  const importFromJSON = async (jsonString: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const parsed: unknown = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') return false;
      const data = parsed as { transactions?: unknown; budgets?: unknown; companyInfo?: unknown };
      if (!Array.isArray(data.transactions) || !Array.isArray(data.budgets)) return false;

      const validTransactions = data.transactions.every((value) => {
        if (!value || typeof value !== 'object') return false;
        const transaction = value as Record<string, unknown>;
        return typeof transaction.id === 'string'
          && (transaction.type === 'income' || transaction.type === 'expense')
          && typeof transaction.amount === 'number'
          && typeof transaction.category === 'string'
          && typeof transaction.date === 'string'
          && typeof transaction.title === 'string';
      });
      if (!validTransactions) return false;

      const importedTransactions = (data.transactions as Transaction[]).map((transaction) => ({
        ...transaction,
        baseAmount: transaction.baseAmount ?? transaction.amount,
        vatIncluded: transaction.vatIncluded ?? false,
        recurring: transaction.recurring ?? false,
        memo: transaction.memo ?? '',
      }));
      const importedBudgets = data.budgets as Budget[];
      const importedCompany = data.companyInfo as CompanyInfo | undefined;

      const deleteResults = await Promise.all([
        supabase.from('transactions').delete().neq('id', ''),
        supabase.from('budgets').delete().neq('category', ''),
      ]);
      if (deleteResults.some((result) => result.error)) throw deleteResults.find((result) => result.error)?.error;

      if (importedTransactions.length) {
        const { error } = await supabase.from('transactions').insert(importedTransactions.map(toDbTransaction));
        if (error) throw error;
      }
      if (importedBudgets.length) {
        const { error } = await supabase.from('budgets').insert(
          importedBudgets.map((budget) => ({ category: budget.category, limit_amount: budget.limit })),
        );
        if (error) throw error;
      }
      if (importedCompany) await updateCompanyInfo(importedCompany);
      await loadLedger();
      return true;
    } catch (error) {
      console.error('Backup import failed:', error);
      return false;
    }
  };

  const migrateLegacyData = async (): Promise<boolean> => {
    try {
      const storedTransactions = localStorage.getItem('yeoul_ledger_transactions');
      if (!storedTransactions) return false;
      const content = JSON.stringify({
        transactions: JSON.parse(storedTransactions),
        budgets: JSON.parse(localStorage.getItem('yeoul_ledger_budgets') ?? '[]'),
        companyInfo: JSON.parse(localStorage.getItem('yeoul_ledger_company') ?? 'null'),
      });
      const success = await importFromJSON(content);
      if (success) {
        localStorage.removeItem('yeoul_ledger_transactions');
        localStorage.removeItem('yeoul_ledger_budgets');
        localStorage.removeItem('yeoul_ledger_company');
        setLegacyDataAvailable(false);
      }
      return success;
    } catch (error) {
      console.error('Legacy data migration failed:', error);
      return false;
    }
  };

  const resetData = async () => {
    if (!supabase) return;
    const results = await Promise.all([
      supabase.from('transactions').delete().neq('id', ''),
      supabase.from('budgets').delete().neq('category', ''),
      supabase.from('company_info').delete().eq('id', 1),
    ]);
    if (results.some((result) => result.error)) {
      reportError('전체 데이터를 초기화하지 못했습니다.', results.find((result) => result.error)?.error);
      return;
    }
    await supabase.from('budgets').insert(
      DEFAULT_BUDGETS.map((budget) => ({ category: budget.category, limit_amount: budget.limit })),
    );
    await supabase.from('company_info').insert({ id: 1, ...DEFAULT_COMPANY });
    await loadLedger();
  };

  return {
    transactions,
    budgets,
    companyInfo,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setBudget,
    updateCompanyInfo,
    exportToCSV,
    exportToJSON,
    importFromJSON,
    legacyDataAvailable,
    migrateLegacyData,
    resetData,
  };
};

const today = () => new Date().toISOString().split('T')[0];

const downloadFile = (content: string, type: string, fileName: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
