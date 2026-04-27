import type { ApiConfig, PredictionResult, Signal, Timeframe } from './types';

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function buildRequestBody(template: string, imageBase64: string, timeframe: string, symbol: string): string {
  return template
    .replace(/\{\{image_base64\}\}/g, imageBase64)
    .replace(/\{\{timeframe\}\}/g, timeframe)
    .replace(/\{\{symbol\}\}/g, symbol);
}

function parseHeaders(headersStr: string): Record<string, string> {
  try {
    return JSON.parse(headersStr);
  } catch {
    return {};
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
  timeoutMs: number
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error('Request failed');
}

export async function analyzChart(
  apiConfig: ApiConfig,
  imageBase64: string,
  timeframe: Timeframe,
  symbol: string
): Promise<PredictionResult> {
  const startTime = Date.now();
  const headers = parseHeaders(apiConfig.headers);
  const body = buildRequestBody(apiConfig.requestBodyTemplate, imageBase64, timeframe, symbol);

  const response = await fetchWithRetry(
    apiConfig.endpointUrl,
    {
      method: apiConfig.httpMethod,
      headers,
      body: apiConfig.httpMethod === 'POST' ? body : undefined,
    },
    apiConfig.retries,
    apiConfig.timeout
  );

  const rawResponse = await response.json();
  const latency = Date.now() - startTime;

  const prediction = getByPath(rawResponse, apiConfig.responseMapping.predictionPath);
  const confidence = getByPath(rawResponse, apiConfig.responseMapping.confidencePath);
  const analysisText = getByPath(rawResponse, apiConfig.responseMapping.analysisTextPath);
  const signals = getByPath(rawResponse, apiConfig.responseMapping.signalsPath);

  const predDir = String(prediction).toLowerCase();
  if (predDir !== 'green' && predDir !== 'red') {
    throw new Error(`Invalid prediction value: ${prediction}. Expected "green" or "red".`);
  }

  const confNum = Number(confidence);
  const normalizedConfidence = confNum > 1 ? confNum : confNum * 100;

  return {
    prediction: predDir as 'green' | 'red',
    confidence: Math.round(normalizedConfidence),
    timeframe,
    analysis: {
      summary: String(analysisText || 'No analysis summary provided.'),
      signals: Array.isArray(signals) ? (signals as Signal[]) : [],
    },
    meta: {
      model: (rawResponse as Record<string, unknown>)?.meta
        ? String((getByPath(rawResponse, 'meta.model') as string) || 'unknown')
        : 'unknown',
      latency_ms: latency,
    },
    rawResponse,
  };
}

export function generateMockPrediction(timeframe: Timeframe): PredictionResult {
  const isGreen = Math.random() > 0.45;
  const confidence = Math.floor(55 + Math.random() * 40);

  const patterns = [
    { name: 'Candlestick Pattern', values: ['Bullish Engulfing', 'Bearish Engulfing', 'Doji', 'Hammer', 'Shooting Star'] },
    { name: 'RSI', values: ['28', '42', '55', '68', '72'] },
    { name: 'Volume', values: ['above average', 'below average', 'average', 'spike detected'] },
    { name: 'Moving Average', values: ['price above MA', 'price below MA', 'MA crossover', 'MA support'] },
    { name: 'Bollinger Bands', values: ['touching upper band', 'touching lower band', 'squeezing', 'expanding'] },
  ];

  const numSignals = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...patterns].sort(() => Math.random() - 0.5);
  const signals: Signal[] = shuffled.slice(0, numSignals).map((p) => ({
    name: p.name,
    value: p.values[Math.floor(Math.random() * p.values.length)],
    impact: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as Signal['impact'],
  }));

  const summaries = isGreen
    ? [
        'Bullish engulfing pattern with rising momentum; price above short MA.',
        'Strong upward momentum detected. Multiple indicators confirm bullish bias.',
        'Price showing recovery from support level with increasing volume.',
      ]
    : [
        'Bearish reversal pattern detected near resistance level.',
        'Downward pressure with RSI divergence. Sellers dominating price action.',
        'Price rejected from upper Bollinger Band with declining momentum.',
      ];

  return {
    prediction: isGreen ? 'green' : 'red',
    confidence,
    timeframe,
    analysis: {
      summary: summaries[Math.floor(Math.random() * summaries.length)],
      signals,
    },
    meta: {
      model: 'demo-mock-v1',
      latency_ms: 150 + Math.floor(Math.random() * 300),
    },
    rawResponse: { _demo: true, note: 'This is a mock prediction for demo/testing purposes.' },
  };
}
