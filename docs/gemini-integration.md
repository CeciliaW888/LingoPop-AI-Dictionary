# Gemini API Integration Strategy

LingoPop leverages specific Gemini models for distinct modalities. This document outlines how each model is utilized.

## 1. Dictionary Lookup (Text & Logic)
*   **Model**: `gemini-3-flash-preview`
*   **Usage**: Generates structured JSON data for dictionary entries.
*   **Key Strategy**:
    *   **JSON Schema Enforcement**: We explicitly define `responseSchema` to ensure the API returns valid JSON containing `targetTerm`, `definition`, `examples`, and `usageNote`. This prevents parsing errors in the frontend.
    *   **System Instructions**: The prompt instructs the model to be "fun, lively, and casual," moving away from dry, academic definitions.

## 2. Visuals (Image Generation)
*   **Model**: `gemini-2.5-flash-image` (Nano Banana series)
*   **Usage**: Generates vector-style illustrations for words.
*   **Prompt Engineering**: "A bright, colorful, minimalist vector art illustration... White background."
*   **Implementation**: The response does *not* return a URL. It returns raw inline Base64 data, which we render directly in an `<img>` tag.

## 3. Pronunciation (Text-to-Speech)
*   **Model**: `gemini-2.5-flash-preview-tts`
*   **Usage**: Converts text examples and terms into audio.
*   **Config**:
    *   Voice: `Puck` (Chosen for its energetic tone).
    *   Safety Settings: Block thresholds are lowered to ensure standard dictionary terms aren't accidentally flagged.
*   **Decoding**: The API returns base64 encoded raw PCM audio. We manually decode this into an `AudioBuffer` using the browser's `AudioContext`.

## 4. Real-time Tutor (Live API)
*   **Model**: `gemini-2.5-flash-native-audio-preview-09-2025`
*   **Protocol**: WebSockets via `ai.live.connect`.
*   **Modalities**:
    *   **Input**: System Audio (Microphone) + Video Frames (JPEG screenshots sent @ 1fps).
    *   **Output**: PCM Audio Stream.
*   **Transcriptions**:
    *   Enabled `inputAudioTranscription` and `outputAudioTranscription` in the config.
    *   This allows us to render subtitles in real-time without using a separate Speech-to-Text service.

### Live API Audio Pipeline
1.  **Input**: Browser `ScriptProcessorNode` captures microphone buffer -> Converts Float32 to Int16 PCM -> Base64 -> Sent to WebSocket.
2.  **Output**: WebSocket receives Base64 PCM -> Decoded to Int16 -> Converted to Float32 -> Scheduled in `AudioContext` for gapless playback.
