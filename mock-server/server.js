import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const patterns = [
  { name: 'Candlestick Pattern', values: ['Bullish Engulfing', 'Bearish Engulfing', 'Doji', 'Hammer', 'Shooting Star', 'Morning Star', 'Evening Star'] },
  { name: 'RSI', values: ['28 (Oversold)', '42', '50 (Neutral)', '58', '72 (Overbought)'] },
  { name: 'Volume', values: ['above average', 'below average', 'average', 'spike detected', 'declining'] },
  { name: 'Moving Average', values: ['price above MA20', 'price below MA20', 'golden cross', 'death cross', 'MA support bounce'] },
  { name: 'Bollinger Bands', values: ['touching upper band', 'touching lower band', 'squeeze forming', 'band expansion', 'mean reversion'] },
  { name: 'MACD', values: ['bullish crossover', 'bearish crossover', 'positive histogram', 'negative histogram', 'divergence'] },
  { name: 'Support/Resistance', values: ['near support level', 'near resistance level', 'breakout above resistance', 'breakdown below support'] },
];

const bullishSummaries = [
  'Bullish engulfing pattern detected with rising momentum. Price is above the short-term moving average with RSI indicating room for upward movement.',
  'Strong upward momentum confirmed by multiple indicators. Golden cross forming on MA with increasing volume.',
  'Price bouncing off key support level with bullish candlestick formation. Volume confirms buying pressure.',
  'Oversold RSI recovering with bullish divergence. Price action suggests reversal from lower Bollinger Band.',
  'Consecutive green candles with expanding volume. MACD histogram turning positive, confirming bullish bias.',
];

const bearishSummaries = [
  'Bearish reversal pattern detected near resistance level. RSI showing overbought conditions with declining momentum.',
  'Death cross forming on moving averages with price rejected from upper Bollinger Band.',
  'Increasing selling pressure with bearish engulfing at key resistance. Volume spike confirms distribution.',
  'MACD bearish crossover with negative divergence. Support level under threat with declining volume.',
  'Evening star formation after extended uptrend. Multiple timeframe analysis confirms bearish bias.',
];

function generatePrediction(timeframe) {
  const isGreen = Math.random() > 0.45;
  const confidence = parseFloat((0.55 + Math.random() * 0.40).toFixed(2));

  const numSignals = 2 + Math.floor(Math.random() * 4);
  const shuffled = [...patterns].sort(() => Math.random() - 0.5);
  const signals = shuffled.slice(0, numSignals).map((p) => ({
    name: p.name,
    value: p.values[Math.floor(Math.random() * p.values.length)],
    impact: isGreen
      ? ['positive', 'positive', 'neutral'][Math.floor(Math.random() * 3)]
      : ['negative', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
  }));

  const summaries = isGreen ? bullishSummaries : bearishSummaries;
  const summary = summaries[Math.floor(Math.random() * summaries.length)];

  return {
    prediction: isGreen ? 'green' : 'red',
    confidence,
    timeframe: timeframe || '5s',
    analysis: {
      summary,
      signals,
    },
    meta: {
      model: 'quotex-mock-v1',
      latency_ms: 100 + Math.floor(Math.random() * 400),
    },
  };
}

app.post('/api/predict', (req, res) => {
  const { timeframe, image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Missing image_base64 in request body' });
  }

  // Simulate processing delay
  const delay = 200 + Math.floor(Math.random() * 800);
  setTimeout(() => {
    const prediction = generatePrediction(timeframe);
    console.log(`[${new Date().toISOString()}] Prediction: ${prediction.prediction} (${Math.round(prediction.confidence * 100)}%) for ${timeframe}`);
    res.json(prediction);
  }, delay);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', model: 'quotex-mock-v1' });
});

app.listen(PORT, () => {
  console.log(`\nQuoteX Mock API Server running on http://localhost:${PORT}`);
  console.log(`  POST /api/predict  — Generate chart prediction`);
  console.log(`  GET  /api/health   — Health check\n`);
});
