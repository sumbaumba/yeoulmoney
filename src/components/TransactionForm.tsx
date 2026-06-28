import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../hooks/useLedger';
import type { Transaction } from '../hooks/useLedger';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  transaction?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction
}) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState<'card' | 'transfer' | 'cash'>('transfer');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');

  // Format helper: Number to localized string
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // Sync state with transaction if editing
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmountStr(transaction.amount.toString());
      setCategory(transaction.category);
      setDate(transaction.date);
      setMethod(transaction.method);
      setTitle(transaction.title);
      setMemo(transaction.memo);
    } else {
      // Set defaults for new transaction
      setType('expense');
      setAmountStr('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setMethod('transfer');
      setTitle('');
      setMemo('');
    }
  }, [transaction, isOpen]);

  // Adjust category automatically when switching type
  useEffect(() => {
    if (!transaction) {
      if (type === 'income') {
        setCategory(INCOME_CATEGORIES[0]);
      } else {
        setCategory(EXPENSE_CATEGORIES[0]);
      }
    }
  }, [type, transaction]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(rawVal);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('올바른 금액을 입력해 주세요.');
      return;
    }
    if (!title.trim()) {
      alert('내용을 입력해 주세요.');
      return;
    }

    onSave({
      type,
      amount,
      category,
      date,
      method,
      title: title.trim(),
      memo: memo.trim()
    });
    onClose();
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const numValue = parseInt(amountStr, 10) || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {transaction ? '거래 내역 수정' : '새 거래 내역 추가'}
          </h3>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type Switcher */}
            <div className="form-group">
              <label>구분</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn ${type === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ flexGrow: 1 }}
                  onClick={() => setType('expense')}
                >
                  지출
                </button>
                <button
                  type="button"
                  className={`btn ${type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flexGrow: 1 }}
                  onClick={() => setType('income')}
                >
                  수입
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="tx-title">내용 / 거래처</label>
              <input
                id="tx-title"
                type="text"
                className="form-control"
                placeholder="예: 6월 공유오피스 임차료, 원자재 구매"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Amount */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="tx-amount">금액 (원)</label>
                {numValue > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                    ₩ {formatNumber(numValue)} 원
                  </span>
                )}
              </div>
              <input
                id="tx-amount"
                type="text"
                className="form-control form-control-money"
                placeholder="0"
                value={amountStr ? formatNumber(numValue) : ''}
                onChange={handleAmountChange}
                required
              />
            </div>

            {/* Date and Category Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label htmlFor="tx-date">날짜</label>
                <input
                  id="tx-date"
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="tx-category">분류 카테고리</label>
                <select
                  id="tx-category"
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label htmlFor="tx-method">결제 수단</label>
              <select
                id="tx-method"
                className="form-control"
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                required
              >
                <option value="transfer">계좌이체 / 은행 송금</option>
                <option value="card">법인카드 / 신용카드</option>
                <option value="cash">현금 / 소액 현금</option>
              </select>
            </div>

            {/* Memo */}
            <div className="form-group">
              <label htmlFor="tx-memo">상세 메모</label>
              <textarea
                id="tx-memo"
                className="form-control"
                placeholder="상세 정보를 적어주세요. (예: 주거래은행 이체 건, 부가세 포함 등)"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
