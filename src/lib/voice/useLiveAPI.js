/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GenAIProxyClient } from './genAIProxyClient.js';
import { AudioStreamer } from './audioStreamer.js';
import { audioContext } from './utils.js';
import VolMeterWorklet from './worklets/volMeter.js';

/**
 * React hook for using Gemini Live API via backend proxy (secure)
 * No API key needed on frontend - auth handled via JWT token
 * @param {Object} params
 * @param {string} [params.model] - Optional model override
 * @returns {Object} Live API controls and state
 */
export function useLiveAPI({ model }) {
  const client = useMemo(
    () => new GenAIProxyClient(model),
    [model]
  );

  const audioStreamerRef = useRef(null);

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState({});

  // Register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet('vumeter-out', VolMeterWorklet, (ev) => {
            setVolume(ev.data.volume);
          })
          .catch(err => {
            console.error('Error adding worklet:', err);
          });
      });
    }
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };

    const onClose = () => {
      setConnected(false);
    };

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data) => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
    };

    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    return () => {
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
    };
  }, [client]);

  const connect = useCallback(async (customConfig) => {
    const finalConfig = customConfig || config;
    console.log('[useLiveAPI] Connecting with config:', finalConfig);
    await client.connect(finalConfig);
  }, [client, config]);

  const disconnect = useCallback(() => {
    client.disconnect();
  }, [client]);

  return {
    client,
    setConfig,
    config,
    connect,
    disconnect,
    connected,
    volume,
  };
}