export type PredictionDirection = 'green' | 'red';
export type ActualOutcome = 'green' | 'red' | 'unknown';
export type Timeframe = '5s' | '10s' | '15s' | '20s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h';
export type Language = 'en' | 'bn';
export type HttpMethod = 'POST' | 'GET';

export interface Signal {
  name: string;
  value: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface PredictionResult {
  prediction: PredictionDirection;
  confidence: number;
  timeframe: Timeframe;
  analysis: {
    summary: string;
    signals: Signal[];
  };
  meta?: {
    model?: string;
    latency_ms?: number;
  };
  rawResponse?: unknown;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  timeframe: Timeframe;
  symbol: string;
  imageThumb: string;
  prediction: PredictionDirection;
  confidence: number;
  analysisSummary: string;
  signals: Signal[];
  apiName: string;
  actualOutcome: ActualOutcome;
  notes: string;
  rawResponse?: unknown;
}

export interface ResponseMapping {
  predictionPath: string;
  confidencePath: string;
  analysisTextPath: string;
  signalsPath: string;
}

export interface ApiConfig {
  id: string;
  name: string;
  endpointUrl: string;
  httpMethod: HttpMethod;
  headers: string;
  requestBodyTemplate: string;
  responseMapping: ResponseMapping;
  timeout: number;
  retries: number;
  isActive: boolean;
}

export interface CaptureSettings {
  autoDetect: boolean;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  imageQuality: number;
}

export interface AppSettings {
  language: Language;
  defaultTimeframe: Timeframe;
  capture: CaptureSettings;
  apis: ApiConfig[];
  activeApiId: string;
  historyRetentionLimit: number;
  enableUpload: boolean;
  demoMode: boolean;
  privacyConsented: boolean;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  id: 'default-api',
  name: 'Default Vision API',
  endpointUrl: 'http://localhost:3001/api/predict',
  httpMethod: 'POST',
  headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2),
  requestBodyTemplate: JSON.stringify(
    {
      image: '{{image_base64}}',
      timeframe: '{{timeframe}}',
      symbol: '{{symbol}}',
    },
    null,
    2
  ),
  responseMapping: {
    predictionPath: 'prediction',
    confidencePath: 'confidence',
    analysisTextPath: 'analysis.summary',
    signalsPath: 'analysis.signals',
  },
  timeout: 30000,
  retries: 2,
  isActive: true,
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  defaultTimeframe: '5s',
  capture: {
    autoDetect: true,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
    imageQuality: 0.92,
  },
  apis: [DEFAULT_API_CONFIG],
  activeApiId: 'default-api',
  historyRetentionLimit: 500,
  enableUpload: true,
  demoMode: true,
  privacyConsented: false,
};

export const TIMEFRAMES: Timeframe[] = ['5s', '10s', '15s', '20s', '30s', '1m', '5m', '15m', '30m', '1h'];

export interface MessagePayload {
  type: string;
  data?: unknown;
}

export interface CaptureResult {
  imageDataUrl: string;
  timeframe?: Timeframe;
  symbol?: string;
}
