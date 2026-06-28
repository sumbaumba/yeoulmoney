import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Search, Calendar } from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../hooks/useLedger';
import type { Transaction } from '../hooks/useLedger';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  
  // Default to showing the current month for cleaner initial view, but allow "all"
  const [filterMonth, setFilterMonth] = useState<string>('all'); // "all" or "YYYY-MM"

  // Collect all unique months in transactions to populate month filter
  const transactionMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      monthsSet.add(tx.date.substring(0, 7));
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Combine categories for dropdown filter
  const allCategories = useMemo(() => {
    return [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];
  }, []);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Search term match
      const matchesSearch =
        tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.memo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Type match
      const matchesType = filterType === 'all' || tx.type === filterType;

      // 3. Category match
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;

      // 4. Method match
      const matchesMethod = filterMethod === 'all' || tx.method === filterMethod;

      // 5. Month match
      const matchesMonth = filterMonth === 'all' || tx.date.startsWith(filterMonth);

      return matchesSearch && matchesType && matchesCategory && matchesMethod && matchesMonth;
    });
  }, [transactions, searchTerm, filterType, filterCategory, filterMethod, filterMonth]);

  // Calculate sums for the currently filtered list
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'card':
        return '법인카드';
      case 'transfer':
        return '계좌이체';
      case 'cash':
        return '현금';
      default:
        return method;
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    if (window.confirm(`"${title}" 거래 내역을 삭제하시겠습니까?`)) {
      onDelete(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filter and Search Panel */}
      <div className="filter-panel">
        <div className="filter-grid">
          {/* Search Term */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>검색</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="거래 내용, 분류, 메모 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="form-group">
            <label>구분</label>
            <select
              className="form-control"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">전체 내역</option>
              <option value="income">수입 (+)</option>
              <option value="expense">지출 (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="form-group">
            <label>분류 카테고리</label>
            <select
              className="form-control"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">모든 분류</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="form-group">
            <label>기간 (월별)</label>
            <select
              className="form-control"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="all">전체 기간</option>
              {transactionMonths.map((m) => {
                const [year, month] = m.split('-');
                return (
                  <option key={m} value={m}>
                    {year}년 {month}월
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Extended Filter Options */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '14px', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Payment Method Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>결제수단:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'transfer', 'card', 'cash'].map((m) => (
                <button
                  key={m}
                  className={`btn btn-secondary`}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: filterMethod === m ? 'var(--bg-hover)' : 'transparent',
                    borderColor: filterMethod === m ? 'var(--text-muted)' : 'var(--border-light)'
                  }}
                  onClick={() => setFilterMethod(m)}
                >
                  {m === 'all' ? '전체' : getMethodLabel(m)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Clear */}
          {(searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterMethod !== 'all' || filterMonth !== 'all') && (
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterMethod('all');
                setFilterMonth('all');
              }}
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Header for Search Matches */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
          검색 결과: <strong style={{ color: 'var(--text-main)' }}>{filteredTransactions.length}</strong>건의 내역
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 600 }}>
          <span style={{ color: 'var(--income)' }}>수입 총합: +{formatNumber(filteredSummary.income)}원</span>
          <span style={{ color: 'var(--expense)' }}>지출 총합: -{formatNumber(filteredSummary.expense)}원</span>
          <span style={{ color: filteredSummary.balance >= 0 ? 'var(--primary)' : 'var(--expense)' }}>
            순이익: {filteredSummary.balance >= 0 ? '+' : ''}{formatNumber(filteredSummary.balance)}원
          </span>
        </div>
      </div>

      {/* Transaction Table */}
      {filteredTransactions.length > 0 ? (
        <div className="table-container">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>구분</th>
                <th>분류 카테고리</th>
                <th>거래 내역 / 거래처</th>
                <th>결제 수단</th>
                <th style={{ textAlign: 'right' }}>금액</th>
                <th style={{ textAlign: 'center', width: '90px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {tx.date}
                  </td>
                  <td>
                    <span className={`badge ${tx.type}`}>
                      {tx.type === 'income' ? '수입' : '지출'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '13px' }}>
                    {tx.category}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tx.title}</div>
                    {tx.memo && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {tx.memo}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge method">
                      {getMethodLabel(tx.method)}
                    </span>
                  </td>
                  <td style={{
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)',
                    whiteSpace: 'nowrap'
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)}원
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      <button
                        className="btn-icon-only"
                        title="수정"
                        onClick={() => onEdit(tx)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-icon-only danger"
                        title="삭제"
                        onClick={() => handleDeleteClick(tx.id, tx.title)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-panel" style={{ padding: '60px 24px' }}>
          <div className="empty-state">
            <Calendar className="empty-state-icon" size={48} />
            <div>
              <h4 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
                조건에 맞는 거래 내역이 없습니다
              </h4>
              <p style={{ fontSize: '13px' }}>
                검색어나 선택하신 필터 설정을 변경해 보세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
