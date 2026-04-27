import React from 'react';
import { t } from '../../lib/i18n';

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ onAccept, onDecline }: ConsentModalProps): React.ReactElement {
  return (
    <div className="w-[420px] min-h-[400px] bg-bg-primary p-6 flex flex-col justify-center">
      <div className="card">
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto mb-3 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2">{t('consentTitle')}</h2>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed mb-6">{t('consentMessage')}</p>

        <div className="space-y-3">
          <button onClick={onAccept} className="btn-primary w-full">{t('consentAccept')}</button>
          <button onClick={onDecline} className="btn-secondary w-full">{t('consentDecline')}</button>
        </div>

        <p className="text-[10px] text-text-secondary text-center mt-4 leading-tight">
          {t('privacyDisclaimer')}
        </p>
      </div>
    </div>
  );
}
