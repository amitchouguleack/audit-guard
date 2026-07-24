/**
 * Audit Guard Chrome Extension - Background Script
 */

const DEFAULT_CONFIG = {
  endpoint: '',
  apiKey: '',
  orgId: '',
  enabled: true,
  debug: false
};

let config = { ...DEFAULT_CONFIG };
let auditGuard = null;

chrome.storage.sync.get(['config'], (result) => {
  if (result.config) {
    config = { ...DEFAULT_CONFIG, ...result.config };
    initializeSdk();
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.config) {
    config = { ...DEFAULT_CONFIG, ...changes.config.newValue };
    initializeSdk();
  }
});

function initializeSdk() {
  if (!config.endpoint || !config.apiKey) {
    return;
  }

  auditGuard = new AuditGuard({
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    orgId: config.orgId,
    batchSize: 5,
    flushInterval: 10000,
    debug: config.debug
  });

  console.log('[AuditGuard] SDK initialized');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'track') {
    if (auditGuard && config.enabled) {
      auditGuard.track(request.data, {
        source: 'extension',
        url: sender.tab?.url || 'unknown',
        tabId: sender.tab?.id
      });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'SDK not initialized' });
    }
    return true;
  }

  if (request.action === 'getConfig') {
    sendResponse({ config });
    return true;
  }

  if (request.action === 'setConfig') {
    config = { ...DEFAULT_CONFIG, ...request.config };
    chrome.storage.sync.set({ config });
    initializeSdk();
    sendResponse({ success: true });
    return true;
  }
});
