import type { Timeframe } from '../lib/types';

const TIMEFRAME_SELECTORS = [
  '.timeframe',
  '.interval',
  '[class*="timeframe"]',
  '[class*="interval"]',
  '[class*="time-frame"]',
  '[data-timeframe]',
  '[class*="period"]',
  '.chart-period',
  '.trading-timeframe',
];

const TIMEFRAME_PATTERNS: Record<string, Timeframe> = {
  '5s': '5s',
  '10s': '10s',
  '15s': '15s',
  '20s': '20s',
  '30s': '30s',
  '1m': '1m',
  '1 min': '1m',
  '5m': '5m',
  '5 min': '5m',
  '15m': '15m',
  '15 min': '15m',
  '30m': '30m',
  '30 min': '30m',
  '1h': '1h',
  '1 hour': '1h',
  '60m': '1h',
};

const SORTED_PATTERNS = Object.entries(TIMEFRAME_PATTERNS).sort(
  ([a], [b]) => b.length - a.length
);

function detectTimeframe(): Timeframe | null {
  for (const selector of TIMEFRAME_SELECTORS) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const text = (el.textContent || '').trim().toLowerCase();
      for (const [pattern, tf] of SORTED_PATTERNS) {
        if (text === pattern || text.includes(pattern)) {
          return tf;
        }
      }
      const dataAttr = el.getAttribute('data-timeframe') || '';
      if (dataAttr) {
        const normalized = dataAttr.toLowerCase();
        for (const [pattern, tf] of Object.entries(TIMEFRAME_PATTERNS)) {
          if (normalized === pattern) return tf;
        }
      }
    }
  }

  const allElements = document.querySelectorAll('button, span, div, a');
  for (const el of allElements) {
    const text = (el.textContent || '').trim().toLowerCase();
    if (text.length < 10) {
      for (const [pattern, tf] of Object.entries(TIMEFRAME_PATTERNS)) {
        if (text === pattern) return tf;
      }
    }
  }

  return null;
}

function detectSymbol(): string | null {
  const symbolSelectors = [
    '.symbol',
    '[class*="symbol"]',
    '[class*="asset"]',
    '.asset-name',
    '.trading-pair',
    '[class*="pair"]',
  ];

  for (const selector of symbolSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = (el.textContent || '').trim();
      if (text && text.length < 30) return text;
    }
  }

  return null;
}

function getChartBounds(): { x: number; y: number; width: number; height: number } | null {
  const chartSelectors = [
    'canvas',
    '.chart-container',
    '[class*="chart"]',
    '.trading-chart',
    '#chart',
    '.chart',
    '[class*="candle"]',
  ];

  for (const selector of chartSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        return {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }
    }
  }

  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'DETECT_TIMEFRAME') {
    sendResponse({ timeframe: detectTimeframe() });
    return true;
  }

  if (message.type === 'DETECT_SYMBOL') {
    sendResponse({ symbol: detectSymbol() });
    return true;
  }

  if (message.type === 'GET_CHART_BOUNDS') {
    sendResponse({ bounds: getChartBounds() });
    return true;
  }

  return false;
});
