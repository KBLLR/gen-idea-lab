/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { audioContext } from './utils.js';
import AudioRecordingWorklet from './worklets/audioProcessing.js';
import VolMeterWorklet from './worklets/volMeter.js';
import { createWorketFromSrc } from './audioworkletRegistry.js';
import EventEmitter from 'eventemitter3';

/**
 * Convert ArrayBuffer to base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * AudioRecorder for capturing microphone input
 * Emits 'data' events with base64-encoded PCM16 audio
 * Emits 'volume' events with RMS volume level
 */
export class AudioRecorder {
  /**
   * Create an AudioRecorder
   * @param {number} [sampleRate=16000] - Sample rate for recording
   */
  constructor(sampleRate = 16000) {
    this.sampleRate = sampleRate;
    this.emitter = new EventEmitter();
    this.stream = undefined;
    this.audioContext = undefined;
    this.source = undefined;
    this.recording = false;
    this.recordingWorklet = undefined;
    this.vuWorklet = undefined;
    this.starting = null;

    // Expose on/off methods
    this.on = this.emitter.on.bind(this.emitter);
    this.off = this.emitter.off.bind(this.emitter);
  }

  /**
   * Start recording audio from microphone
   * @returns {Promise<void>}
   */
  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Could not request user media');
    }

    this.starting = new Promise(async (resolve, reject) => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        const workletName = 'audio-recorder-worklet';
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

        await this.audioContext.audioWorklet.addModule(src);
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName
        );

        this.recordingWorklet.port.onmessage = async (ev) => {
          // Worklet processes recording floats and messages converted buffer
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            const arrayBufferString = arrayBufferToBase64(arrayBuffer);
            this.emitter.emit('data', arrayBufferString);
          }
        };
        this.source.connect(this.recordingWorklet);

        // VU meter worklet
        const vuWorkletName = 'vu-meter';
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorklet)
        );
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        this.vuWorklet.port.onmessage = (ev) => {
          this.emitter.emit('volume', ev.data.volume);
        };

        this.source.connect(this.vuWorklet);
        this.recording = true;
        resolve();
        this.starting = null;
      } catch (error) {
        reject(error);
        this.starting = null;
      }
    });

    return this.starting;
  }

  /**
   * Stop recording and release resources
   */
  stop() {
    // It is plausible that stop would be called before start completes,
    // such as if the WebSocket immediately hangs up
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach(track => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
      this.recording = false;
    };
    if (this.starting) {
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
}