import React, { useState, useEffect, useCallback } from 'react';
import type { AppSettings, ApiConfig, Language, Timeframe } from '../lib/types';
import { DEFAULT_SETTINGS, TIMEFRAMES } from '../lib/types';
import { getSettings, saveSettings } from '../lib/storage';
import { setLanguage, t } from '../lib/i18n';
import { ApiStudio } from './components/ApiStudio';

type Section = 'language' | 'timeframe' | 'capture' | 'apis' | 'history' | 'privacy' | 'shortcuts' | 'about';

export function Options(): React.ReactElement {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState<Section>('language');
  const [saved, setSaved] = useState(false);
  const [, setRenderKey] = useState(0);

  useEffect(() => {
    getSettings().then((s) => {
      setSettingsState(s);
      setLanguage(s.language);
      setRenderKey((k) => k + 1);
    });
  }, []);

  const handleSave = useCallback(async (newSettings?: AppSettings) => {
    const toSave = newSettings || settings;
    await saveSettings(toSave);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'language') {
        setLanguage(value as Language);
        setRenderKey((k) => k + 1);
      }
      return updated;
    });
  }, []);

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'language', label: t('language'), icon: '🌐' },
    { id: 'timeframe', label: t('defaultTimeframe'), icon: '🕒' },
    { id: 'capture', label: t('captureSettings'), icon: '📸' },
    { id: 'apis', label: t('apiSettings'), icon: '🤖' },
    { id: 'history', label: t('historySettings'), icon: '🧾' },
    { id: 'privacy', label: t('privacy'), icon: '🔒' },
    { id: 'shortcuts', label: t('shortcuts'), icon: '⌨️' },
    { id: 'about', label: t('about'), icon: 'ℹ️' },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-bg-secondary border-r border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white font-bold">QX</div>
            <div>
              <h1 className="text-sm font-bold">{t('settings')}</h1>
              <span className="text-[10px] text-text-secondary">QuoteX Predictor</span>
            </div>
          </div>
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  activeSection === s.id ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          {saved && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              Settings saved successfully!
            </div>
          )}

          {activeSection === 'language' && (
            <LanguageSection settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeSection === 'timeframe' && (
            <TimeframeSection settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeSection === 'capture' && (
            <CaptureSection settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeSection === 'apis' && (
            <ApiStudio
              settings={settings}
              onUpdate={(apis: ApiConfig[], activeId: string) => {
                const newSettings = { ...settings, apis, activeApiId: activeId };
                setSettingsState(newSettings);
                handleSave(newSettings);
              }}
            />
          )}
          {activeSection === 'history' && (
            <HistorySection settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeSection === 'privacy' && (
            <PrivacySection settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeSection === 'shortcuts' && <ShortcutsSection />}
          {activeSection === 'about' && <AboutSection />}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
    </div>
  );
}

function LanguageSection({
  settings,
  onUpdate,
  onSave,
}: {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <div>
      <SectionHeader title={t('language')} description="Select your preferred language" />
      <div className="card space-y-4">
        <div className="flex gap-4">
          {(['en', 'bn'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => onUpdate('language', lang)}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                settings.language === lang ? 'border-accent bg-accent/10' : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">{lang === 'en' ? '🇬🇧' : '🇧🇩'}</div>
              <div className="text-sm font-medium">{lang === 'en' ? 'English' : 'বাংলা'}</div>
            </button>
          ))}
        </div>
        <button onClick={() => onSave()} className="btn-primary">{t('save')}</button>
      </div>
    </div>
  );
}

function TimeframeSection({
  settings,
  onUpdate,
  onSave,
}: {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <div>
      <SectionHeader title={t('defaultTimeframe')} description="Used when timeframe auto-detection fails" />
      <div className="card space-y-4">
        <div className="grid grid-cols-5 gap-3">
          {TIMEFRAMES.map((tf: Timeframe) => (
            <button
              key={tf}
              onClick={() => onUpdate('defaultTimeframe', tf)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                settings.defaultTimeframe === tf ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        <button onClick={() => onSave()} className="btn-primary">{t('save')}</button>
      </div>
    </div>
  );
}

function CaptureSection({
  settings,
  onUpdate,
  onSave,
}: {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void;
  onSave: () => Promise<void>;
}) {
  const capture = settings.capture;

  const updateCapture = (field: string, value: unknown) => {
    onUpdate('capture', { ...capture, [field]: value });
  };

  return (
    <div>
      <SectionHeader title={t('captureSettings')} description="Configure screenshot capture behavior" />
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm">{t('autoDetect')}</label>
          <button
            onClick={() => updateCapture('autoDetect', !capture.autoDetect)}
            className={`w-12 h-6 rounded-full transition-colors relative ${capture.autoDetect ? 'bg-accent' : 'bg-bg-tertiary'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${capture.autoDetect ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {!capture.autoDetect && (
          <div className="grid grid-cols-2 gap-3">
            {(['cropX', 'cropY', 'cropWidth', 'cropHeight'] as const).map((field) => (
              <div key={field}>
                <label className="label">{field}</label>
                <input
                  type="number"
                  value={capture[field]}
                  onChange={(e) => updateCapture(field, parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="label">{t('imageQuality')}: {Math.round(capture.imageQuality * 100)}%</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={capture.imageQuality}
            onChange={(e) => updateCapture('imageQuality', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <button onClick={() => onSave()} className="btn-primary">{t('save')}</button>
      </div>
    </div>
  );
}

function HistorySection({
  settings,
  onUpdate,
  onSave,
}: {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <div>
      <SectionHeader title={t('historySettings')} description="Configure history storage and retention" />
      <div className="card space-y-4">
        <div>
          <label className="label">{t('retentionLimit')}</label>
          <input
            type="number"
            min="10"
            max="5000"
            value={settings.historyRetentionLimit}
            onChange={(e) => onUpdate('historyRetentionLimit', parseInt(e.target.value) || 500)}
            className="input-field"
          />
          <p className="text-xs text-text-secondary mt-1">Older entries will be removed automatically</p>
        </div>
        <button onClick={() => onSave()} className="btn-primary">{t('save')}</button>
      </div>
    </div>
  );
}

function PrivacySection({
  settings,
  onUpdate,
  onSave,
}: {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <div>
      <SectionHeader title={t('privacy')} description="Control data sharing and privacy settings" />
      <div className="card space-y-4">
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-300 leading-relaxed">{t('privacyDisclaimer')}</p>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">{t('enableUpload')}</label>
          <button
            onClick={() => onUpdate('enableUpload', !settings.enableUpload)}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableUpload ? 'bg-accent' : 'bg-bg-tertiary'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.enableUpload ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm">{t('demoMode')}</label>
            <p className="text-xs text-text-secondary">Use mock predictions without API calls</p>
          </div>
          <button
            onClick={() => onUpdate('demoMode', !settings.demoMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.demoMode ? 'bg-accent' : 'bg-bg-tertiary'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.demoMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <button onClick={() => onSave()} className="btn-primary">{t('save')}</button>
      </div>
    </div>
  );
}

function ShortcutsSection() {
  return (
    <div>
      <SectionHeader title={t('shortcuts')} description="Keyboard shortcuts for quick access" />
      <div className="card space-y-4">
        <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
          <span className="text-sm">{t('analyze')}</span>
          <kbd className="px-3 py-1.5 bg-bg-primary rounded-lg text-sm font-mono border border-gray-600">Ctrl+Shift+Q</kbd>
        </div>
        <p className="text-xs text-text-secondary">
          To change shortcuts, visit{' '}
          <a
            href="chrome://extensions/shortcuts"
            className="text-accent hover:underline"
            onClick={(e) => {
              e.preventDefault();
              if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
              }
            }}
          >
            chrome://extensions/shortcuts
          </a>
        </p>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div>
      <SectionHeader title={t('about')} />
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white font-bold text-lg">QX</div>
          <div>
            <h3 className="font-bold">QuoteX Chart Predictor</h3>
            <p className="text-sm text-text-secondary">{t('version')}: 1.0.0</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          AI-powered chart analysis and candle prediction tool for QuoteX Binary Trading.
          This tool provides probabilistic analysis only and is not financial advice.
        </p>
        <div className="text-xs text-text-secondary space-y-1">
          <p>Manifest V3 Chrome Extension</p>
          <p>Built with React + TypeScript + Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}
