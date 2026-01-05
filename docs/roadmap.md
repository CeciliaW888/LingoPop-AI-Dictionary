# LingoPop Project Roadmap

## 1. Project Vision
LingoPop is a client-side, AI-first dictionary and language learning companion. Unlike traditional dictionaries, it uses Generative AI to create context-aware definitions, illustrations, and interactive tutoring sessions on the fly. The goal is to make language learning visual, conversational, and highly personalized.

## 2. Current Status: Alpha (Functional Prototype)

### ✅ What Works (Implemented Features)
*   **AI Dictionary Lookup**:
    *   Translates terms between Native and Target languages.
    *   Generates definitions, cultural usage notes, and example sentences.
    *   **Tech**: Gemini 3 Flash (JSON Schema).
*   **Visual Learning**:
    *   Generates custom vector-art style illustrations for every search term.
    *   **Tech**: Gemini 2.5 Flash Image.
*   **Pronunciation (TTS)**:
    *   High-quality text-to-speech for target words and stories.
    *   **Tech**: Gemini 2.5 Flash TTS.
*   **Offline Notebook**:
    *   Saves words to local IndexedDB.
    *   Optimistic UI updates for saving/removing items.
    *   Works without internet (viewing saved items).
*   **Story Generation**:
    *   Creates short stories using the user's saved vocabulary list.
*   **Live Tutor (Video Mode)**:
    *   Real-time video/audio conversation with AI.
    *   **Podcast Host Mode**: AI actively generates follow-up questions overlayed on screen based on transcript.
    *   **Subtitles**: Real-time transcription of both User and AI.
    *   **Recording**: Users can record their sessions (mixed audio/video) and download MP4s.
    *   **Aspect Ratio Support**: 9:16, 16:9, 1:1, 3:4.

## 3. Immediate Roadmap (Next Steps)
*   **Study Mode Enhancements**:
    *   Implement Spaced Repetition System (SRS) algorithm for flashcards.
    *   Add "Quiz Mode" generating multiple-choice questions from saved words.
*   **Live Tutor Improvements**:
    *   Add "Object Recognition" mode where the AI identifies objects shown in the camera stream explicitly.
    *   Improve audio latency handling.
*   **User Preferences**:
    *   Persist Language selections and UI themes.

## 4. Long-term Goals
*   **User Accounts**: Cloud sync for the Notebook (currently local-only).
*   **Gamification**: Streaks, daily goals, and achievements.
*   **Multi-modal Input**: Allow searching by taking a photo of an object (Lens-style).
