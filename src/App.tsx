import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, FileText, Settings2, PlusCircle, Sun, Moon, Database, CalendarDays, LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { useLedger } from './hooks/useLedger';
import type { Transaction } from './hooks/useLedger';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { BudgetSettings } from './components/BudgetSettings';
import { BackupManager } from './components/BackupManager';
import { TransactionForm } from './components/TransactionForm';
import { CalendarView } from './components/CalendarView';
import { AuthScreen, SupabaseSetupScreen } from './components/AuthScreen';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { useToday } from './hooks/useToday';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const {
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
    resetData
  } = useLedger(Boolean(session));

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'calendar' | 'budgets' | 'backup'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | null>(null);
  const today = useToday();
  const effectiveTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date <= today),
    [transactions, today],
  );
  
  // Theme state initialization (default to dark for a high-tech modern aesthetic)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('yeoul_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('yeoul_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleOpenAddForm = () => {
    setEditingTx(null);
    setPrefillDate(null);
    setIsFormOpen(true);
  };

  const handleOpenAddFormForDate = (date: string) => {
    setEditingTx(null);
    setPrefillDate(date);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (tx: Transaction) => {
    setEditingTx(tx);
    setPrefillDate(null);
    setIsFormOpen(true);
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>) => {
    if (editingTx) {
      updateTransaction(editingTx.id, txData);
    } else {
      addTransaction(txData);
    }
  };

  if (!isSupabaseConfigured) return <SupabaseSetupScreen />;
  if (!authLoading && !session) return <AuthScreen />;

  if (authLoading || loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '12px',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-family)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-light)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>가계부 데이터를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section" style={{ justifyContent: 'center', padding: '0 8px 24px 8px' }}>
          <img
            src={theme === 'dark' ? '/logo_white.png' : '/logo_blue.png'}
            alt="YEOUL"
            style={{
              maxWidth: '100%',
              maxHeight: '44px',
              objectFit: 'contain',
              transition: 'opacity var(--transition-fast)'
            }}
          />
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>종합 대시보드</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <FileText size={18} />
            <span>장부 거래 내역</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarDays size={18} />
            <span>달력 보기</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('budgets')}
          >
            <Settings2 size={18} />
            <span>지출 예산 통제</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <Database size={18} />
            <span>데이터 관리/백업</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* Quick Transaction Button */}
          <button className="btn btn-primary" onClick={handleOpenAddForm} style={{ width: '100%', gap: '8px' }}>
            <PlusCircle size={16} />
            <span>거래 추가</span>
          </button>

          {/* Theme Toggle Button */}
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            <span>{theme === 'dark' ? '다크 모드' : '라이트 모드'}</span>
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className="theme-toggle-btn" onClick={() => void supabase?.auth.signOut({ scope: 'local' })}>
            <span>장부 잠그기</span>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">
              {activeTab === 'dashboard' && '경영 실적 대시보드'}
              {activeTab === 'transactions' && '수입 및 지출 내역 관리'}
              {activeTab === 'calendar' && '달력으로 보기'}
              {activeTab === 'budgets' && '부서별 예산 통제'}
              {activeTab === 'backup' && '백업 및 가계부 설정'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'dashboard' && `${companyInfo.name}의 실시간 자금 흐름과 재정 건전성을 확인합니다.`}
              {activeTab === 'transactions' && '모든 기업 자금의 입출금 거래 기록을 상세히 확인하고 관리합니다.'}
              {activeTab === 'calendar' && '날짜를 클릭해 해당 날의 거래 내역을 확인하고 바로 추가·수정할 수 있습니다.'}
              {activeTab === 'budgets' && '각 지출 카테고리별 정기 예산 한도를 점검하고 잔여 한도를 비교합니다.'}
              {activeTab === 'backup' && '가계부의 설정 정보를 갱신하거나 전체 거래 데이터를 가져오고 내보냅니다.'}
            </p>
          </div>
          {activeTab !== 'backup' && (
            <button className="btn btn-secondary" onClick={exportToCSV} style={{ gap: '8px' }}>
              <span>엑셀 다운로드 (CSV)</span>
            </button>
          )}
        </header>

        {/* Tab Router Switch */}
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={effectiveTransactions}
            budgets={budgets}
            companyInfo={companyInfo}
            onNavigateToTx={() => setActiveTab('transactions')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onEdit={handleOpenEditForm}
            onDelete={deleteTransaction}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            transactions={transactions}
            onEdit={handleOpenEditForm}
            onDelete={deleteTransaction}
            onAddForDate={handleOpenAddFormForDate}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetSettings
            budgets={budgets}
            transactions={effectiveTransactions}
            onSetBudget={setBudget}
          />
        )}

        {activeTab === 'backup' && (
          <BackupManager
            companyInfo={companyInfo}
            onUpdateCompany={updateCompanyInfo}
            onExportCSV={exportToCSV}
            onExportJSON={exportToJSON}
            onImportJSON={importFromJSON}
            legacyDataAvailable={legacyDataAvailable}
            onMigrateLegacyData={migrateLegacyData}
            onResetData={resetData}
          />
        )}
      </main>

      {/* Add / Edit Transaction Form Modal */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setPrefillDate(null); }}
        onSave={handleSaveTransaction}
        transaction={editingTx}
        prefillDate={prefillDate}
      />
    </div>
  );
}

export default App;
