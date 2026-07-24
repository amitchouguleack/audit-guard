/**
 * Audit Guard Ingestion SDK
 * Portable data interception mechanism for compliance analysis
 */

class AuditGuard {
  constructor(config = {}) {
    this.endpoint = config.endpoint || '';
    this.apiKey = config.apiKey || '';
    this.orgId = config.orgId || '';
    this.batchSize = config.batchSize || 10;
    this.flushInterval = config.flushInterval || 5000;
    this.debug = config.debug || false;

    this.queue = [];
    this.isProcessing = false;
    this.flushTimer = null;

    if (this.endpoint) {
      this.startFlushTimer();
    }
  }

  log(message, data = null) {
    if (this.debug) {
      console.log(`[AuditGuard] ${message}`, data);
    }
  }

  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  track(data, metadata = {}) {
    if (!data) {
      this.log('No data provided to track');
      return;
    }

    const entry = {
      id: this.generateId(),
      data: typeof data === 'string' ? data : JSON.stringify(data),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'browser'
      }
    };

    this.queue.push(entry);
    this.log('Queued entry', entry);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  trackForm(formElement, options = {}) {
    if (!formElement || !(formElement instanceof HTMLFormElement)) {
      this.log('Invalid form element');
      return;
    }

    const originalSubmit = formElement.onsubmit;

    formElement.onsubmit = async (event) => {
      event.preventDefault();

      const formData = new FormData(formElement);
      const data = {};

      for (const [key, value] of formData.entries()) {
        if (options.excludeFields && options.excludeFields.includes(key)) {
          continue;
        }
        data[key] = value;
      }

      this.track(data, {
        source: 'form',
        formAction: formElement.action,
        formMethod: formElement.method
      });

      if (options.preventDefaultDefault !== false) {
        if (originalSubmit) {
          originalSubmit.call(formElement, event);
        } else {
          formElement.submit();
        }
      }
    };
  }

  async flush() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const batch = this.queue.splice(0, this.batchSize);
      this.log('Flushing batch', batch);

      const payload = {
        api_key: this.apiKey,
        org_id: this.orgId,
        source: 'sdk',
        content: batch.map(item => item.data).join('\n---\n'),
        metadata: {
          batch_size: batch.length,
          entries: batch.map(item => item.metadata)
        }
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AuditGuard-Version': '1.0.0',
          'X-AuditGuard-Org': this.orgId
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.log('Flush successful', result);

      return result;

    } catch (error) {
      this.log('Flush failed', error);
      throw error;

    } finally {
      this.isProcessing = false;

      if (this.queue.length > 0) {
        setTimeout(() => this.flush(), 1000);
      }
    }
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy() {
    this.stopFlushTimer();
    this.flush();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuditGuard;
}

if (typeof window !== 'undefined') {
  window.AuditGuard = AuditGuard;
}
