import React, { useState, useRef } from 'react';
import { Download, Upload, Trash2, CheckCircle2, AlertTriangle, Building } from 'lucide-react';
import type { CompanyInfo } from '../hooks/useLedger';

interface BackupManagerProps {
  companyInfo: CompanyInfo;
  onUpdateCompany: (info: CompanyInfo) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (json: string) => boolean;
  onResetData: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  companyInfo,
  onUpdateCompany,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onResetData
}) => {
  const [compName, setCompName] = useState(companyInfo.name);
  const [compCurrency, setCompCurrency] = useState(companyInfo.currency);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) {
      alert('회사 이름을 입력해 주세요.');
      return;
    }
    onUpdateCompany({
      name: compName.trim(),
      currency: compCurrency
    });
    alert('회사 정보가 업데이트되었습니다.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImportJSON(content);
      if (success) {
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 4000);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 4000);
      }
    };
    reader.readAsText(file);
    // Clear input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetClick = () => {
    const firstConfirm = window.confirm(
      '경고: 모든 가계부 거래 내역과 설정된 예산이 완전히 영구 삭제됩니다. 계속하시겠습니까?'
    );
    if (firstConfirm) {
      const secondConfirm = window.confirm(
        '정말로 삭제하시겠습니까? 백업본이 없다면 데이터를 복구할 수 없습니다.'
      );
      if (secondConfirm) {
        onResetData();
        alert('모든 가계부 데이터가 성공적으로 초기화되었습니다.');
      }
    }
  };

  return (
    <div className="settings-section">
      {/* Company Info Card */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">회사 및 장부 설정</h3>
          <p className="settings-card-desc">가계부 상단에 표시될 회사 프로필 및 통화 단위를 설정합니다.</p>
        </div>
        <form onSubmit={handleUpdateProfile} className="settings-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="company-name">회사명</label>
              <input
                id="company-name"
                type="text"
                className="form-control"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                placeholder="예: 여울"
              />
            </div>
            <div className="form-group">
              <label htmlFor="company-currency">통화 기호</label>
              <select
                id="company-currency"
                className="form-control"
                value={compCurrency}
                onChange={(e) => setCompCurrency(e.target.value)}
              >
                <option value="₩">₩ (KRW - 원)</option>
                <option value="$">$ (USD - 달러)</option>
                <option value="¥">¥ (JPY - 엔)</option>
                <option value="€">€ (EUR - 유로)</option>
              </select>
            </div>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
              <Building size={14} /> 정보 변경 사항 저장
            </button>
          </div>
        </form>
      </div>

      {/* Backup and CSV Export Card */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">데이터 내보내기 및 백업</h3>
          <p className="settings-card-desc">가계부 데이터를 외부 파일로 저장해 관리하고 보존할 수 있습니다.</p>
        </div>
        <div className="settings-card-body">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            주기적으로 데이터 백업 파일을 다운로드하여 PC에 보관하는 것을 권장합니다. 다운로드한 JSON 백업본은 언제든지 다시 업로드해 그대로 복원할 수 있으며, CSV 파일은 엑셀이나 구글 스프레드시트에서 열어 자유롭게 가공할 수 있습니다.
          </p>
          <div className="settings-button-group">
            <button className="btn btn-secondary" onClick={onExportCSV} style={{ gap: '8px' }}>
              <Download size={15} /> Excel용 CSV 다운로드
            </button>
            <button className="btn btn-secondary" onClick={onExportJSON} style={{ gap: '8px' }}>
              <Download size={15} /> 전체 DB 백업 (JSON 다운로드)
            </button>
          </div>
        </div>
      </div>

      {/* Restore Card */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">백업 데이터 복원하기</h3>
          <p className="settings-card-desc">이전에 다운로드한 가계부 JSON 백업 파일을 업로드하여 기존 데이터를 교체합니다.</p>
        </div>
        <div className="settings-card-body">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            주의: 파일을 불러오는 즉시 현재 등록되어 있는 모든 내역이 덮어씌워져 사라집니다. 기존 내용 유지가 필요한 경우 먼저 백업 파일을 받아 두십시오.
          </p>
          
          <div className="file-input-wrapper">
            <button className="btn btn-primary" style={{ gap: '8px' }}>
              <Upload size={15} /> 백업 파일 (.json) 선택
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="file-input-hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Import Status Alert Banners */}
          {importStatus === 'success' && (
            <div className="alert-banner" style={{ backgroundColor: 'var(--income-bg)', borderColor: 'var(--income)', color: 'var(--text-main)', marginTop: '12px' }}>
              <CheckCircle2 className="alert-icon" size={16} color="var(--income)" />
              <div className="alert-message-content">
                <div className="alert-message-title" style={{ color: 'var(--income)' }}>데이터 복원 완료</div>
                가계부 백업 파일 데이터가 정상적으로 시스템에 덮어씌워져 불러와졌습니다.
              </div>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="alert-banner danger" style={{ marginTop: '12px' }}>
              <AlertTriangle className="alert-icon" size={16} />
              <div className="alert-message-content">
                <div className="alert-message-title">가져오기 실패</div>
                올바른 가계부 백업 (.json) 형식이 아니거나 데이터 파일이 손상되었습니다.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Factory Reset Card */}
      <div className="settings-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
        <div className="settings-card-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
          <h3 className="settings-card-title" style={{ color: 'var(--expense)' }}>시스템 초기화</h3>
          <p className="settings-card-desc">가계부의 모든 데이터를 지우고 공장 초기화 상태로 되돌립니다.</p>
        </div>
        <div className="settings-card-body">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            이 버튼을 클릭하면 로컬 저장소(`localStorage`)에 저장된 모든 수입/지출 내역과 회사명 설정, 카테고리 예산이 영구적으로 즉시 삭제됩니다. 이 동작은 취소할 수 없습니다.
          </p>
          <div>
            <button className="btn btn-danger" onClick={handleResetClick} style={{ gap: '8px' }}>
              <Trash2 size={15} /> 전체 데이터 영구 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
