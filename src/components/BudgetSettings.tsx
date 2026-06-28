import React, { useState } from 'react';
import { Settings, Save, Edit3, ShieldAlert } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../hooks/useLedger';
import type { Budget, Transaction } from '../hooks/useLedger';

interface BudgetSettingsProps {
  budgets: Budget[];
  transactions: Transaction[];
  onSetBudget: (category: string, limit: number) => void;
}

export const BudgetSettings: React.FC<BudgetSettingsProps> = ({
  budgets,
  transactions,
  onSetBudget
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLimitStr, setEditLimitStr] = useState('');

  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM

  // Calculate actual expenditure for each category in the current month
  const categoryExpenses = React.useMemo(() => {
    const expensesMap: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      expensesMap[cat] = 0;
    });

    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonthStr)) {
        expensesMap[tx.category] = (expensesMap[tx.category] || 0) + tx.amount;
      }
    });

    return expensesMap;
  }, [transactions, currentMonthStr]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const getBudgetLimit = (category: string) => {
    const budget = budgets.find((b) => b.category === category);
    return budget ? budget.limit : 0;
  };

  const handleStartEdit = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setEditLimitStr(currentLimit === 0 ? '' : currentLimit.toString());
  };

  const handleSaveBudget = (category: string) => {
    const limit = parseInt(editLimitStr, 10);
    if (isNaN(limit) || limit < 0) {
      alert('올바른 예산 금액을 입력해 주세요.');
      return;
    }
    onSetBudget(category, limit);
    setEditingCategory(null);
  };

  const getBudgetStatus = (spent: number, limit: number) => {
    if (limit === 0) return { label: '예산 미지정', className: 'method', percent: 0 };
    const percent = Math.round((spent / limit) * 100);
    if (percent >= 100) return { label: '예산 초과', className: 'danger', percent };
    if (percent >= 80) return { label: '경고 임박', className: 'warn', percent };
    return { label: '안정', className: 'ok', percent };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title section */}
      <div className="filter-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="summary-icon-wrapper budget" style={{ width: '48px', height: '48px' }}>
            <Settings size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>
              기업 예산 및 통제 설정
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              각 카테고리별 월간 예산 한도를 설정하여 회사의 과지출을 미연에 방지할 수 있습니다. (당월 기준: {currentMonthStr.split('-')[0]}년 {currentMonthStr.split('-')[1]}월)
            </p>
          </div>
        </div>
      </div>

      {/* Grid of budgets */}
      <div className="budget-grid">
        {EXPENSE_CATEGORIES.map((cat) => {
          const limit = getBudgetLimit(cat);
          const spent = categoryExpenses[cat] || 0;
          const status = getBudgetStatus(spent, limit);
          const isEditing = editingCategory === cat;

          return (
            <div key={cat} className="budget-card">
              <div className="budget-info-row">
                <span className="budget-info-title">{cat}</span>
                <span className={`budget-status-tag ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <div className="budget-info-row" style={{ alignItems: 'flex-end', minHeight: '52px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>이번 달 누적 지출</span>
                  <span className="budget-spent">{formatNumber(spent)} 원</span>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '120px', textAlign: 'right', padding: '6px 10px', fontSize: '14px' }}
                      value={editLimitStr}
                      onChange={(e) => setEditLimitStr(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="한도 금액"
                      autoFocus
                    />
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => handleSaveBudget(cat)}
                    >
                      <Save size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span className="budget-limit">
                      예산 한도: {limit === 0 ? '설정 없음' : `${formatNumber(limit)} 원`}
                    </span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', gap: '4px', marginTop: '4px' }}
                      onClick={() => handleStartEdit(cat, limit)}
                    >
                      <Edit3 size={11} /> 한도 변경
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {limit > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(status.percent, 100)}%`,
                        backgroundColor:
                          status.percent >= 100
                            ? 'var(--expense)'
                            : status.percent >= 80
                            ? 'var(--warning)'
                            : 'var(--primary)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>예산 대비 집행률: {status.percent}%</span>
                    {status.percent >= 100 && (
                      <span style={{ color: 'var(--expense)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ShieldAlert size={12} /> 예산 초과 발생!
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
