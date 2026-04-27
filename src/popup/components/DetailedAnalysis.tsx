import React, { useState } from 'react';
import type { PredictionResult } from '../../lib/types';
import { t } from '../../lib/i18n';

interface DetailedAnalysisProps {
  result: PredictionResult;
  image: string | null;
  onBack: () => void;
}

export function DetailedAnalysis({ result, image, onBack }: DetailedAnalysisProps): React.ReactElement {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const isGreen = result.prediction === 'green';

  const handleCopy = async () => {
    const text = JSON.stringify(result, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-accent hover:underline">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-lg font-bold">{t('detailedAnalysis')}</h2>

      {/* Prediction summary */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isGreen ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <span className="text-2xl">{isGreen ? '🟩' : '🟥'}</span>
          </div>
          <div>
            <div className={`text-lg font-bold ${isGreen ? 'text-predict-green' : 'text-predict-red'}`}>
              {isGreen ? t('green') : t('red')} — {result.confidence}%
            </div>
            <div className="text-xs text-text-secondary">
              {t('timeframe')}: {result.timeframe}
              {result.meta?.model && ` | Model: ${result.meta.model}`}
              {result.meta?.latency_ms && ` | ${result.meta.latency_ms}ms`}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis summary */}
      <div className="card">
        <h3 className="text-sm font-medium mb-2">{t('summary')}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{result.analysis.summary}</p>
      </div>

      {/* Signals */}
      {result.analysis.signals.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium mb-3">{t('signals')}</h3>
          <div className="space-y-3">
            {result.analysis.signals.map((signal, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg">
                <div>
                  <div className="text-sm font-medium">{signal.name}</div>
                  <div className="text-xs text-text-secondary">{signal.value}</div>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    signal.impact === 'positive'
                      ? 'bg-green-500/20 text-predict-green'
                      : signal.impact === 'negative'
                      ? 'bg-red-500/20 text-predict-red'
                      : 'bg-yellow-400/20 text-yellow-400'
                  }`}
                >
                  {signal.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart image used */}
      {image && (
        <div className="card">
          <h3 className="text-sm font-medium mb-2">Chart Image Used</h3>
          <div className="rounded-lg overflow-hidden border border-gray-700/50">
            <img src={image} alt="Analyzed chart" className="w-full h-auto max-h-[150px] object-contain bg-black" />
          </div>
        </div>
      )}

      {/* Raw response */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">{t('rawResponse')}</h3>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="text-xs text-accent hover:underline">
              {copied ? t('copiedToClipboard') : 'Copy'}
            </button>
            <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-accent hover:underline">
              {showRaw ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        {showRaw && (
          <pre className="text-xs text-text-secondary bg-bg-tertiary p-3 rounded-lg overflow-auto max-h-[200px] whitespace-pre-wrap">
            {JSON.stringify(result.rawResponse, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
