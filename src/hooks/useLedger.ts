import { useState, useEffect } from 'react';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
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

export const INCOME_CATEGORIES = [
  '매출/판매액',
  '투자 유치',
  '정부지원금',
  '기타 수입'
];

export const EXPENSE_CATEGORIES = [
  '인건비/급여',
  '마케팅/광고',
  '자재/원가',
  '사무실 임차료/공과금',
  '소프트웨어/SaaS',
  '사업 운영비',
  '세금/공과금',
  '기타 지출'
];

// Seed initial data for first-time users to make the UI look rich and functional
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'expense',
    amount: 3500000,
    category: '인건비/급여',
    date: '2026-06-25',
    method: 'transfer',
    title: '6월 직원 급여 지급',
    memo: '개발팀 및 경영진 정기 급여 이체'
  },
  {
    id: 'tx-2',
    type: 'income',
    amount: 8700000,
    category: '매출/판매액',
    date: '2026-06-23',
    method: 'transfer',
    title: '여울 솔루션 1차 납품 대금',
    memo: '(주)스타트업파트너스 정산 금액 입금'
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 1200000,
    category: '사무실 임차료/공과금',
    date: '2026-06-20',
    method: 'transfer',
    title: '6월 여울 공유오피스 임차료',
    memo: '서울벤처타워 6층 정기 결제 건'
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 850000,
    category: '마케팅/광고',
    date: '2026-06-18',
    method: 'card',
    title: '구글 및 페이스북 타겟 광고비',
    memo: '신규 플랫폼 런칭 마케팅 캠페인'
  },
  {
    id: 'tx-5',
    type: 'income',
    amount: 5000000,
    category: '정부지원금',
    date: '2026-06-15',
    method: 'transfer',
    title: '청년창업사관학교 지원금',
    memo: '2026년도 사업화 자금 2차 교부금'
  },
  {
    id: 'tx-6',
    type: 'expense',
    amount: 450000,
    category: '소프트웨어/SaaS',
    date: '2026-06-10',
    method: 'card',
    title: 'AWS 클라우드 인프라 비용',
    memo: '서버 호스팅 및 Slack, Notion 워크스페이스 구독'
  },
  {
    id: 'tx-7',
    type: 'expense',
    amount: 1500000,
    category: '자재/원가',
    date: '2026-06-05',
    method: 'transfer',
    title: '기기 조립 원부자재 매입',
    memo: '협력사 하드웨어 센서 부품 100세트'
  },
  {
    id: 'tx-8',
    type: 'expense',
    amount: 3500000,
    category: '인건비/급여',
    date: '2026-05-25',
    method: 'transfer',
    title: '5월 직원 급여 지급',
    memo: '임직원 급여 정기 이체'
  },
  {
    id: 'tx-9',
    type: 'income',
    amount: 6400000,
    category: '매출/판매액',
    date: '2026-05-24',
    method: 'transfer',
    title: '신규 에이전시 웹 구축 선금',
    memo: '계약금 30% 입금 확인'
  },
  {
    id: 'tx-10',
    type: 'expense',
    amount: 1200000,
    category: '사무실 임차료/공과금',
    date: '2026-05-20',
    method: 'transfer',
    title: '5월 여울 공유오피스 임차료',
    memo: '서울벤처타워 6층 정기 결제 건'
  },
  {
    id: 'tx-11',
    type: 'expense',
    amount: 600000,
    category: '마케팅/광고',
    date: '2026-05-12',
    method: 'card',
    title: '디스플레이 배너 마케팅 대금',
    memo: '네이버 키워드 광고 및 GDN 캠페인'
  },
  {
    id: 'tx-12',
    type: 'expense',
    amount: 320000,
    category: '소프트웨어/SaaS',
    date: '2026-05-02',
    method: 'card',
    title: 'AWS 클라우드 인프라 비용',
    memo: '서버 호스팅 및 SaaS 툴 구독'
  }
];

const DEFAULT_BUDGETS: Budget[] = [
  { category: '인건비/급여', limit: 4000000 },
  { category: '마케팅/광고', limit: 1000000 },
  { category: '자재/원가', limit: 2000000 },
  { category: '사무실 임차료/공과금', limit: 1500000 },
  { category: '소프트웨어/SaaS', limit: 500000 },
  { category: '사업 운영비', limit: 500000 },
  { category: '세금/공과금', limit: 300000 },
  { category: '기타 지출', limit: 200000 }
];

const DEFAULT_COMPANY: CompanyInfo = {
  name: '여울 (Yeoul)',
  currency: '₩'
};

