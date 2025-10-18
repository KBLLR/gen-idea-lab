/**
 * @file genAIProxyClient - Backend-proxied real-time audio conversation with Gemini
 * @license SPDX-License-Identifier: Apache-2.0
 */
import EventEmitter from 'eventemitter3';
import { handleAsyncError } from '../errorHandler.js';
import { DEFAULT_LIVE_API_MODEL } from './constants.js';
import { base64ToArrayBuffer } from './utils.js';

/**
 * GenAI Live Proxy Client for real-time audio conversation via backend proxy
 * Connects to backend WebSocket proxy instead of directly to Gemini
 *
 * Events:
 * - audio: (data: ArrayBuffer) => void
 * - close: (event: CloseEvent) => void
 * - content: (data: LiveServerContent) => void
 * - error: (e: ErrorEvent) => void
 * - interrupted: () => void
 * - log: (log: StreamingLog) => void
 * - open: () => void
 * - setupcomplete: () => void
 * - toolcall: (toolCall: LiveServerToolCall) => void
 * - toolcallcancellation: (cancellation) => void
 * - turncomplete: () => void
 * - inputTranscription: (text: string, isFinal: boolean) => void
 * - outputTranscription: (text: string, isFinal: boolean) => void
 */
export class GenAIProxyClient extends EventEmitter {
  /**
   * Creates a new GenAIProxyClient instance.
   * @param {string} [model] - Optional model name to override the default model
   */
  constructor(model) {
    super();
    this.model = model || DEFAULT_LIVE_API_MODEL;
    this.ws = null;
    this._status = 'disconnected'; // 'connected' | 'disconnected' | 'connecting'
  }

  get status() {
    return this._status;
  }

