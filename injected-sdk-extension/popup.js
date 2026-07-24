/**
 * Audit Guard Chrome Extension - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('configForm');
  const endpointInput = document.getElementById('endpoint');
  const apiKeyInput = document.getElementById('apiKey');
  const orgIdInput = document.getElementById('orgId');
  const statusDiv = document.getElementById('status');

  // Load saved config
  chrome.runtime.sendMessage({ action: 'getConfig' }, (response) => {
    if (response.config) {
      endpointInput.value = response.config.endpoint || '';
      apiKeyInput.value = response.config.apiKey || '';
      orgIdInput.value = response.config.orgId || '';
    }
  });

  // Save config
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const config = {
      endpoint: endpointInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      orgId: orgIdInput.value.trim()
    };

    chrome.runtime.sendMessage({ action: 'setConfig', config }, (response) => {
      if (response.success) {
        showStatus('Configuration saved successfully', 'success');
      } else {
        showStatus('Failed to save configuration', 'error');
      }
    });
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});
