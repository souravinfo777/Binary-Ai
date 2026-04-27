# Privacy Policy — QuoteX Chart Predictor Chrome Extension

**Last updated:** 2024

## What This Extension Does

QuoteX Chart Predictor is a Chrome extension that captures screenshots of trading charts on QuoteX/qxbroker websites and sends them to a user-configured API for analysis. The extension predicts whether the next candle will move up (green) or down (red) based on the API's response.

## Data Collection

### What We Collect
- **Chart Screenshots**: When you initiate an analysis, a screenshot of the visible browser tab is captured. This image may be sent to a third-party API that you have configured in the extension settings.
- **Analysis History**: Prediction results, timestamps, timeframes, and thumbnail images are stored locally in your browser.
- **Extension Settings**: Your preferences (language, API configurations, capture settings) are stored in Chrome's sync storage.

### What We Do NOT Collect
- Personal information (name, email, etc.)
- Trading account credentials or balances
- Browsing history outside of QuoteX/qxbroker domains
- Financial transaction data

## Data Storage

- All data is stored **locally in your browser** using Chrome's built-in storage APIs (`chrome.storage.local` and `chrome.storage.sync`).
- **No data is sent to any server** unless you explicitly configure an API endpoint and initiate an analysis.
- You can clear all stored data at any time through the extension's History settings.

## Third-Party API Usage

- When you configure an API endpoint and run an analysis, the chart screenshot (as base64 image data) and selected timeframe are sent to that API.
- **You are responsible for choosing which API to use** and understanding that API's own privacy policy.
- The extension does not send data to any API by default. In Demo Mode, all predictions are generated locally without any network requests.

## Permissions Justification

| Permission | Why It's Needed |
|---|---|
| `activeTab` | To capture a screenshot of the current trading chart |
| `scripting` | To detect chart elements and timeframe on the QuoteX page |
| `storage` | To save your settings and analysis history locally |
| `tabs` | To identify the active tab for screenshot capture |
| `contextMenus` | To provide a right-click "Analyze Chart" option |
| Host permissions (`quotex.com`, `qxbroker.com`) | Content scripts run only on these domains |

## Your Controls

- **Disable Upload**: Turn off image sending in Settings → Privacy
- **Demo Mode**: Use the extension fully offline with mock predictions
- **Clear History**: Delete all stored analysis history at any time
- **Remove Extension**: Uninstalling the extension removes all locally stored data

## Consent

Before the first analysis that involves sending data to an API, the extension displays a consent dialog explaining that screenshots will be sent to a third-party service. You can decline and use Demo Mode instead.

## Disclaimer

This tool provides **probabilistic analysis only** and is **not financial advice**. Trading binary options involves significant risk. Use this tool at your own risk. The developers are not responsible for any financial losses incurred through the use of this extension.

## Contact

For questions about this privacy policy, please open an issue on the project's GitHub repository.
