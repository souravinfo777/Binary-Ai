import type { AppSettings, CaptureResult, Timeframe } from '../lib/types';
import { getSettings } from '../lib/storage';
import { analyzChart, generateMockPrediction } from '../lib/api';

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'analyze-chart') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
      const captureResult = await captureAndAnalyze(tab.id);
      if (captureResult) {
        await chrome.storage.local.set({ lastCaptureResult: captureResult });
        await chrome.action.openPopup();
      }
    } catch (err) {
      console.error('Analysis via shortcut failed:', err);
    }
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CAPTURE_TAB') {
    handleCapture(message.tabId).then(sendResponse).catch((err) => {
      sendResponse({ error: String(err) });
    });
    return true;
  }

  if (message.type === 'ANALYZE') {
    handleAnalysis(message.imageBase64, message.timeframe, message.symbol).then(sendResponse).catch((err) => {
      sendResponse({ error: String(err) });
    });
    return true;
  }

  if (message.type === 'GET_TIMEFRAME') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        sendResponse({ timeframe: null });
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { type: 'DETECT_TIMEFRAME' }, (response) => {
        sendResponse(response || { timeframe: null });
      });
    });
    return true;
  }

  return false;
});

async function handleCapture(tabId?: number): Promise<CaptureResult> {
  let targetTabId = tabId;
  if (!targetTabId) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTabId = tab?.id;
  }
  if (!targetTabId) throw new Error('No active tab found');

  const dataUrl: string = await chrome.tabs.captureVisibleTab({
    format: 'png',
    quality: 100,
  });

  let timeframe: Timeframe | undefined;
  try {
    const response = await chrome.tabs.sendMessage(targetTabId, { type: 'DETECT_TIMEFRAME' });
    timeframe = response?.timeframe;
  } catch {
    // Content script may not be available
  }

  let symbol: string | undefined;
  try {
    const response = await chrome.tabs.sendMessage(targetTabId, { type: 'DETECT_SYMBOL' });
    symbol = response?.symbol;
  } catch {
    // Content script may not be available
  }

  return {
    imageDataUrl: dataUrl,
    timeframe,
    symbol,
  };
}

async function handleAnalysis(
  imageBase64: string,
  timeframe: Timeframe,
  symbol: string
): Promise<{ result?: unknown; error?: string }> {
  const settings: AppSettings = await getSettings();

  if (settings.demoMode) {
    const result = generateMockPrediction(timeframe);
    return { result };
  }

  if (!settings.enableUpload) {
    return { error: 'Image upload is disabled in privacy settings.' };
  }

  const activeApi = settings.apis.find((a) => a.id === settings.activeApiId);
  if (!activeApi) {
    return { error: 'No active API configured. Please configure an API in Settings.' };
  }

  try {
    const result = await analyzChart(activeApi, imageBase64, timeframe, symbol);
    return { result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function captureAndAnalyze(tabId: number): Promise<CaptureResult | null> {
  try {
    return await handleCapture(tabId);
  } catch {
    return null;
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'analyze-quotex-chart' && tab?.id) {
    const result = await handleCapture(tab.id);
    if (result) {
      await chrome.storage.local.set({ lastCaptureResult: result });
      await chrome.action.openPopup();
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyze-quotex-chart',
    title: 'Analyze QuoteX Chart',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://quotex.com/*',
      'https://qxbroker.com/*',
      'https://*.quotex.com/*',
      'https://*.qxbroker.com/*',
    ],
  });
});
