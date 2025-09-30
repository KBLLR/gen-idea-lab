/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';
import EventEmitter from 'eventemitter3';
import { DEFAULT_LIVE_API_MODEL } from './constants.js';
import { difference } from 'lodash';
import { base64ToArrayBuffer } from './utils.js';

/**
 * GenAI Live Client for real-time audio conversation with Gemini
 * Extends EventEmitter to provide event-based communication
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
export class GenAILiveClient extends EventEmitter {
  /**
   * Creates a new GenAILiveClient instance.
   * @param {string} apiKey - API key for authentication with Google GenAI
   * @param {string} [model] - Optional model name to override the default model
   */
  constructor(apiKey, model) {
    super();
    this.model = model || DEFAULT_LIVE_API_MODEL;
    this.client = new GoogleGenAI({ apiKey });
    this.session = null;
    this._status = 'disconnected'; // 'connected' | 'disconnected' | 'connecting'
  }

  get status() {
    return this._status;
  }

  /**
   * Connect to the GenAI Live API
   * @param {Object} config - Live API configuration
   * @returns {Promise<boolean>} True if connection successful
   */
  async connect(config) {
    if (this._status === 'connected' || this._status === 'connecting') {
      console.warn('[GenAILiveClient] Already connected or connecting');
      return false;
    }

    console.log('[GenAILiveClient] Starting connection with model:', this.model);
    this._status = 'connecting';
    const callbacks = {
      onopen: this.onOpen.bind(this),
      onmessage: this.onMessage.bind(this),
      onerror: this.onError.bind(this),
      onclose: this.onClose.bind(this),
    };

    try {
      console.log('[GenAILiveClient] Calling client.live.connect...');
      this.session = await this.client.live.connect({
        model: this.model,
        config: {
          ...config,
        },
        callbacks,
      });
      console.log('[GenAILiveClient] Session created successfully');
    } catch (e) {
      console.error('[GenAILiveClient] Connection error:', e);
      this._status = 'disconnected';
      this.session = null;
      const errorEvent = new ErrorEvent('error', {
        error: e,
        message: e?.message || 'Failed to connect.',
      });
      this.onError(errorEvent);
      return false;
    }

    this._status = 'connected';
    console.log('[GenAILiveClient] Connection successful, status:', this._status);
    return true;
  }

  /**
   * Disconnect from the GenAI Live API
   * @returns {boolean} True if disconnected
   */
  disconnect() {
    this.session?.close();
    this.session = null;
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
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    this.session.sendClientContent({ turns: parts, turnComplete });
    this.log(`client.send`, parts);
  }

  /**
   * Send realtime input (audio/video chunks)
   * @param {Array<{mimeType: string, data: string}>} chunks - Media chunks
   */
  sendRealtimeInput(chunks) {
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    chunks.forEach(chunk => {
      this.session.sendRealtimeInput({ media: chunk });
    });

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
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    if (
      toolResponse.functionResponses &&
      toolResponse.functionResponses.length
    ) {
      this.session.sendToolResponse({
        functionResponses: toolResponse.functionResponses,
      });
    }

    this.log(`client.toolResponse`, { toolResponse });
  }

  /**
   * Handle incoming messages from the server
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
        const otherParts = difference(parts, audioParts);

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
    console.error('error:', e);

    const message = `Could not connect to GenAI Live: ${e.message}`;
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
    console.log('[GenAILiveClient] Connection closing. Code:', e?.code, 'Reason:', e?.reason);
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