import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown } from 'lucide-react';
import type { Transaction } from '../hooks/useLedger';

interface CalendarViewProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onAddForDate: (date: string) => void;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  transactions,
  onEdit,
  onDelete,
  onAddForDate,
}) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('ko-KR').format(num);

  /* ── 이번 달 날짜 그리드 계산 ── */
  const { calendarDays, monthStr } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=일
    const lastDate = new Date(year, month + 1, 0).getDate();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    // 앞 빈칸 + 실제 날짜 배열
    const days: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: lastDate }, (_, i) => i + 1),
    ];
    // 6주(42칸) 맞추기
    while (days.length < 42) days.push(null);

    return { calendarDays: days, monthStr };
  }, [year, month]);

  /* ── 날짜별 거래 그룹핑 ── */
  const txByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      if (!map[tx.date]) map[tx.date] = [];
      map[tx.date].push(tx);
    });
    return map;
  }, [transactions]);

  /* ── 선택 날짜의 거래 + 소계 ── */
  const selectedTxs = selectedDate ? (txByDate[selectedDate] ?? []) : [];
  const selectedSummary = selectedTxs.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  /* ── 이번 달 전체 소계 ── */
  const monthSummary = useMemo(() => {
    let income = 0, expense = 0;
    transactions.forEach((tx) => {
      if (tx.date.startsWith(monthStr)) {
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
      }
    });
    return { income, expense };
  }, [transactions, monthStr]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(null);
  };

  const makeDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isToday = (day: number) => {
    const d = today;
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── 상단 헤더 ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-md)',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* 월 탐색 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-icon-only" onClick={prevMonth} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', minWidth: '140px', textAlign: 'center' }}>
            {year}년 {month + 1}월
          </h2>
          <button className="btn-icon-only" onClick={nextMonth} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
            <ChevronRight size={18} />
          </button>
          <button className="btn btn-secondary" onClick={goToday} style={{ padding: '6px 14px', fontSize: '13px' }}>
            오늘
          </button>
        </div>

        {/* 이번 달 소계 */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--income-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} color="var(--income)" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>이번 달 수입</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--income)' }}>+{formatNumber(monthSummary.income)}원</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--expense-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={15} color="var(--expense)" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>이번 달 지출</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--expense)' }}>-{formatNumber(monthSummary.expense)}원</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 달력 + 상세 패널 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedDate ? '1fr 340px' : '1fr', gap: '20px', alignItems: 'start' }}>

        {/* 달력 그리드 */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}>
          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-light)' }}>
            {DAY_LABELS.map((d, i) => (
              <div key={d} style={{
                padding: '12px 0',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: i === 0 ? 'var(--expense)' : i === 6 ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return (
                  <div key={`empty-${idx}`} style={{
                    minHeight: '90px',
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border-light)' : 'none',
                    borderBottom: idx < 35 ? '1px solid var(--border-light)' : 'none',
                    background: 'var(--bg-app)',
                    opacity: 0.4,
                  }} />
                );
              }

              const dateStr = makeDateStr(day);
              const dayTxs = txByDate[dateStr] ?? [];
              const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
              const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
              const isSelected = selectedDate === dateStr;
              const isSun = idx % 7 === 0;
              const isSat = idx % 7 === 6;
              const _isToday = isToday(day);

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    minHeight: '90px',
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border-light)' : 'none',
                    borderBottom: idx < 35 ? '1px solid var(--border-light)' : 'none',
                    padding: '8px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(14,165,233,0.07)'
                      : 'transparent',
                    transition: 'background 0.12s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {/* 날짜 숫자 */}
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: _isToday ? 800 : 500,
                    color: _isToday
                      ? '#fff'
                      : isSun ? 'var(--expense)' : isSat ? 'var(--primary)' : 'var(--text-main)',
                    background: _isToday ? 'var(--primary)' : 'transparent',
                    marginBottom: '4px',
                    boxShadow: _isToday ? 'var(--shadow-glow)' : 'none',
                  }}>
                    {day}
                  </div>

                  {/* 수입/지출 표시 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayIncome > 0 && (
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--income)',
                        background: 'var(--income-bg)',
                        borderRadius: '3px',
                        padding: '1px 4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        +{formatNumber(dayIncome)}
                      </div>
                    )}
                    {dayExpense > 0 && (
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--expense)',
                        background: 'var(--expense-bg)',
                        borderRadius: '3px',
                        padding: '1px 4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        -{formatNumber(dayExpense)}
                      </div>
                    )}
                    {/* 거래 건수 도트 */}
                    {dayTxs.length > 0 && (
                      <div style={{ display: 'flex', gap: '3px', marginTop: '2px', flexWrap: 'wrap' }}>
                        {dayTxs.slice(0, 4).map((tx) => (
                          <div key={tx.id} style={{
                            width: '6px', height: '6px',
                            borderRadius: '50%',
                            background: tx.type === 'income' ? 'var(--income)' : 'var(--expense)',
                          }} />
                        ))}
                        {dayTxs.length > 4 && (
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: '6px' }}>+{dayTxs.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 선택 표시 */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: '3px',
                      background: 'var(--primary-gradient)',
                      borderRadius: '0',
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 날짜 상세 패널 ── */}
        {selectedDate && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
            animation: 'slideUp 0.2s ease',
          }}>
            {/* 패널 헤더 */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>
                  {selectedDate.replace(/-/g, '.')} 거래 내역
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  총 {selectedTxs.length}건
                </div>
              </div>
              <button className="btn-icon-only" onClick={() => setSelectedDate(null)}>
                <X size={16} />
              </button>
            </div>

            {/* 소계 */}
            {selectedTxs.length > 0 && (
              <div style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                background: 'var(--bg-app)',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--income)', fontWeight: 700 }}>
                  수입 +{formatNumber(selectedSummary.income)}원
                </span>
                <span style={{ fontSize: '12px', color: 'var(--expense)', fontWeight: 700 }}>
                  지출 -{formatNumber(selectedSummary.expense)}원
                </span>
                <span style={{
                  fontSize: '12px', fontWeight: 700,
                  color: selectedSummary.income - selectedSummary.expense >= 0 ? 'var(--primary)' : 'var(--expense)',
                }}>
                  잔액 {selectedSummary.income - selectedSummary.expense >= 0 ? '+' : ''}{formatNumber(selectedSummary.income - selectedSummary.expense)}원
                </span>
              </div>
            )}

            {/* 거래 리스트 */}
            <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
              {selectedTxs.length > 0 ? (
                selectedTxs.map((tx) => (
                  <div key={tx.id} style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className={`badge ${tx.type}`} style={{ fontSize: '11px' }}>
                          {tx.type === 'income' ? '수입' : '지출'}
                        </span>
                        {tx.recurring && (
                          <span style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: 700 }}>🔄</span>
                        )}
                        {tx.vatIncluded && (
                          <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>% VAT</span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {tx.category} · {tx.method === 'card' ? '카드' : tx.method === 'transfer' ? '계좌이체' : '현금'}
                      </div>
                      {tx.memo && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.memo}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)',
                        whiteSpace: 'nowrap',
                      }}>
                        {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)}원
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn-icon-only"
                          title="수정"
                          style={{ padding: '4px' }}
                          onClick={() => onEdit(tx)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon-only danger"
                          title="삭제"
                          style={{ padding: '4px' }}
                          onClick={() => {
                            if (window.confirm(`"${tx.title}" 거래를 삭제하시겠습니까?`)) {
                              onDelete(tx.id);
                            }
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>이 날의 거래가 없습니다</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>아래 버튼으로 거래를 추가하세요</div>
                </div>
              )}
            </div>

            {/* 이 날에 거래 추가 버튼 */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-light)' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', gap: '8px' }}
                onClick={() => onAddForDate(selectedDate)}
              >
                + {selectedDate.replace(/-/g, '.')} 거래 추가
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
