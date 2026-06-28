import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, AlertCircle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../hooks/useLedger';
import type { Transaction, Budget } from '../hooks/useLedger';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  companyInfo: { name: string; currency: string };
  onNavigateToTx: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  budgets,
  companyInfo,
  onNavigateToTx
}) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 1. Overall & Monthly calculations
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        if (tx.date.startsWith(currentMonthStr)) {
          monthIncome += tx.amount;
        }
      } else {
        totalExpense += tx.amount;
        if (tx.date.startsWith(currentMonthStr)) {
          monthExpense += tx.amount;
        }
      }
    });

    const totalBalance = totalIncome - totalExpense;
    const monthBalance = monthIncome - monthExpense;

    // Monthly budget comparison
    const monthBudgetLimit = budgets.reduce((acc, curr) => acc + curr.limit, 0);
    const budgetPercent = monthBudgetLimit > 0 ? Math.round((monthExpense / monthBudgetLimit) * 100) : 0;

    return {
      totalBalance,
      monthIncome,
      monthExpense,
      monthBalance,
      monthBudgetLimit,
      budgetPercent
    };
  }, [transactions, budgets, currentMonthStr]);

  // 2. Budget status warnings
  const budgetAlerts = useMemo(() => {
    const alerts: { category: string; limit: number; spent: number; percent: number; type: 'danger' | 'warning' }[] = [];
    
    // Group current month's expenses by category
    const currentMonthExpenses: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonthStr)) {
        currentMonthExpenses[tx.category] = (currentMonthExpenses[tx.category] || 0) + tx.amount;
      }
    });

    budgets.forEach((b) => {
      const spent = currentMonthExpenses[b.category] || 0;
      if (b.limit > 0) {
        const percent = Math.round((spent / b.limit) * 100);
        if (percent >= 100) {
          alerts.push({ category: b.category, limit: b.limit, spent, percent, type: 'danger' });
        } else if (percent >= 80) {
          alerts.push({ category: b.category, limit: b.limit, spent, percent, type: 'warning' });
        }
      }
    });

    return alerts;
  }, [transactions, budgets, currentMonthStr]);

  // 3. Category breakdown (Donut Chart calculations)
  const categoryBreakdown = useMemo(() => {
    const expensesGrouped: Record<string, number> = {};
    let totalExpenseInMonth = 0;

    EXPENSE_CATEGORIES.forEach((cat) => {
      expensesGrouped[cat] = 0;
    });

    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonthStr)) {
        expensesGrouped[tx.category] = (expensesGrouped[tx.category] || 0) + tx.amount;
        totalExpenseInMonth += tx.amount;
      }
    });

    // Color palette for categories
    const colors: Record<string, string> = {
      '인건비/급여': '#3b82f6', // blue
      '마케팅/광고': '#ec4899', // pink
      '자재/원가': '#f59e0b', // orange/amber
      '사무실 임차료/공과금': '#8b5cf6', // purple
      '소프트웨어/SaaS': '#06b6d4', // cyan
      '사업 운영비': '#10b981', // green
      '세금/공과금': '#64748b', // slate
      '기타 지출': '#a8a29e'  // stone
    };

    const items = Object.entries(expensesGrouped)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenseInMonth > 0 ? Math.round((amount / totalExpenseInMonth) * 100) : 0,
        color: colors[category] || '#cbd5e1'
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return { items, totalExpenseInMonth };
  }, [transactions, currentMonthStr]);

  // 4. Trend Chart (Line chart calculations) - last 5 months with data
  const trendData = useMemo(() => {
    // Generate chronological list of last 5 months
    const months: string[] = [];
    const date = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push(d.toISOString().substring(0, 7)); // YYYY-MM
    }

    const monthlyValues = months.map((m) => {
      let income = 0;
      let expense = 0;
      transactions.forEach((tx) => {
        if (tx.date.startsWith(m)) {
          if (tx.type === 'income') {
            income += tx.amount;
          } else {
            expense += tx.amount;
          }
        }
      });
      return { month: m, income, expense };
    });

    const maxVal = Math.max(...monthlyValues.map((d) => Math.max(d.income, d.expense)), 1000000);

    return { monthlyValues, maxVal };
  }, [transactions]);

  // 5. Recent 5 Transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // SVG Chart rendering helper coordinates
  const svgWidth = 500;
  const svgHeight = 180;
  const paddingX = 45;
  const paddingY = 20;

  const points = useMemo(() => {
    const { monthlyValues, maxVal } = trendData;
    const count = monthlyValues.length;

    const incomePts = monthlyValues.map((val, idx) => {
      const x = paddingX + (idx * (svgWidth - 2 * paddingX)) / (count - 1);
      const y = svgHeight - paddingY - (val.income / maxVal) * (svgHeight - 2 * paddingY);
      return { x, y, val: val.income, month: val.month };
    });

    const expensePts = monthlyValues.map((val, idx) => {
      const x = paddingX + (idx * (svgWidth - 2 * paddingX)) / (count - 1);
      const y = svgHeight - paddingY - (val.expense / maxVal) * (svgHeight - 2 * paddingY);
      return { x, y, val: val.expense, month: val.month };
    });

    return { incomePts, expensePts };
  }, [trendData]);

  // SVG Donut slice rendering calculation
  const donutRadius = 55;
  const donutCircumference = 2 * Math.PI * donutRadius;
  
  let accumulatedPercent = 0;
  const donutSegments = categoryBreakdown.items.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * donutCircumference} ${donutCircumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * donutCircumference);
    accumulatedPercent += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Summary Cards */}
      <div className="summary-grid">
        {/* Net Assets/Balance */}
        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-title">전체 누적 잔액</span>
            <div className="summary-icon-wrapper balance">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <h2 className="summary-value" style={{ color: stats.totalBalance >= 0 ? 'var(--primary)' : 'var(--expense)' }}>
              {companyInfo.currency} {formatNumber(stats.totalBalance)} 원
            </h2>
            <div className="summary-subtext">
              <Activity size={12} /> 전체 수입 - 지출 정산액
            </div>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-title">당월 총 수입</span>
            <div className="summary-icon-wrapper income">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <h2 className="summary-value" style={{ color: 'var(--income)' }}>
              +{companyInfo.currency} {formatNumber(stats.monthIncome)} 원
            </h2>
            <div className="summary-subtext">
              <span style={{ color: 'var(--income)', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                <ArrowUpRight size={12} /> 이번 달
              </span>
              에 입금된 자금
            </div>
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-title">당월 총 지출</span>
            <div className="summary-icon-wrapper expense">
              <TrendingDown size={18} />
            </div>
          </div>
          <div>
            <h2 className="summary-value" style={{ color: 'var(--expense)' }}>
              -{companyInfo.currency} {formatNumber(stats.monthExpense)} 원
            </h2>
            <div className="summary-subtext">
              <span style={{ color: 'var(--expense)', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                <ArrowDownRight size={12} /> 이번 달
              </span>
              에 출금된 자금
            </div>
          </div>
        </div>

        {/* Monthly Budget status */}
        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-title">당월 예산 소진율</span>
            <div className="summary-icon-wrapper budget">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <h2 className="summary-value" style={{ color: stats.budgetPercent >= 100 ? 'var(--expense)' : stats.budgetPercent >= 80 ? 'var(--warning)' : 'var(--text-main)' }}>
              {stats.budgetPercent}%
            </h2>
            <div className="summary-subtext" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              총 예산: {formatNumber(stats.monthBudgetLimit)}원 중 {formatNumber(stats.monthExpense)}원
            </div>
          </div>
        </div>
      </div>

      {/* 2. Budget Alert Banners */}
      {budgetAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {budgetAlerts.map((alert) => (
            <div key={alert.category} className={`alert-banner ${alert.type}`}>
              <AlertCircle className="alert-icon" size={16} />
              <div className="alert-message-content">
                {alert.type === 'danger' ? (
                  <>
                    <strong style={{ fontWeight: 700 }}>[예산 초과 경보] </strong>
                    <strong style={{ fontWeight: 700 }}>{alert.category}</strong> 카테고리의 당월 지출(
                    {formatNumber(alert.spent)}원)이 설정된 예산 한도({formatNumber(alert.limit)}원)를 초과했습니다! (초과액: {formatNumber(alert.spent - alert.limit)}원)
                  </>
                ) : (
                  <>
                    <strong style={{ fontWeight: 700 }}>[과지출 경고] </strong>
                    <strong style={{ fontWeight: 700 }}>{alert.category}</strong> 카테고리의 예산 소진율이 {alert.percent}%에 달해 예산 소진 한도 임박 상태입니다. (남은 예산: {formatNumber(alert.limit - alert.spent)}원)
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Charts Grid */}
      <div className="dashboard-grid">
        {/* Trend Area Chart (Income vs Expense) */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">수입/지출 현황 및 추이</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>최근 5개월 자금 흐름</span>
          </div>

          <div className="chart-container">
            <svg className="chart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              <defs>
                <linearGradient id="income-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--income)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--income)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="expense-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--expense)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--expense)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingY + ratio * (svgHeight - 2 * paddingY);
                return (
                  <line
                    key={idx}
                    className="chart-grid-line"
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                  />
                );
              })}

              {/* Income Area & Line */}
              {points.incomePts.length > 1 && (
                <>
                  <path
                    className="chart-area-income"
                    d={`
                      M ${points.incomePts[0].x} ${svgHeight - paddingY}
                      ${points.incomePts.map(p => `L ${p.x} ${p.y}`).join(' ')}
                      L ${points.incomePts[points.incomePts.length - 1].x} ${svgHeight - paddingY} Z
                    `}
                  />
                  <path
                    className="chart-line-income"
                    d={points.incomePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  />
                </>
              )}

              {/* Expense Area & Line */}
              {points.expensePts.length > 1 && (
                <>
                  <path
                    className="chart-area-expense"
                    d={`
                      M ${points.expensePts[0].x} ${svgHeight - paddingY}
                      ${points.expensePts.map(p => `L ${p.x} ${p.y}`).join(' ')}
                      L ${points.expensePts[points.expensePts.length - 1].x} ${svgHeight - paddingY} Z
                    `}
                  />
                  <path
                    className="chart-line-expense"
                    d={points.expensePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  />
                </>
              )}

              {/* Interaction Dots & Value Tooltips */}
              {points.incomePts.map((p, idx) => (
                <g key={`inc-dot-${idx}`}>
                  <circle className="chart-dot income" cx={p.x} cy={p.y} r={4.5} />
                  {/* Floating Amount (Simple label above dot) */}
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    style={{ fontSize: '8px', fill: 'var(--income)', fontWeight: '700' }}
                  >
                    {p.val > 0 ? `${Math.round(p.val / 10000)}만` : ''}
                  </text>
                </g>
              ))}

              {points.expensePts.map((p, idx) => (
                <g key={`exp-dot-${idx}`}>
                  <circle className="chart-dot expense" cx={p.x} cy={p.y} r={4.5} />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    style={{ fontSize: '8px', fill: 'var(--expense)', fontWeight: '700' }}
                  >
                    {p.val > 0 ? `${Math.round(p.val / 10000)}만` : ''}
                  </text>
                </g>
              ))}

              {/* Bottom Month Labels */}
              {trendData.monthlyValues.map((val, idx) => {
                const x = paddingX + (idx * (svgWidth - 2 * paddingX)) / (trendData.monthlyValues.length - 1);
                const [, month] = val.month.split('-');
                return (
                  <text
                    key={idx}
                    className="chart-axis-text"
                    x={x}
                    y={svgHeight - 4}
                    textAnchor="middle"
                  >
                    {month}월
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Legends */}
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color income" />
              <span>수입 (+입금)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color expense" />
              <span>지출 (-출금)</span>
            </div>
          </div>
        </div>

        {/* Expenses Category Breakdown (Donut Chart) */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">지출 항목별 비중</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>이번 달 기준</span>
          </div>

          {categoryBreakdown.items.length > 0 ? (
            <div className="donut-container">
              <div className="donut-svg-wrapper">
                <svg width="100%" height="100%" viewBox="0 0 160 160">
                  <circle className="donut-ring-background" cx="80" cy="80" r={donutRadius} />
                  {donutSegments.map((segment) => (
                    <circle
                      key={segment.category}
                      className="donut-segment"
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      stroke={segment.color}
                      strokeDasharray={segment.strokeDasharray}
                      strokeDashoffset={segment.strokeDashoffset}
                      transform="rotate(-90 80 80)"
                    />
                  ))}
                </svg>
                <div className="donut-center-text">
                  <div className="donut-center-value">{formatNumber(categoryBreakdown.totalExpenseInMonth)}</div>
                  <div className="donut-center-label">지출 합계 (원)</div>
                </div>
              </div>

              {/* Progress list showing top spenders */}
              <div className="category-progress-list">
                {categoryBreakdown.items.slice(0, 4).map((item) => (
                  <div key={item.category} className="progress-item">
                    <div className="progress-label-row">
                      <span className="progress-name">
                        <div className="progress-color-dot" style={{ backgroundColor: item.color }} />
                        {item.category}
                      </span>
                      <span className="progress-percentage">{item.percentage}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ minHeight: '220px', justifyContent: 'center' }}>
              <PieChart className="empty-state-icon" size={40} />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>지출 데이터 없음</h4>
                <p style={{ fontSize: '11px', marginTop: '4px' }}>이번 달 등록된 지출 거래 건이 없습니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Recent Transactions List */}
      <div className="dashboard-panel">
        <div className="panel-header">
          <h3 className="panel-title">최근 등록된 거래 내역</h3>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={onNavigateToTx}>
            전체 보기
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="table-container">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>구분</th>
                  <th>카테고리</th>
                  <th>거래 내역</th>
                  <th style={{ textAlign: 'right' }}>금액</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{tx.date}</td>
                    <td>
                      <span className={`badge ${tx.type}`}>
                        {tx.type === 'income' ? '수입' : '지출'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{tx.category}</td>
                    <td style={{ fontWeight: 600 }}>{tx.title}</td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)'
                    }}>
                      {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Activity className="empty-state-icon" size={32} />
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>최근 내역이 비어 있습니다</h4>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>새로운 수입이나 지출 거래를 추가하여 시작해 보세요.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
