import React, { useState, useEffect } from 'react';
import { X, Percent, RefreshCw } from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../hooks/useLedger';
import type { Transaction } from '../hooks/useLedger';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  transaction?: Transaction | null;
  prefillDate?: string | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  prefillDate,
}) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState<'card' | 'transfer' | 'cash'>('transfer');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [vatIncluded, setVatIncluded] = useState(false);
  const [recurring, setRecurring] = useState(false);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // Sync state with transaction if editing
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmountStr(transaction.baseAmount.toString());
      setCategory(transaction.category);
      setDate(transaction.date);
      setMethod(transaction.method);
      setTitle(transaction.title);
      setMemo(transaction.memo);
      setVatIncluded(transaction.vatIncluded ?? false);
      setRecurring(transaction.recurring ?? false);
    } else {
      setType('expense');
      setAmountStr('');
      setCategory(EXPENSE_CATEGORIES[0]);
      // 달력에서 날짜를 지정했으면 해당 날짜로 설정, 아니면 오늘
      setDate(prefillDate ?? new Date().toISOString().split('T')[0]);
      setMethod('transfer');
      setTitle('');
      setMemo('');
      setVatIncluded(false);
      setRecurring(false);
    }
  }, [transaction, isOpen, prefillDate]);

  // 구분 변경 시 카테고리 자동 전환
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

  const baseAmount = parseInt(amountStr, 10) || 0;
  // 부가세 포함 시 10% 추가
  const vatAmount = vatIncluded ? Math.round(baseAmount * 0.1) : 0;
  const finalAmount = baseAmount + vatAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(baseAmount) || baseAmount <= 0) {
      alert('올바른 금액을 입력해 주세요.');
      return;
    }
    if (!title.trim()) {
      alert('내용을 입력해 주세요.');
      return;
    }

    onSave({
      type,
      amount: finalAmount,
      baseAmount,
      vatIncluded,
      recurring,
      category,
      date,
      method,
      title: title.trim(),
      memo: memo.trim()
    });
    onClose();
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // 토글 버튼 공통 스타일
  const toggleStyle = (active: boolean, color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    border: `1.5px solid ${active ? color : 'var(--border-light)'}`,
    background: active ? `${color}18` : 'transparent',
    color: active ? color : 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexGrow: 1,
    justifyContent: 'center'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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

            {/* 구분 토글 */}
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

            {/* 부가세 + 매달 반복 버튼 */}
            <div className="form-group">
              <label>옵션</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* 부가세 버튼 */}
                <button
                  type="button"
                  style={toggleStyle(vatIncluded, '#f59e0b')}
                  onClick={() => setVatIncluded(v => !v)}
                >
                  <Percent size={14} />
                  부가세 (VAT 10%)
                  {vatIncluded && <span style={{
                    background: '#f59e0b',
                    color: '#fff',
                    borderRadius: '4px',
                    padding: '1px 5px',
                    fontSize: '10px',
                    fontWeight: 800,
                    marginLeft: '2px'
                  }}>ON</span>}
                </button>

                {/* 매달 반복 버튼 */}
                <button
                  type="button"
                  style={toggleStyle(recurring, '#8b5cf6')}
                  onClick={() => setRecurring(r => !r)}
                >
                  <RefreshCw size={14} />
                  매달 반복
                  {recurring && <span style={{
                    background: '#8b5cf6',
                    color: '#fff',
                    borderRadius: '4px',
                    padding: '1px 5px',
                    fontSize: '10px',
                    fontWeight: 800,
                    marginLeft: '2px'
                  }}>ON</span>}
                </button>
              </div>

              {/* 옵션 설명 메시지 */}
              {(vatIncluded || recurring) && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {vatIncluded && (
                    <span>📊 <strong style={{ color: '#f59e0b' }}>부가세 포함:</strong> 입력 금액에 10% VAT를 더하여 저장합니다.</span>
                  )}
                  {recurring && (
                    <span>🔄 <strong style={{ color: '#8b5cf6' }}>매달 반복:</strong> 선택한 날짜부터 12개월치 거래가 자동 등록됩니다.</span>
                  )}
                </div>
              )}
            </div>

            {/* 내용 */}
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

            {/* 금액 입력 + 부가세 계산 표시 */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="tx-amount">금액 (원)</label>
                {baseAmount > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    {vatIncluded && (
                      <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                        공급가 {formatNumber(baseAmount)}원 + 부가세 {formatNumber(vatAmount)}원
                      </span>
                    )}
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: type === 'income' ? 'var(--income)' : 'var(--expense)'
                    }}>
                      최종 ₩ {formatNumber(finalAmount)} 원
                    </span>
                  </div>
                )}
              </div>
              <input
                id="tx-amount"
                type="text"
                className="form-control form-control-money"
                placeholder="0"
                value={amountStr ? formatNumber(baseAmount) : ''}
                onChange={handleAmountChange}
                required
              />
            </div>

            {/* 날짜 + 카테고리 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label htmlFor="tx-date">
                  날짜 {recurring && <span style={{ color: '#8b5cf6', fontSize: '11px' }}>(반복 시작일)</span>}
                </label>
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

            {/* 결제 수단 */}
            <div className="form-group">
              <label htmlFor="tx-method">결제 수단</label>
              <select
                id="tx-method"
                className="form-control"
                value={method}
                onChange={(e) => setMethod(e.target.value as 'card' | 'transfer' | 'cash')}
                required
              >
                <option value="transfer">계좌이체 / 은행 송금</option>
                <option value="card">법인카드 / 신용카드</option>
                <option value="cash">현금 / 소액 현금</option>
              </select>
            </div>

            {/* 메모 */}
            <div className="form-group">
              <label htmlFor="tx-memo">상세 메모</label>
              <textarea
                id="tx-memo"
                className="form-control"
                placeholder="상세 정보를 적어주세요. (예: 주거래은행 이체 건, 부가세 포함 등)"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              {recurring ? `저장 (12개월 자동 등록)` : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
