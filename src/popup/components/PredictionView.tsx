import React from 'react';
import type { PredictionResult } from '../../lib/types';
import { t } from '../../lib/i18n';

interface PredictionViewProps {
  result: PredictionResult;
  onViewDetails: () => void;
  onAnalyzeAgain: () => void;
}

export function PredictionView({ result, onViewDetails, onAnalyzeAgain }: PredictionViewProps): React.ReactElement {
  const isGreen = result.prediction === 'green';
  const confColor = result.confidence >= 70 ? 'bg-predict-green' : result.confidence >= 50 ? 'bg-yellow-400' : 'bg-predict-red';

  return (
    <div className="space-y-4">
      {/* Main prediction card */}
      <div className={`card border-2 ${isGreen ? 'border-green-500/50' : 'border-red-500/50'}`}>
        <div className="text-center py-4">
          <div
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 ${
              isGreen ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}
          >
            <span className="text-4xl">{isGreen ? '🟩' : '🟥'}</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            <span className={isGreen ? 'text-predict-green' : 'text-predict-red'}>
              {isGreen ? t('green') : t('red')}
            </span>
          </h2>
          <div className={`inline-block ${isGreen ? 'badge-green' : 'badge-red'}`}>
            {t('prediction')}
          </div>
        </div>

        {/* Confidence */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-text-secondary">{t('confidence')}</span>
            <span className="text-sm font-bold">{result.confidence}%</span>
          </div>
          <div className="confidence-bar">
            <div className={`confidence-fill ${confColor}`} style={{ width: `${result.confidence}%` }} />
          </div>
        </div>

        {/* Timeframe */}
        <div className="mt-3 flex justify-between items-center">
          <span className="text-sm text-text-secondary">{t('timeframe')}</span>
          <span className="text-sm font-medium bg-bg-tertiary px-2 py-0.5 rounded">{result.timeframe}</span>
        </div>

        {/* Quick summary */}
        <div className="mt-3 p-3 bg-bg-tertiary rounded-lg">
          <p className="text-sm text-text-secondary leading-relaxed">{result.analysis.summary}</p>
        </div>
      </div>

      {/* Top signals preview */}
      {result.analysis.signals.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium mb-2">{t('signals')}</h3>
          <div className="space-y-2">
            {result.analysis.signals.slice(0, 3).map((signal, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{signal.name}</span>
                <span
                  className={
                    signal.impact === 'positive'
                      ? 'signal-positive font-medium'
                      : signal.impact === 'negative'
                      ? 'signal-negative font-medium'
                      : 'signal-neutral font-medium'
                  }
                >
                  {signal.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onAnalyzeAgain} className="btn-secondary flex-1">
          {t('analyzeAgain')}
        </button>
        <button onClick={onViewDetails} className="btn-primary flex-1">
          {t('viewDetails')}
        </button>
      </div>
    </div>
  );
}
