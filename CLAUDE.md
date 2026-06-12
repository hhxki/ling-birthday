# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A birthday memorial website for streamer "由川伶/Ling" — an interactive, multi-stage animated experience with match-striking, wish-collecting fireflies, candle-blowing via microphone, a horizontal timeline gallery, and a credits/ending screen.

**Tech stack**: Vue 3 (SFC `<script setup>`) + TypeScript + Vite + PixiJS v8 + GSAP 3 + Howler.js + TailwindCSS 4

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Type-check (vue-tsc) + production build
npm run preview   # Preview production build
```

No test suite is configured.

## CDN / asset mode

Set `VITE_USE_CDN` in `.env` (or `.env.production`):
- `false` (default): assets load from `public/test-assets/` — used for local development with placeholder images
- `true`: assets load from `https://cdn.example.com/ling-birthday`

The helper `asset(path)` in `src/data/config.ts` handles path resolution. Always use it (or `CRITICAL_ASSETS`) rather than hardcoding asset URLs.

## Architecture

### Layered rendering

```
z-index: 100+   Vue DOM overlays (GreetingCard, mic prompt, debug panel)
z-index: 20     Vue stage components (Ending, Timeline)
z-index: 5-10   PixiJS Canvas (fixed, fullscreen)
z-index: 0      Background
```

- **PixiJS Canvas** is pointer-events:none by default; stages enable it (`pointerEvents = 'auto'`) when they need interaction.
- **Vue DOM** handles UI that benefits from CSS (cards, text, buttons, scrollable timeline).
- **GSAP** animates both PixiJS DisplayObjects and DOM elements.

### State machine

`src/composables/useGameState.ts` — a singleton reactive state machine. Stages proceed linearly:

```
loading → match → (wishes merged into match) → blow-candle → timeline → ending
```

Current active stages in `App.vue`: `match`, `blow-candle`, `ending`. Timeline is implemented but commented out (`<!-- 暂搁置 -->`). The wishes stage was merged into the match stage (single `MatchScene` handles both match-striking and firefly collection).

Key state fields: `currentStage`, `wishesCollected`, `totalWishes`, `candleLit`, `isBlown`, `micStatus`.

### PixiJS scene management

`src/game/GameApp.ts` — singleton wrapper around `pixi.js` `Application`:
- `gameApp.init()` — creates the Application (called once, idempotent)
- `gameApp.setScene(scene)` — swaps the current scene Container; calls `clearScene()` internally
- `gameApp.mount(parentElement)` — appends canvas to DOM
- Scenes should expose `onResize(w, h)` for responsive handling (called automatically)
- Scenes should expose `destroyScene()` that cleans up event listeners, GSAP tweens, and children

Each stage Vue component (`StageX.vue`) owns the lifecycle: `onMounted` creates and mounts its scene, `onUnmounted` destroys it.

### Scene ↔ Vue communication

Scenes use callback properties (`onIgnited`, `onParticleCollected`, `onAllCollected`, `onBlown`, `onMicDenied`) that the Vue component assigns after instantiation. Vue components then call `useGameState()` actions (`collectWish()`, `nextStage()`, `setMicStatus()`) to advance the state machine.

### Audio

`src/composables/useAudio.ts` — Howler.js wrapper. BGM uses `html5: true` for streaming. Voice files are loaded lazily per-card, not cached. `src/game/utils/audioAnalyzer.ts` — standalone (non-Vue) Web Audio API analyzer used by `CandleScene` for mic blow detection.

### Data contracts

`src/data/blessings.ts` and `src/data/timeline.ts` hold the content. Modify these to update fan blessings and timeline entries without changing component code. Types are in `src/types/index.ts`.

### Key configuration

All tunable constants are in `src/data/config.ts`:
- `MATCH_CONFIG` — matchbox position, match offset, ignition speed/distance thresholds
- `PARTICLE_CONFIG` — firefly count, sizes, float amplitude, collect target position
- `CARD_CONFIG` — greeting card image dimensions and slice points for the 3-panel border-image layout
- `BLOW_CONFIG` — mic dB threshold, sustain duration, mic timeout for fallback button

## Current implementation status

| Stage | Status | Notes |
|-------|--------|-------|
| Loading | Implemented but not wired in App.vue | `StageLoading.vue` + `LoadingScreen.vue` |
| Match + Wishes | **Active** (merged) | `StageMatch.vue` + `MatchScene.ts` — match striking, firefly burst, particle collection, greeting cards |
| Blow Candle | **Active** | `StageBlowCandle.vue` + `CandleScene.ts` — mic blow detection + manual fallback button |
| Timeline | Shelved | `StageTimeline.vue` — CSS scroll-snap horizontal gallery, commented out in App.vue |
| Ending | **Active** | `StageEnding.vue` — credits + "再来一次" restart button |

The match stage includes a **debug panel** and **debug card** (always visible on the match screen) for tuning the greeting card layout. These should be removed before production.

## Patterns to follow

- **Destroy scenes fully**: always call `gsap.killTweensOf(...)` on animated objects, remove DOM event listeners, and call `destroy({ children: true })` on the scene container.
- **Texture fallback**: use `Texture.WHITE` as fallback when `Assets.get()` returns nothing — pattern visible in `MatchScene` and `CandleScene`.
- **Responsive backgrounds**: use `Math.max(w / texW, h / texH)` scale with centered anchor (0.5) to cover the screen.
- **FireParticle**: `blendMode = 'add'` for glow effect, `eventMode = 'static'` for clickability, custom `hitArea` for larger touch targets.
- **`(p as any)._settled`**: particles only start floating after their settle animation completes; checked before `update()`.