export const useLedger = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);

  // Load initial data from localStorage or fallback to seeds
  useEffect(() => {
    try {
      const storedTxs = localStorage.getItem('yeoul_ledger_transactions');
      const storedBudgets = localStorage.getItem('yeoul_ledger_budgets');
      const storedCompany = localStorage.getItem('yeoul_ledger_company');

      if (storedTxs) {
        setTransactions(JSON.parse(storedTxs));
      } else {
        setTransactions(MOCK_TRANSACTIONS);
        localStorage.setItem('yeoul_ledger_transactions', JSON.stringify(MOCK_TRANSACTIONS));
      }

      if (storedBudgets) {
        setBudgets(JSON.parse(storedBudgets));
      } else {
        setBudgets(DEFAULT_BUDGETS);
        localStorage.setItem('yeoul_ledger_budgets', JSON.stringify(DEFAULT_BUDGETS));
      }

      if (storedCompany) {
        setCompanyInfo(JSON.parse(storedCompany));
      } else {
        setCompanyInfo(DEFAULT_COMPANY);
        localStorage.setItem('yeoul_ledger_company', JSON.stringify(DEFAULT_COMPANY));
      }
    } catch (e) {
      console.error('Failed to load ledger data from localStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save changes helper
  const saveTransactionsState = (newTxs: Transaction[]) => {
    setTransactions(newTxs);
    localStorage.setItem('yeoul_ledger_transactions', JSON.stringify(newTxs));
  };

  const saveBudgetsState = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    localStorage.setItem('yeoul_ledger_budgets', JSON.stringify(newBudgets));
  };

  const saveCompanyState = (newCompany: CompanyInfo) => {
    setCompanyInfo(newCompany);
    localStorage.setItem('yeoul_ledger_company', JSON.stringify(newCompany));
  };

  // Transaction Actions
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`
    };
    const updated = [newTx, ...transactions].sort((a, b) => b.date.localeCompare(a.date));
    saveTransactionsState(updated);
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    const updated = transactions.map((tx) =>
      tx.id === id ? { ...tx, ...updatedFields } : tx
    ).sort((a, b) => b.date.localeCompare(a.date));
    saveTransactionsState(updated);
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter((tx) => tx.id !== id);
    saveTransactionsState(updated);
  };

  // Budget Actions
  const setBudget = (category: string, limit: number) => {
    let updated: Budget[];
    const exists = budgets.some((b) => b.category === category);
    if (exists) {
      updated = budgets.map((b) => (b.category === category ? { ...b, limit } : b));
    } else {
      updated = [...budgets, { category, limit }];
    }
    saveBudgetsState(updated);
  };

  // Company Actions
  const updateCompanyInfo = (info: CompanyInfo) => {
    saveCompanyState(info);
  };

  // Export to CSV helper
  const exportToCSV = () => {
    const headers = ['ID', '구분', '날짜', '카테고리', '금액', '결제수단', '내역', '메모'];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.type === 'income' ? '수입' : '지출',
      tx.date,
      tx.category,
      tx.amount,
      tx.method === 'card' ? '카드' : tx.method === 'transfer' ? '계좌이체' : '현금',
      tx.title.replace(/"/g, '""'),
      tx.memo.replace(/"/g, '""')
    ]);

    // UTF-8 with BOM for Excel compatibility (Korean character encoding support)
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${companyInfo.name}_가계부_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Backup state as JSON file
  const exportToJSON = () => {
    const dataStr = JSON.stringify({
      transactions,
      budgets,
      companyInfo,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${companyInfo.name}_가계부_백업_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore state from uploaded JSON backup
  const importFromJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.transactions) && Array.isArray(data.budgets)) {
        // Simple structure validation
        const isValidTx = data.transactions.every((tx: any) => 
          typeof tx.id === 'string' && 
          (tx.type === 'income' || tx.type === 'expense') &&
          typeof tx.amount === 'number' &&
          typeof tx.category === 'string' &&
          typeof tx.date === 'string' &&
          typeof tx.title === 'string'
        );

        if (!isValidTx) {
          throw new Error('Invalid transaction data format');
        }

        saveTransactionsState(data.transactions);
        saveBudgetsState(data.budgets);
        if (data.companyInfo) {
          saveCompanyState(data.companyInfo);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import backup file:', e);
      return false;
    }
  };

  // Clear data and start fresh
  const resetData = () => {
    saveTransactionsState([]);
    saveBudgetsState(DEFAULT_BUDGETS);
    saveCompanyState(DEFAULT_COMPANY);
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
    resetData
  };
};
