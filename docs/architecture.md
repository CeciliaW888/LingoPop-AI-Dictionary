# LingoPop Architecture

## 1. Technical Stack

*   **Framework**: React 19 (Client-side only).
*   **Build Tool**: Vite (implied by structure).
*   **Styling**: Tailwind CSS (Utility-first, responsive design).
*   **AI SDK**: Google GenAI SDK for JavaScript (`@google/genai`).
*   **Persistence**: IndexedDB (via `idb` library).
*   **State Management**: React Context (`ToastContext`) + Local Component State.

## 2. Architectural Decisions

### A. Client-Side Only / Serverless
**Decision**: The app communicates directly from the browser to Google's Gemini API.
**Reasoning**:
*   Reduces latency for the Live API (WebSockets).
*   Simplifies deployment (static hosting).
*   **Trade-off**: API Key must be handled carefully (currently using `process.env.API_KEY`). In production, a proxy server or Firebase App Check would be recommended to secure the key.

### B. Offline-First Storage (IndexedDB)
**Decision**: Use IndexedDB instead of `localStorage` for the Notebook.
**Reasoning**:
*   `localStorage` is synchronous and has a 5MB limit (insufficient for base64 images).
*   IndexedDB allows storing structured JSON data (including cached images) asynchronously.
*   Allows the "Notebook" feature to work entirely offline.

### C. The Live Service (`LiveSession` Class)
**Decision**: Encapsulate WebSockets and AudioContext logic in a service class (`services/liveService.ts`) rather than inside React components.
**Reasoning**:
*   **Separation of Concerns**: React handles UI rendering; the service handles raw binary audio processing.
*   **Audio Pipeline**: The browser's `AudioContext` is complex. We manage `ScriptProcessorNodes` (for input) and `AudioBufferSourceNodes` (for output) manually to handle raw PCM data required by Gemini Live.
*   **Mixing**: We use `MediaStreamAudioDestinationNode` to mix the AI's audio output with the User's camera stream, enabling the "Record Session" feature.

### D. The "Podcast Host" Pattern
**Decision**: Use a secondary, lightweight text-model request alongside the main Live audio session.
**Reasoning**:
*   The Live API handles audio-in/audio-out.
*   To keep the user engaged, we use a separate polling mechanism (`generateFollowUpQuestion`) that reads the transcripts and generates text overlays ("Your host asks...").
*   This creates a multi-modal interface where the AI speaks *and* provides visual cues.

## 3. Directory Structure

```text
/
├── components/       # UI Components (Presentational & Logic)
├── context/          # Global State (Toasts)
├── services/         # External API & Storage logic
│   ├── geminiService.ts  # REST-like calls (Text, Image, TTS)
│   ├── liveService.ts    # WebSocket/Real-time logic
│   └── storageService.ts # IndexedDB wrapper
├── types.ts          # TypeScript definitions
└── docs/             # Documentation
```
