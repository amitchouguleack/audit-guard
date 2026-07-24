/**
 * Audit Guard Chrome Extension - Content Script
 * Intercepts form submissions and sensitive data
 */

(function() {
  'use strict';

  const INTERCEPTED_DATA = new WeakSet();

  function trackData(data, source) {
    chrome.runtime.sendMessage({
      action: 'track',
      data: data,
      source: source
    });
  }

  function interceptFormSubmits() {
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (INTERCEPTED_DATA.has(form)) return;

      INTERCEPTED_DATA.add(form);

      const formData = new FormData(form);
      const data = {};

      for (const [key, value] of formData.entries()) {
        if (isSensitiveField(key)) {
          data[key] = '[REDACTED]';
        } else {
          data[key] = value;
        }
      }

      if (Object.keys(data).length > 0) {
        trackData(data, 'form_submit');
      }
    }, true);
  }

  function isSensitiveField(fieldName) {
    const sensitivePatterns = [
      /password/i,
      /passwd/i,
      /pwd/i,
      /secret/i,
      /token/i,
      /api[_-]?key/i,
      /credit[_-]?card/i,
      /ssn/i,
      /social[_-]?security/i,
      /cvv/i,
      /pin/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(fieldName));
  }

  function interceptNetworkRequests() {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
      const [url, options] = args;

      if (options && options.body && typeof options.body === 'string') {
        try {
          const data = JSON.parse(options.body);
          trackData(data, 'fetch_request');
        } catch (e) {
          // Not JSON, ignore
        }
      }

      return originalFetch.apply(this, args);
    };

    const originalXHR = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._auditGuardUrl = url;
      this._auditGuardMethod = method;

      const originalSend = this.send;

      this.send = function(body) {
        if (body && typeof body === 'string') {
          try {
            const data = JSON.parse(body);
            trackData(data, 'xhr_request');
          } catch (e) {
            // Not JSON, ignore
          }
        }

        return originalSend.apply(this, arguments);
      };

      return originalXHR.apply(this, [method, url, ...rest]);
    };
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        interceptFormSubmits();
        interceptNetworkRequests();
      });
    } else {
      interceptFormSubmits();
      interceptNetworkRequests();
    }
  }

  init();
})();
