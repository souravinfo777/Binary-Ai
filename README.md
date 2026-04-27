# QuoteX Binary Trading Chart Predictor (Chrome Extension)

A screenshot-based prediction tool that analyzes QuoteX Binary Trading chart images and predicts whether the next candle will be **Green (Up)** or **Red (Down)**. Includes bilingual UI (Bangla/English), history, detailed analysis, keyboard shortcuts, and configurable API settings.

> **Disclaimer:** This tool provides probabilistic analysis only and is **not financial advice**. Use at your own risk.

## Features

- **Screenshot Capture** — Auto-capture the visible QuoteX chart or manually upload a chart image
- **Timeframe Detection** — Auto-detects chart timeframe (5s, 10s, 15s, 20s, 30s, 1m, 5m, etc.) from the QuoteX UI
- **AI Prediction** — Sends chart image to a configurable API for candle direction prediction with confidence score
- **Multi-API Studio** — Configure multiple API endpoints with custom request/response mappings, test connections, import/export configs
- **Detailed Analysis** — View detected patterns, signals, reasoning summary, and raw API response
- **History** — Persistent history with search, filter, sort, export (CSV/JSON), and actual outcome tracking
- **Bilingual** — Full Bangla (বাংলা) and English localization
- **Keyboard Shortcut** — `Ctrl+Shift+Q` (or `Cmd+Shift+Q` on Mac) to trigger analysis
- **Demo Mode** — Built-in mock predictions for testing without an API
- **Privacy-First** — Domain-restricted permissions, consent flow, optional upload disable

## Tech Stack

- **Manifest V3** Chrome Extension
- **TypeScript** + **React 18** + **Tailwind CSS 3**
- **Vite** build system with multi-entry points
- **Mock Server** (Express.js) for testing

## Project Structure

```
Binary-Ai/
├── public/
│   ├── manifest.json          # Chrome extension manifest (MV3)
│   ├── icons/                 # Extension icons (16/32/48/128)
│   └── _locales/              # i18n messages (en, bn)
├── src/
│   ├── background/            # Service worker (capture, API, commands)
│   ├── content/               # Content script (timeframe/chart detection)
│   ├── popup/                 # Popup UI (React)
│   │   ├── Popup.tsx
│   │   └── components/        # CapturePreview, PredictionView, etc.
│   ├── options/               # Settings page (React)
│   │   ├── Options.tsx
│   │   └── components/        # ApiStudio
│   ├── lib/                   # Shared utilities
│   │   ├── types.ts           # TypeScript types & defaults
│   │   ├── api.ts             # API client & mock prediction
│   │   ├── storage.ts         # chrome.storage wrapper
│   │   ├── i18n.ts            # Localization helper
│   │   └── export.ts          # CSV/JSON export
│   └── styles/
│       └── globals.css        # Tailwind + custom styles
├── mock-server/               # Express mock API server
│   ├── server.js
│   └── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

## Setup & Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Install & Build

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Or watch for changes during development
npm run dev
```

### Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. Navigate to [quotex.com](https://quotex.com) or [qxbroker.com](https://qxbroker.com)
6. Click the extension icon or press `Ctrl+Shift+Q`

### Mock API Server

For testing without a real AI model:

```bash
cd mock-server
npm install
npm start
# Server runs on http://localhost:3001
```

The default API configuration in the extension points to `http://localhost:3001/api/predict`.

### API Contract

The extension expects a JSON response matching (paths are configurable):

```json
{
  "prediction": "green",
  "confidence": 0.76,
  "timeframe": "5s",
  "analysis": {
    "summary": "Bullish engulfing pattern with rising momentum.",
    "signals": [
      { "name": "RSI", "value": "58", "impact": "neutral" },
      { "name": "Volume", "value": "above average", "impact": "positive" }
    ]
  },
  "meta": { "model": "your-model-v1", "latency_ms": 420 }
}
```

Configure custom response mapping in **Settings → APIs → Response Mapping** using dot-notation paths.

## Configuring APIs

1. Open the extension **Settings** (gear icon in popup)
2. Go to **API Settings**
3. Click **Add API** to create a new configuration:
   - **Name**: A label for this API endpoint
   - **Endpoint URL**: The API URL
   - **Headers**: JSON headers (e.g., `{"Authorization": "Bearer YOUR_KEY"}`)
   - **Request Body Template**: Use `{{image_base64}}`, `{{timeframe}}`, `{{symbol}}` placeholders
   - **Response Mapping**: Dot-notation paths to extract prediction, confidence, analysis, signals
4. **Test Connection** to verify
5. **Set as Active** to use this API

You can import/export API configs as JSON for sharing or backup.

## Permissions

| Permission | Purpose |
|---|---|
| `activeTab` | Capture visible tab screenshot |
| `scripting` | Inject content script for chart detection |
| `storage` | Save settings, history, and API configs |
| `tabs` | Access tab information for capture |
| `contextMenus` | Right-click "Analyze Chart" option |
| `host_permissions` | Limited to QuoteX/qxbroker domains only |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+Q` | Capture and analyze current chart |

Customize at `chrome://extensions/shortcuts`.

## Localization

The extension supports:
- **English** (en)
- **বাংলা / Bangla** (bn)

Toggle language from the popup header or Settings → Language.

## Privacy

- Screenshots are **only** sent to APIs you explicitly configure
- No personal or account data is collected
- All data is stored locally in your browser
- Domain permissions are restricted to QuoteX/qxbroker only
- You can disable image upload entirely in Settings → Privacy
- Demo mode works fully offline with mock predictions

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for the full privacy policy.

## Troubleshooting

| Issue | Solution |
|---|---|
| Extension not showing on QuoteX | Make sure you're on `quotex.com` or `qxbroker.com` |
| Screenshot capture fails | Grant the extension permission to access the tab |
| API returns errors | Check API config, headers, and endpoint in Settings |
| Timeframe not detected | Manually select from the dropdown after capture |
| Shortcut doesn't work | Check/reassign at `chrome://extensions/shortcuts` |

## License

MIT
