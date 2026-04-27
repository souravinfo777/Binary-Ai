import React, { useState, useEffect, useCallback } from 'react';
import type { AppSettings, PredictionResult, Timeframe, HistoryItem, Language } from '../lib/types';
import { DEFAULT_SETTINGS } from '../lib/types';
import { getSettings, saveSettings, addHistoryItem, generateId } from '../lib/storage';
import { generateMockPrediction } from '../lib/api';
import { setLanguage, t, getLanguage } from '../lib/i18n';
import { CapturePreview } from './components/CapturePreview';
import { PredictionView } from './components/PredictionView';
import { HistoryView } from './components/HistoryView';
import { DetailedAnalysis } from './components/DetailedAnalysis';
import { ConsentModal } from './components/ConsentModal';

type Tab = 'main' | 'history' | 'result' | 'detail' | 'preview';

export function Popup(): React.ReactElement {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<Tab>('main');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedTimeframe, setDetectedTimeframe] = useState<Timeframe | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('5s');
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [, setRenderKey] = useState(0);

  useEffect(() => {
    getSettings().then((s) => {
      setSettingsState(s);
      setLanguage(s.language);
      setSelectedTimeframe(s.defaultTimeframe);
      setRenderKey((k) => k + 1);
      if (!s.privacyConsented && !s.demoMode) {
        setShowConsent(true);
      }
    });
  }, []);

  const handleLanguageToggle = useCallback(async () => {
    const newLang: Language = settings.language === 'en' ? 'bn' : 'en';
    const newSettings = { ...settings, language: newLang };
    setSettingsState(newSettings);
    setLanguage(newLang);
    await saveSettings(newSettings);
    setRenderKey((k) => k + 1);
  }, [settings]);

  const handleCapture = useCallback(async () => {
    setError(null);
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
        if (response?.error) {
          setError(response.error);
          return;
        }
        setCapturedImage(response.imageDataUrl);
        if (response.timeframe) {
          setDetectedTimeframe(response.timeframe);
          setSelectedTimeframe(response.timeframe);
        }
        setTab('preview');
      } else {
        setError(t('noChartDetected'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setTab('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      let result: PredictionResult;

      if (settings.demoMode) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));
        result = generateMockPrediction(selectedTimeframe);
      } else {
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          const base64 = capturedImage.split(',')[1] || capturedImage;
          const response = await chrome.runtime.sendMessage({
            type: 'ANALYZE',
            imageBase64: base64,
            timeframe: selectedTimeframe,
            symbol: '',
          });
          if (response?.error) {
            setError(response.error);
            setIsAnalyzing(false);
            return;
          }
          result = response.result;
        } else {
          await new Promise((r) => setTimeout(r, 800));
          result = generateMockPrediction(selectedTimeframe);
        }
      }

      setPredictionResult(result);

      const canvas = document.createElement('canvas');
      const img = new Image();
      img.src = capturedImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      canvas.width = 120;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, 120, 80);
      const thumb = canvas.toDataURL('image/jpeg', 0.5);

      const historyItem: HistoryItem = {
        id: generateId(),
        timestamp: Date.now(),
        timeframe: selectedTimeframe,
        symbol: '',
        imageThumb: thumb,
        prediction: result.prediction,
        confidence: result.confidence,
        analysisSummary: result.analysis.summary,
        signals: result.analysis.signals,
        apiName: settings.demoMode ? 'Demo Mode' : settings.apis.find((a) => a.id === settings.activeApiId)?.name || 'Unknown',
        actualOutcome: 'unknown',
        notes: '',
        rawResponse: result.rawResponse,
      };

      await addHistoryItem(historyItem);
      setTab('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedImage, selectedTimeframe, settings]);

  const handleConsent = useCallback(
    async (accepted: boolean) => {
      const newSettings = { ...settings, privacyConsented: accepted };
      if (!accepted) {
        newSettings.demoMode = true;
      }
      setSettingsState(newSettings);
      await saveSettings(newSettings);
      setShowConsent(false);
    },
    [settings]
  );

  const openSettings = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  }, []);

  if (showConsent) {
    return <ConsentModal onAccept={() => handleConsent(true)} onDecline={() => handleConsent(false)} />;
  }

  return (
    <div className="w-[420px] min-h-[500px] max-h-[600px] overflow-y-auto bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-sm">
              QX
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary">QuoteX Predictor</h1>
              {settings.demoMode && (
                <span className="text-[10px] text-yellow-400 font-medium">DEMO MODE</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLanguageToggle}
              className="text-xs px-2 py-1 bg-bg-tertiary rounded-md hover:bg-gray-600 transition-colors"
              title={t('language')}
            >
              {getLanguage() === 'en' ? 'বাং' : 'EN'}
            </button>
            <button onClick={openSettings} className="text-text-secondary hover:text-text-primary transition-colors" title={t('settings')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mt-3 gap-1">
          <button
            onClick={() => { setTab('main'); setPredictionResult(null); setCapturedImage(null); setError(null); }}
            className={`tab-button ${tab === 'main' ? 'active' : 'text-text-secondary'}`}
          >
            {t('analyze')}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`tab-button ${tab === 'history' ? 'active' : 'text-text-secondary'}`}
          >
            {t('history')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {tab === 'main' && (
          <MainView
            onCapture={handleCapture}
            onFileUpload={handleFileUpload}
            isAnalyzing={isAnalyzing}
          />
        )}

        {tab === 'preview' && capturedImage && (
          <CapturePreview
            image={capturedImage}
            detectedTimeframe={detectedTimeframe}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            onAnalyze={handleAnalyze}
            onCancel={() => { setTab('main'); setCapturedImage(null); }}
            isAnalyzing={isAnalyzing}
          />
        )}

        {tab === 'result' && predictionResult && (
          <PredictionView
            result={predictionResult}
            onViewDetails={() => setTab('detail')}
            onAnalyzeAgain={() => { setTab('main'); setPredictionResult(null); setCapturedImage(null); }}
          />
        )}

        {tab === 'detail' && predictionResult && (
          <DetailedAnalysis
            result={predictionResult}
            image={capturedImage}
            onBack={() => setTab('result')}
          />
        )}

        {tab === 'history' && (
          <HistoryView
            onViewDetail={(item) => {
              setSelectedHistoryItem(item);
              const asResult: PredictionResult = {
                prediction: item.prediction,
                confidence: item.confidence,
                timeframe: item.timeframe,
                analysis: { summary: item.analysisSummary, signals: item.signals },
                rawResponse: item.rawResponse,
              };
              setPredictionResult(asResult);
              setCapturedImage(item.imageThumb);
              setTab('detail');
            }}
            selectedItem={selectedHistoryItem}
            language={settings.language}
          />
        )}
      </div>

      {/* Footer disclaimer */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-text-secondary text-center leading-tight">
          {t('privacyDisclaimer')}
        </p>
      </div>
    </div>
  );
}

function MainView({
  onCapture,
  onFileUpload,
  isAnalyzing,
}: {
  onCapture: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzing: boolean;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="card text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold mb-2">{t('capture')}</h2>
        <p className="text-text-secondary text-sm mb-4">
          Capture or upload a QuoteX chart screenshot to analyze
        </p>
        <div className="space-y-3">
          <button onClick={onCapture} disabled={isAnalyzing} className="btn-primary w-full flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('capture')}
          </button>
          <div className="relative">
            <label className="btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {t('upload')}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-text-secondary mb-2">{t('shortcuts')}</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm">{t('analyze')}</span>
          <kbd className="px-2 py-1 bg-bg-tertiary rounded text-xs font-mono">Ctrl+Shift+Q</kbd>
        </div>
      </div>
    </div>
  );
}