  /**
   * Connect to the backend proxy
   * @param {Object} config - Live API configuration
   * @returns {Promise<boolean>} True if connection successful
   */
  async connect(config) {
    if (this._status === 'connected' || this._status === 'connecting') {
      console.warn('[GenAIProxyClient] Already connected or connecting');
      return false;
    }

    console.log('[GenAIProxyClient] Connecting to backend proxy...');
    this._status = 'connecting';

    try {
      // Determine WebSocket URL
      // Note: auth_token cookie is httpOnly and will be sent automatically by the browser
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/live-api`;

      console.log('[GenAIProxyClient] Connecting to:', wsUrl);

      // Create WebSocket connection to backend
      this.ws = new WebSocket(wsUrl);

      // Setup WebSocket event handlers
      this.ws.onopen = () => {
        console.log('[GenAIProxyClient] WebSocket connected, requesting Gemini session...');
        // Send connection request to backend
        this.ws.send(JSON.stringify({
          type: 'connect',
          model: this.model,
          config
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleProxyMessage(message);
        } catch (err) {
          handleAsyncError(err, {
            context: 'Parsing GenAI Proxy WebSocket message',
            showToast: false, // Silent error during message parsing
            silent: false
          });
        }
      };

      this.ws.onerror = (error) => {
        handleAsyncError(error, {
          context: 'GenAI Proxy WebSocket error',
          showToast: true,
          fallbackMessage: 'WebSocket connection error. Please try again.'
        });
        this._status = 'disconnected';
        const errorEvent = new ErrorEvent('error', {
          error,
          message: 'WebSocket connection error'
        });
        this.onError(errorEvent);
      };

      this.ws.onclose = (event) => {
        console.log('[GenAIProxyClient] WebSocket closed:', event.code, event.reason);
        this._status = 'disconnected';
        this.onClose(event);
      };

      // Wait for connection
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.once('open', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        this.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    } catch (e) {
      handleAsyncError(e, {
        context: 'GenAI Proxy connection',
        showToast: true,
        fallbackMessage: 'Failed to connect to voice proxy. Please check your connection and try again.'
      });
      this._status = 'disconnected';
      const errorEvent = new ErrorEvent('error', {
        error: e,
        message: e?.message || 'Failed to connect.'
      });
      this.onError(errorEvent);
      return false;
    }
  }

  /**
   * Disconnect from the proxy
   * @returns {boolean} True if disconnected
   */
  disconnect() {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'disconnect' }));
      this.ws.close();
      this.ws = null;
    }
    this._status = 'disconnected';
    this.log('client.close', `Disconnected`);
    return true;
  }

  /**
   * Send content parts to the model
   * @param {Object|Array} parts - Content parts to send
   * @param {boolean} [turnComplete=true] - Whether this completes the turn
   */
  send(parts, turnComplete = true) {
    if (this._status !== 'connected' || !this.ws) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    this.ws.send(JSON.stringify({
      type: 'send',
      parts,
      turnComplete
    }));
    this.log(`client.send`, parts);
  }

  /**
   * Send realtime input (audio/video chunks)
   * @param {Array<{mimeType: string, data: string}>} chunks - Media chunks
   */
  sendRealtimeInput(chunks) {
    if (this._status !== 'connected' || !this.ws) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    this.ws.send(JSON.stringify({
      type: 'realtimeInput',
      chunks
    }));

    let hasAudio = false;
    let hasVideo = false;
    for (let i = 0; i < chunks.length; i++) {
      const ch = chunks[i];
      if (ch.mimeType.includes('audio')) hasAudio = true;
      if (ch.mimeType.includes('image')) hasVideo = true;
      if (hasAudio && hasVideo) break;
    }

    let message = 'unknown';
    if (hasAudio && hasVideo) message = 'audio + video';
    else if (hasAudio) message = 'audio';
    else if (hasVideo) message = 'video';
    this.log(`client.realtimeInput`, message);
  }

  /**
   * Send tool response back to the model
   * @param {Object} toolResponse - Tool response object
   */
  sendToolResponse(toolResponse) {
    if (this._status !== 'connected' || !this.ws) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    if (toolResponse.functionResponses && toolResponse.functionResponses.length) {
      this.ws.send(JSON.stringify({
        type: 'toolResponse',
        toolResponse
      }));
    }
    this.log(`client.toolResponse`, { toolResponse });
  }

  /**
   * Handle messages from backend proxy
   * @param {Object} message - Proxy message
   */
  handleProxyMessage(message) {
    if (message.type === 'open') {
      this._status = 'connected';
      this.onOpen();
      return;
    }

    if (message.type === 'close') {
      this._status = 'disconnected';
      this.onClose({ code: message.code, reason: message.reason });
      return;
    }

    if (message.type === 'error') {
      const errorEvent = new ErrorEvent('error', {
        message: message.error?.message || 'Proxy error'
      });
      this.onError(errorEvent);
      return;
    }

    if (message.type === 'message') {
      // This is a Gemini message forwarded by the proxy
      this.onMessage(message.data);
    }
  }

  /**
   * Handle incoming messages from Gemini (via proxy)
   * @param {Object} message - Server message
   */
  onMessage(message) {
    if (message.setupComplete) {
      this.emit('setupcomplete');
      return;
    }
    if (message.toolCall) {
      this.log('server.toolCall', message);
      this.emit('toolcall', message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      this.log('receive.toolCallCancellation', message);
      this.emit('toolcallcancellation', message.toolCallCancellation);
      return;
    }

    if (message.serverContent) {
      const { serverContent } = message;
      if (serverContent.interrupted) {
        this.log('receive.serverContent', 'interrupted');
        this.emit('interrupted');
        return;
      }

      if (serverContent.inputTranscription) {
        this.emit(
          'inputTranscription',
          serverContent.inputTranscription.text,
          serverContent.inputTranscription.isFinal ?? false,
        );
        this.log(
          'server.inputTranscription',
          serverContent.inputTranscription.text,
        );
      }

      if (serverContent.outputTranscription) {
        this.emit(
          'outputTranscription',
          serverContent.outputTranscription.text,
          serverContent.outputTranscription.isFinal ?? false,
        );
        this.log(
          'server.outputTranscription',
          serverContent.outputTranscription.text,
        );
      }

      if (serverContent.modelTurn) {
        let parts = serverContent.modelTurn.parts || [];

        const audioParts = parts.filter(p =>
          p.inlineData?.mimeType?.startsWith('audio/pcm'),
        );
        const base64s = audioParts.map(p => p.inlineData?.data);
        const otherParts = parts.filter(p => !audioParts.includes(p));

        base64s.forEach(b64 => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit('audio', data);
            this.log(`server.audio`, `buffer (${data.byteLength})`);
          }
        });

        if (otherParts.length > 0) {
          const content = { modelTurn: { parts: otherParts } };
          this.emit('content', content);
          this.log(`server.content`, message);
        }
      }

      if (serverContent.turnComplete) {
        this.log('server.send', 'turnComplete');
        this.emit('turncomplete');
      }
    }
  }

  /**
   * Handle connection errors
   * @param {ErrorEvent} e - Error event
   */
  onError(e) {
    this._status = 'disconnected';
    handleAsyncError(e, {
      context: 'GenAI Proxy error event',
      showToast: true,
      fallbackMessage: 'Voice proxy connection error. Please try again.'
    });

    const message = `Could not connect to Live API: ${e.message}`;
    this.log(`server.${e.type}`, message);
    this.emit('error', e);
  }

  /**
   * Handle connection open
   */
  onOpen() {
    this._status = 'connected';
    this.emit('open');
  }

  /**
   * Handle connection close
   * @param {CloseEvent} e - Close event
   */
  onClose(e) {
    console.log('[GenAIProxyClient] Connection closing. Code:', e?.code, 'Reason:', e?.reason);
    this._status = 'disconnected';
    let reason = e?.reason || '';
    if (reason.toLowerCase().includes('error')) {
      const prelude = 'ERROR]';
      const preludeIndex = reason.indexOf(prelude);
      if (preludeIndex > 0) {
        reason = reason.slice(preludeIndex + prelude.length + 1, Infinity);
      }
    }

    this.log(
      `server.${e?.type || 'close'}`,
      `disconnected ${reason ? `with reason: ${reason}` : ``}`
    );
    this.emit('close', e);
  }

  /**
   * Internal method to emit a log event.
   * @param {string} type - Log type
   * @param {string|Object} message - Log message
   */
  log(type, message) {
    this.emit('log', {
      type,
      message,
      date: new Date(),
    });
  }
}
