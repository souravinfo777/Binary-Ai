import React, { useState, useEffect, useMemo } from 'react';
import type { HistoryItem, Language, ActualOutcome, Timeframe, PredictionDirection } from '../../lib/types';
import { TIMEFRAMES } from '../../lib/types';
import { getHistory, updateHistoryItem, clearAllHistory } from '../../lib/storage';
import { exportToCSV, exportToJSON, downloadFile } from '../../lib/export';
import { t, formatDate } from '../../lib/i18n';

interface HistoryViewProps {
  onViewDetail: (item: HistoryItem) => void;
  selectedItem: HistoryItem | null;
  language: Language;
}

export function HistoryView({ onViewDetail, language }: HistoryViewProps): React.ReactElement {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterTimeframe, setFilterTimeframe] = useState<Timeframe | 'all'>('all');
  const [filterPrediction, setFilterPrediction] = useState<PredictionDirection | 'all'>('all');
  const [filterOutcome, setFilterOutcome] = useState<ActualOutcome | 'all'>('all');
  const [sortField, setSortField] = useState<'timestamp' | 'confidence'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    getHistory().then(setItems);
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.analysisSummary.toLowerCase().includes(lower) ||
          i.apiName.toLowerCase().includes(lower) ||
          i.notes.toLowerCase().includes(lower)
      );
    }

    if (filterTimeframe !== 'all') {
      result = result.filter((i) => i.timeframe === filterTimeframe);
    }
    if (filterPrediction !== 'all') {
      result = result.filter((i) => i.prediction === filterPrediction);
    }
    if (filterOutcome !== 'all') {
      result = result.filter((i) => i.actualOutcome === filterOutcome);
    }

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      const diff = typeof valA === 'number' && typeof valB === 'number' ? valA - valB : 0;
      return sortDir === 'asc' ? diff : -diff;
    });

    return result;
  }, [items, search, filterTimeframe, filterPrediction, filterOutcome, sortField, sortDir]);

  const handleMarkOutcome = async (itemId: string, outcome: ActualOutcome) => {
    await updateHistoryItem(itemId, { actualOutcome: outcome });
    setItems(items.map((i) => (i.id === itemId ? { ...i, actualOutcome: outcome } : i)));
  };

  const handleClear = async () => {
    await clearAllHistory();
    setItems([]);
    setShowClearConfirm(false);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(filteredItems);
    downloadFile(csv, `quotex-history-${Date.now()}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportToJSON(filteredItems);
    downloadFile(json, `quotex-history-${Date.now()}.json`, 'application/json');
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="text"
        placeholder={t('search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field text-sm"
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterTimeframe}
          onChange={(e) => setFilterTimeframe(e.target.value as Timeframe | 'all')}
          className="select-field text-xs py-1 w-auto"
        >
          <option value="all">{t('timeframe')}: {t('all')}</option>
          {TIMEFRAMES.map((tf) => (
            <option key={tf} value={tf}>{tf}</option>
          ))}
        </select>
        <select
          value={filterPrediction}
          onChange={(e) => setFilterPrediction(e.target.value as PredictionDirection | 'all')}
          className="select-field text-xs py-1 w-auto"
        >
          <option value="all">{t('prediction')}: {t('all')}</option>
          <option value="green">{t('green')}</option>
          <option value="red">{t('red')}</option>
        </select>
        <select
          value={filterOutcome}
          onChange={(e) => setFilterOutcome(e.target.value as ActualOutcome | 'all')}
          className="select-field text-xs py-1 w-auto"
        >
          <option value="all">Outcome: {t('all')}</option>
          <option value="green">{t('green')}</option>
          <option value="red">{t('red')}</option>
          <option value="unknown">{t('unknown')}</option>
        </select>
        <select
          value={`${sortField}-${sortDir}`}
          onChange={(e) => {
            const [f, d] = e.target.value.split('-');
            setSortField(f as 'timestamp' | 'confidence');
            setSortDir(d as 'asc' | 'desc');
          }}
          className="select-field text-xs py-1 w-auto"
        >
          <option value="timestamp-desc">Newest first</option>
          <option value="timestamp-asc">Oldest first</option>
          <option value="confidence-desc">Highest confidence</option>
          <option value="confidence-asc">Lowest confidence</option>
        </select>
      </div>

      {/* Actions bar */}
      <div className="flex gap-2 justify-end">
        <button onClick={handleExportCSV} className="text-xs text-accent hover:underline">{t('exportCSV')}</button>
        <button onClick={handleExportJSON} className="text-xs text-accent hover:underline">{t('exportJSON')}</button>
        {showClearConfirm ? (
          <div className="flex gap-1">
            <button onClick={handleClear} className="text-xs text-red-400 hover:underline">{t('confirm')}</button>
            <button onClick={() => setShowClearConfirm(false)} className="text-xs text-text-secondary hover:underline">{t('cancel')}</button>
          </div>
        ) : (
          <button onClick={() => setShowClearConfirm(true)} className="text-xs text-red-400 hover:underline">{t('clearHistory')}</button>
        )}
      </div>

      {/* Items */}
      {filteredItems.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-text-secondary text-sm">{t('noHistory')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="card cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => onViewDetail(item)}
            >
              <div className="flex items-center gap-3">
                {item.imageThumb && (
                  <img src={item.imageThumb} alt="" className="w-12 h-8 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${item.prediction === 'green' ? 'text-predict-green' : 'text-predict-red'}`}>
                      {item.prediction === 'green' ? '🟩' : '🟥'} {item.confidence}%
                    </span>
                    <span className="text-xs bg-bg-tertiary px-1.5 py-0.5 rounded">{item.timeframe}</span>
                  </div>
                  <p className="text-xs text-text-secondary truncate mt-0.5">{item.analysisSummary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-text-secondary">{formatDate(item.timestamp, language)}</span>
                    <span className="text-[10px] text-text-secondary">| {item.apiName}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkOutcome(item.id, 'green'); }}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${
                      item.actualOutcome === 'green' ? 'bg-predict-green text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-green-500/30'
                    }`}
                    title="Mark as Green"
                  >
                    G
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkOutcome(item.id, 'red'); }}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${
                      item.actualOutcome === 'red' ? 'bg-predict-red text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-red-500/30'
                    }`}
                    title="Mark as Red"
                  >
                    R
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-text-secondary">
        {filteredItems.length} / {items.length} entries
      </div>
    </div>
  );
}
