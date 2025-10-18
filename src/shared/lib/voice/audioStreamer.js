/**
 * @file audioStreamer - PCM16 audio streaming with Web Audio API
 * @license SPDX-License-Identifier: Apache-2.0
 */

import {
  createWorketFromSrc,
  registeredWorklets,
} from './audioworkletRegistry.js';
import { handleAsyncError } from '../errorHandler.js';

/**
 * AudioStreamer handles PCM16 audio streaming using Web Audio API
 * Manages audio queue, playback scheduling, and audio worklets
 */
export class AudioStreamer {
  /**
   * Create an AudioStreamer
   * @param {AudioContext} context - Web Audio API context
   */
  constructor(context) {
    this.context = context;
    this.sampleRate = 24000;
    this.bufferSize = 7680;
    /** @type {Float32Array[]} */
    this.audioQueue = [];
    this.isPlaying = false;
    this.isStreamComplete = false;
    this.checkInterval = null;
    this.scheduledTime = 0;
    this.initialBufferTime = 0.1; // 100ms initial buffer
    this.endOfQueueAudioSource = null;

    // Web Audio API nodes: source => gain => destination
    this.gainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.gainNode.connect(this.context.destination);

    this.onComplete = () => {};

    // Bind methods
    this.addPCM16 = this.addPCM16.bind(this);
  }

  /**
   * Add an AudioWorklet processor
   * @param {string} workletName - Name of the worklet
   * @param {string} workletSrc - Worklet source code
   * @param {Function} handler - Message handler function
   * @returns {Promise<this>}
   */
  async addWorklet(workletName, workletSrc, handler) {
    let workletsRecord = registeredWorklets.get(this.context);
    if (workletsRecord && workletsRecord[workletName]) {
      // The worklet already exists on this context
      // Add the new handler to it
      workletsRecord[workletName].handlers.push(handler);
      return Promise.resolve(this);
    }

    if (!workletsRecord) {
      registeredWorklets.set(this.context, {});
      workletsRecord = registeredWorklets.get(this.context);
    }

    // Create new record to fill in as becomes available
    workletsRecord[workletName] = { handlers: [handler] };

    const src = createWorketFromSrc(workletName, workletSrc);
    await this.context.audioWorklet.addModule(src);
    const worklet = new AudioWorkletNode(this.context, workletName);

    // Add the node into the map
    workletsRecord[workletName].node = worklet;

    return this;
  }

  /**
   * Converts a Uint8Array of PCM16 audio data into a Float32Array.
   * PCM16 is a common raw audio format, but the Web Audio API generally
   * expects audio data as Float32Arrays with samples normalized between -1.0 and 1.0.
   * @param {Uint8Array} chunk - PCM16 audio data
   * @returns {Float32Array} Converted audio data
   * @private
   */
  _processPCM16Chunk(chunk) {
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);

    for (let i = 0; i < chunk.length / 2; i++) {
      try {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768;
      } catch (e) {
        handleAsyncError(e, {
          context: 'Converting PCM16 audio sample to Float32',
          showToast: false, // Silent error during audio conversion
          silent: false
        });
      }
    }
    return float32Array;
  }

  /**
   * Add PCM16 audio chunk to the queue and start playback if needed
   * @param {Uint8Array} chunk - PCM16 audio data
   */
  addPCM16(chunk) {
    // Reset the stream complete flag when a new chunk is added.
    this.isStreamComplete = false;
    // Process the chunk into a Float32Array
    let processingBuffer = this._processPCM16Chunk(chunk);
    // Add the processed buffer to the queue if it's larger than the buffer size.
    while (processingBuffer.length >= this.bufferSize) {
      const buffer = processingBuffer.slice(0, this.bufferSize);
      this.audioQueue.push(buffer);
      processingBuffer = processingBuffer.slice(this.bufferSize);
    }
    // Add the remaining buffer to the queue if it's not empty.
    if (processingBuffer.length > 0) {
      this.audioQueue.push(processingBuffer);
    }
    // Start playing if not already playing.
    if (!this.isPlaying) {
      this.isPlaying = true;
      // Initialize scheduledTime only when we start playing
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      this.scheduleNextBuffer();
    }
  }

  /**
   * Create an AudioBuffer from Float32Array data
   * @param {Float32Array} audioData - Audio samples
   * @returns {AudioBuffer}
   * @private
   */
  createAudioBuffer(audioData) {
    const audioBuffer = this.context.createBuffer(
      1,
      audioData.length,
      this.sampleRate
    );
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  /**
   * Schedule the next buffer(s) for playback
   * @private
   */
  scheduleNextBuffer() {
    const SCHEDULE_AHEAD_TIME = 0.2;

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      const audioData = this.audioQueue.shift();
      const audioBuffer = this.createAudioBuffer(audioData);
      const source = this.context.createBufferSource();

      if (this.audioQueue.length === 0) {
        if (this.endOfQueueAudioSource) {
          this.endOfQueueAudioSource.onended = null;
        }
        this.endOfQueueAudioSource = source;
        source.onended = () => {
          if (
            !this.audioQueue.length &&
            this.endOfQueueAudioSource === source
          ) {
            this.endOfQueueAudioSource = null;
            this.onComplete();
          }
        };
      }

      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const worklets = registeredWorklets.get(this.context);

      if (worklets) {
        Object.entries(worklets).forEach(([workletName, graph]) => {
          const { node, handlers } = graph;
          if (node) {
            source.connect(node);
            node.port.onmessage = function (ev) {
              handlers.forEach(handler => {
                handler.call(node.port, ev);
              });
            };
            node.connect(this.context.destination);
          }
        });
      }
      // Ensure we never schedule in the past
      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      source.start(startTime);
      this.scheduledTime = startTime + audioBuffer.duration;
    }

    if (this.audioQueue.length === 0) {
      if (this.isStreamComplete) {
        this.isPlaying = false;
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
      } else {
        if (!this.checkInterval) {
          this.checkInterval = window.setInterval(() => {
            if (this.audioQueue.length > 0) {
              this.scheduleNextBuffer();
            }
          }, 100);
        }
      }
    } else {
      const nextCheckTime =
        (this.scheduledTime - this.context.currentTime) * 1000;
      setTimeout(
        () => this.scheduleNextBuffer(),
        Math.max(0, nextCheckTime - 50)
      );
    }
  }

  /**
   * Stop audio playback and clear the queue
   */
  stop() {
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + 0.1
    );

    setTimeout(() => {
      this.gainNode.disconnect();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }, 200);
  }

  /**
   * Resume audio playback
   * @returns {Promise<void>}
   */
  async resume() {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
  }

  /**
   * Mark the stream as complete
   */
  complete() {
    this.isStreamComplete = true;
    this.onComplete();
  }
}