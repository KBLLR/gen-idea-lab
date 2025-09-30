# Voice System Integration

This directory contains the voice interaction system for the GenBooth application, integrating both Web Speech API and Google's Gemini Live API for advanced conversational AI.

## Architecture

```
voice/
├── Core Components
│   ├── genAILiveClient.js    # Gemini Live API client
│   ├── audioRecorder.js      # Microphone audio capture
│   ├── audioStreamer.js      # Audio playback streaming
│   └── enhancedVoiceSystem.js # Personality-aware voice system
├── React Integration
│   └── useLiveAPI.js         # React hook for Live API
├── Audio Processing
│   └── worklets/
│       ├── audioProcessing.js # Audio recording worklet
│       └── volMeter.js        # Volume metering worklet
├── Configuration
│   ├── constants.js          # Voice models and defaults
│   ├── voicePersonalities.js # Personality configurations
│   └── voiceFunctionManager.js # Function calling system
└── Utilities
    ├── utils.js              # Audio context helpers
    └── audioworkletRegistry.js # Worklet management
```

## Quick Start

### Using Gemini Live API in React

```javascript
import { useLiveAPI } from '@/lib/voice';
import { AVAILABLE_VOICES, DEFAULT_VOICE } from '@/lib/voice';

function VoiceChat() {
  const { client, connect, disconnect, connected, volume } = useLiveAPI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const handleConnect = async () => {
    await connect({
      voice: DEFAULT_VOICE,
      // Additional config options
    });
  };

  return (
    <div>
      <button onClick={connected ? disconnect : handleConnect}>
        {connected ? 'Disconnect' : 'Connect'}
      </button>
      <div>Volume: {Math.round(volume * 100)}%</div>
    </div>
  );
}
```

### Using Enhanced Voice System (Web Speech API)

```javascript
import { enhancedVoiceSystem } from '@/lib/voice';

// Start listening
enhancedVoiceSystem.startListening();

// Speak with personality
enhancedVoiceSystem.speak("Hello! How can I help you today?");

// Stop listening
enhancedVoiceSystem.stopListening();
```

## Features

### Gemini Live API Integration

- **Real-time Audio Streaming**: Bidirectional audio communication with Gemini
- **Function Calling**: Integrated tool/function execution
- **Transcription**: Both input and output transcription support
- **Volume Metering**: Real-time audio volume monitoring
- **Event-based Architecture**: EventEmitter for all client events

### Enhanced Voice System

- **Personality-aware Responses**: Context-based voice characteristics
- **Intent Parsing**: Natural language understanding for commands
- **Function Management**: Modular function execution system
- **Multi-language Support**: Extensible language configuration

## Voice Options

The system supports 32 voice presets from Gemini Live API:

- **Zephyr**: Bright, Mid-Hi pitch
- **Puck**: Upbeat, Mid pitch
- **Charon**: Informative, Lower pitch
- **Kore**: Firm, Mid pitch
- **Fenrir**: Excitable, Younger pitch
- ... and 27 more options

See `constants.js` for the complete list.

## API Reference

### GenAILiveClient

```javascript
const client = new GenAILiveClient(apiKey, model);

// Connect to Live API
await client.connect(config);

// Send realtime audio
client.sendRealtimeInput([{ mimeType: 'audio/pcm', data: base64Audio }]);

// Send text/structured content
client.send({ text: 'Hello' });

// Send tool response
client.sendToolResponse({ functionResponses: [...] });

// Disconnect
client.disconnect();
```

### Events

```javascript
client.on('open', () => console.log('Connected'));
client.on('audio', (data) => handleAudioData(data));
client.on('content', (content) => handleContent(content));
client.on('toolcall', (toolCall) => executeTool(toolCall));
client.on('turncomplete', () => console.log('Turn complete'));
client.on('error', (error) => console.error(error));
client.on('close', () => console.log('Disconnected'));
```

### AudioRecorder

```javascript
const recorder = new AudioRecorder(16000); // 16kHz sample rate

// Start recording
await recorder.start();

// Listen to audio data
recorder.on('data', (base64Audio) => {
  client.sendRealtimeInput([{ mimeType: 'audio/pcm', data: base64Audio }]);
});

// Listen to volume
recorder.on('volume', (volume) => {
  console.log('Mic volume:', volume);
});

// Stop recording
recorder.stop();
```

### AudioStreamer

```javascript
const audioContext = await audioContext({ id: 'output' });
const streamer = new AudioStreamer(audioContext);

// Add volume meter worklet
await streamer.addWorklet('volume', VolMeterWorklet, (event) => {
  console.log('Output volume:', event.data.volume);
});

// Add PCM16 audio data
streamer.addPCM16(new Uint8Array(audioData));

// Stop playback
streamer.stop();

// Resume playback
await streamer.resume();
```

## Integration with Existing Components

The voice system integrates with:

1. **VoiceCommand Component** (`src/components/VoiceCommand.jsx`)
   - UI for voice interaction controls
   - Visual feedback for listening state

2. **Store** (`src/lib/store.js`)
   - Voice settings and preferences
   - Active module context

3. **Module System** (`src/lib/modules.js`)
   - Personality selection based on module
   - Context-aware responses

## Environment Setup

Add to your `.env` file:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## Migration from Web Speech API to Gemini Live

To migrate a component from Web Speech API to Gemini Live API:

1. Replace `voiceCommands` import with `useLiveAPI` hook
2. Update event handlers to use Gemini events
3. Configure voice and model settings
4. Add audio recording for input
5. Handle function calling for commands

Example migration:

```javascript
// Before (Web Speech API)
import { voiceCommands } from '@/lib/voiceCommands';
voiceCommands.startListening();

// After (Gemini Live API)
import { useLiveAPI } from '@/lib/voice';
const { client, connect } = useLiveAPI({ apiKey });
await connect({ voice: 'Zephyr' });
```

## Development

### Adding New Voice Personalities

1. Edit `voicePersonalities.js`
2. Add personality configuration with prompts and voice settings
3. Map personality to module contexts

### Adding New Functions

1. Edit `voiceFunctionManager.js`
2. Register function with name, handler, and parameters
3. Update intent parsing in `enhancedVoiceSystem.js`

## Troubleshooting

### Audio not playing
- Check browser autoplay policies
- Ensure user interaction before audio playback
- Verify AudioContext is resumed

### Microphone not working
- Check browser permissions
- Verify HTTPS connection (required for getUserMedia)
- Test with different sample rates

### Gemini API connection issues
- Verify API key is correct
- Check network connectivity
- Review browser console for errors

## License

Apache-2.0 - See LICENSE for details

## Credits

Based on Google's Gemini Live API sandbox template
Adapted for GenBooth Idea Lab by KBLLR