import type { HistoryItem } from './types';

export function exportToCSV(items: HistoryItem[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'Timeframe',
    'Symbol',
    'Prediction',
    'Confidence',
    'Analysis Summary',
    'API Name',
    'Actual Outcome',
    'Notes',
  ];

  const rows = items.map((item) => [
    item.id,
    new Date(item.timestamp).toISOString(),
    item.timeframe,
    item.symbol,
    item.prediction,
    String(item.confidence),
    `"${(item.analysisSummary || '').replace(/"/g, '""')}"`,
    item.apiName,
    item.actualOutcome,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportToJSON(items: HistoryItem[]): string {
  const cleaned = items.map(({ imageThumb: _img, ...rest }) => rest);
  return JSON.stringify(cleaned, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
