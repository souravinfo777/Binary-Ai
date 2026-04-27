import React, { useState } from 'react';
import type { AppSettings, ApiConfig, ResponseMapping } from '../../lib/types';
import { DEFAULT_API_CONFIG } from '../../lib/types';
import { t } from '../../lib/i18n';
import { generateId } from '../../lib/storage';

interface ApiStudioProps {
  settings: AppSettings;
  onUpdate: (apis: ApiConfig[], activeApiId: string) => void;
}

export function ApiStudio({ settings, onUpdate }: ApiStudioProps): React.ReactElement {
  const [editingApi, setEditingApi] = useState<ApiConfig | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleAdd = () => {
    const newApi: ApiConfig = {
      ...DEFAULT_API_CONFIG,
      id: generateId(),
      name: `API ${settings.apis.length + 1}`,
      isActive: settings.apis.length === 0,
    };
    setEditingApi(newApi);
    setIsAdding(true);
  };

  const handleEdit = (api: ApiConfig) => {
    setEditingApi({ ...api });
    setIsAdding(false);
  };

  const handleSaveApi = () => {
    if (!editingApi) return;
    let apis: ApiConfig[];
    if (isAdding) {
      apis = [...settings.apis, editingApi];
    } else {
      apis = settings.apis.map((a) => (a.id === editingApi.id ? editingApi : a));
    }
    const activeId = editingApi.isActive ? editingApi.id : settings.activeApiId;
    if (editingApi.isActive) {
      apis = apis.map((a) => ({ ...a, isActive: a.id === editingApi.id }));
    }
    onUpdate(apis, activeId);
    setEditingApi(null);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    const apis = settings.apis.filter((a) => a.id !== id);
    const activeId = settings.activeApiId === id ? (apis[0]?.id || '') : settings.activeApiId;
    if (apis.length > 0 && !apis.find((a) => a.id === activeId)) {
      apis[0].isActive = true;
    }
    onUpdate(apis, activeId);
  };

  const handleSetActive = (id: string) => {
    const apis = settings.apis.map((a) => ({ ...a, isActive: a.id === id }));
    onUpdate(apis, id);
  };

  const handleTestConnection = async () => {
    if (!editingApi) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const headers: Record<string, string> = JSON.parse(editingApi.headers);
      const body = editingApi.requestBodyTemplate
        .replace(/\{\{image_base64\}\}/g, 'dGVzdA==')
        .replace(/\{\{timeframe\}\}/g, '5s')
        .replace(/\{\{symbol\}\}/g, 'TEST');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(editingApi.timeout, 10000));

      const response = await fetch(editingApi.endpointUrl, {
        method: editingApi.httpMethod,
        headers,
        body: editingApi.httpMethod === 'POST' ? body : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.text();

      if (response.ok) {
        setTestResult({ success: true, message: `Status ${response.status} — Response: ${data.substring(0, 200)}` });
      } else {
        setTestResult({ success: false, message: `Status ${response.status}: ${data.substring(0, 200)}` });
      }
    } catch (err) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text) as ApiConfig[];
        if (Array.isArray(imported)) {
          const newApis = imported.map((a) => ({ ...DEFAULT_API_CONFIG, ...a, id: generateId() }));
          const allApis = [...settings.apis, ...newApis];
          onUpdate(allApis, settings.activeApiId);
        }
      } catch {
        alert('Invalid JSON file');
      }
    };
    input.click();
  };

  const handleExport = () => {
    const data = JSON.stringify(settings.apis, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotex-api-configs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (editingApi) {
    return (
      <ApiEditor
        api={editingApi}
        onChange={setEditingApi}
        onSave={handleSaveApi}
        onCancel={() => { setEditingApi(null); setIsAdding(false); setTestResult(null); }}
        onTest={handleTestConnection}
        testResult={testResult}
        isTesting={isTesting}
        isNew={isAdding}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{t('apiSettings')}</h2>
          <p className="text-sm text-text-secondary mt-1">Configure multiple API endpoints for chart analysis</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImport} className="btn-secondary text-sm">{t('importConfig')}</button>
          <button onClick={handleExport} className="btn-secondary text-sm">{t('exportConfig')}</button>
          <button onClick={handleAdd} className="btn-primary text-sm">{t('addApi')}</button>
        </div>
      </div>

      {settings.apis.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-text-secondary mb-4">No API configurations yet.</p>
          <button onClick={handleAdd} className="btn-primary">{t('addApi')}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {settings.apis.map((api) => (
            <div key={api.id} className={`card flex items-center justify-between ${api.id === settings.activeApiId ? 'border-accent/50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${api.id === settings.activeApiId ? 'bg-predict-green' : 'bg-bg-tertiary'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{api.name}</h3>
                    {api.id === settings.activeApiId && (
                      <span className="text-[10px] bg-green-500/20 text-predict-green px-1.5 py-0.5 rounded">{t('active')}</span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary truncate max-w-[300px]">{api.endpointUrl}</p>
                  <p className="text-xs text-text-secondary">{api.httpMethod} | Timeout: {api.timeout}ms | Retries: {api.retries}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {api.id !== settings.activeApiId && (
                  <button onClick={() => handleSetActive(api.id)} className="text-xs text-accent hover:underline">{t('setActive')}</button>
                )}
                <button onClick={() => handleEdit(api)} className="text-xs text-accent hover:underline">{t('editApi')}</button>
                <button onClick={() => handleDelete(api.id)} className="text-xs text-red-400 hover:underline">{t('deleteApi')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApiEditor({
  api,
  onChange,
  onSave,
  onCancel,
  onTest,
  testResult,
  isTesting,
  isNew,
}: {
  api: ApiConfig;
  onChange: (api: ApiConfig) => void;
  onSave: () => void;
  onCancel: () => void;
  onTest: () => void;
  testResult: { success: boolean; message: string } | null;
  isTesting: boolean;
  isNew: boolean;
}) {
  const updateField = <K extends keyof ApiConfig>(field: K, value: ApiConfig[K]) => {
    onChange({ ...api, [field]: value });
  };

  const updateMapping = (field: keyof ResponseMapping, value: string) => {
    onChange({ ...api, responseMapping: { ...api.responseMapping, [field]: value } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{isNew ? t('addApi') : t('editApi')}</h2>
        <button onClick={onCancel} className="text-sm text-text-secondary hover:text-text-primary">{t('cancel')}</button>
      </div>

      <div className="space-y-4">
        <div className="card space-y-4">
          <h3 className="text-sm font-medium text-accent">Basic Configuration</h3>

          <div>
            <label className="label">{t('apiName')}</label>
            <input type="text" value={api.name} onChange={(e) => updateField('name', e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="label">{t('endpointUrl')}</label>
            <input type="url" value={api.endpointUrl} onChange={(e) => updateField('endpointUrl', e.target.value)} className="input-field" placeholder="https://api.example.com/predict" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('httpMethod')}</label>
              <select value={api.httpMethod} onChange={(e) => updateField('httpMethod', e.target.value as 'POST' | 'GET')} className="select-field">
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </div>
            <div>
              <label className="label">{t('timeout')}</label>
              <input type="number" value={api.timeout} onChange={(e) => updateField('timeout', parseInt(e.target.value) || 30000)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label">{t('retries')}</label>
            <input type="number" min="0" max="5" value={api.retries} onChange={(e) => updateField('retries', parseInt(e.target.value) || 0)} className="input-field" />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="text-sm font-medium text-accent">{t('headers')}</h3>
          <textarea
            value={api.headers}
            onChange={(e) => updateField('headers', e.target.value)}
            className="input-field font-mono text-xs h-24"
            placeholder='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_KEY"}'
          />
        </div>

        <div className="card space-y-4">
          <h3 className="text-sm font-medium text-accent">{t('requestBody')}</h3>
          <p className="text-xs text-text-secondary">
            Use placeholders: <code className="bg-bg-tertiary px-1 rounded">{'{{image_base64}}'}</code>,{' '}
            <code className="bg-bg-tertiary px-1 rounded">{'{{timeframe}}'}</code>,{' '}
            <code className="bg-bg-tertiary px-1 rounded">{'{{symbol}}'}</code>
          </p>
          <textarea
            value={api.requestBodyTemplate}
            onChange={(e) => updateField('requestBodyTemplate', e.target.value)}
            className="input-field font-mono text-xs h-32"
          />
        </div>

        <div className="card space-y-4">
          <h3 className="text-sm font-medium text-accent">{t('responseMapping')}</h3>
          <p className="text-xs text-text-secondary">Use dot-notation paths (e.g., <code className="bg-bg-tertiary px-1 rounded">analysis.summary</code>)</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prediction Path</label>
              <input type="text" value={api.responseMapping.predictionPath} onChange={(e) => updateMapping('predictionPath', e.target.value)} className="input-field" placeholder="prediction" />
            </div>
            <div>
              <label className="label">Confidence Path</label>
              <input type="text" value={api.responseMapping.confidencePath} onChange={(e) => updateMapping('confidencePath', e.target.value)} className="input-field" placeholder="confidence" />
            </div>
            <div>
              <label className="label">Analysis Text Path</label>
              <input type="text" value={api.responseMapping.analysisTextPath} onChange={(e) => updateMapping('analysisTextPath', e.target.value)} className="input-field" placeholder="analysis.summary" />
            </div>
            <div>
              <label className="label">Signals Path</label>
              <input type="text" value={api.responseMapping.signalsPath} onChange={(e) => updateMapping('signalsPath', e.target.value)} className="input-field" placeholder="analysis.signals" />
            </div>
          </div>
        </div>

        {/* Test connection */}
        <div className="card space-y-3">
          <h3 className="text-sm font-medium text-accent">{t('testConnection')}</h3>
          <button onClick={onTest} disabled={isTesting} className="btn-secondary text-sm">
            {isTesting ? 'Testing...' : t('testConnection')}
          </button>
          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
              {testResult.message}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">{t('cancel')}</button>
          <button onClick={onSave} className="btn-primary flex-1">{t('save')}</button>
        </div>
      </div>
    </div>
  );
}
