import React from 'react';
import type { Timeframe } from '../../lib/types';
import { TIMEFRAMES } from '../../lib/types';
import { t } from '../../lib/i18n';

interface CapturePreviewProps {
  image: string;
  detectedTimeframe: Timeframe | null;
  selectedTimeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  onAnalyze: () => void;
  onCancel: () => void;
  isAnalyzing: boolean;
}

export function CapturePreview({
  image,
  detectedTimeframe,
  selectedTimeframe,
  onTimeframeChange,
  onAnalyze,
  onCancel,
  isAnalyzing,
}: CapturePreviewProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-sm font-medium mb-3">{t('preview')}</h3>
        <div className="rounded-lg overflow-hidden border border-gray-700/50">
          <img src={image} alt="Chart preview" className="w-full h-auto max-h-[200px] object-contain bg-black" />
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium mb-3">{t('selectTimeframe')}</h3>
        {detectedTimeframe && (
          <p className="text-xs text-predict-green mb-2">
            Detected: <strong>{detectedTimeframe}</strong>
          </p>
        )}
        <div className="grid grid-cols-5 gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                selectedTimeframe === tf
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1" disabled={isAnalyzing}>
          {t('cancel')}
        </button>
        <button onClick={onAnalyze} className="btn-primary flex-1" disabled={isAnalyzing}>
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('analyzing')}
            </span>
          ) : (
            t('confirmAnalysis')
          )}
        </button>
      </div>
    </div>
  );
}
