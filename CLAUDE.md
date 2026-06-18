# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A birthday memorial website for streamer "由川伶/Ling" — an interactive, multi-stage animated experience with match-striking, wish-collecting fireflies, candle-blowing via microphone, a horizontal timeline gallery, and a credits/ending screen.

**Tech stack**: Vue 3 (SFC `<script setup>`) + TypeScript + Vite + PixiJS v8 + GSAP 3 + Howler.js + canvas-confetti + TailwindCSS 4

The original design document is at `PLAN.md` — read it for full visual direction, color system, and stage-by-stage UX intent.

### Build tooling notes

- **TailwindCSS 4** uses the Vite plugin (`@tailwindcss/vite`) — there is no `tailwind.config.js`. Classes are used directly in templates; global styles are in `src/style.css` via `@import "tailwindcss"`.
- **TypeScript** uses project references: `tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`. `vue-tsc -b` builds the project references. The app tsconfig targets `ES2020` with `vue-tsc` as the compiler.
- **PixiJS v8** requires WebGL — the site won't render on browsers without GPU/WebGL support. The codebase uses `await app.init()` (async init, v8 API) with `resolution` set to `devicePixelRatio` for retina displays.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Type-check (vue-tsc) + production build
npm run preview   # Preview production build
npx vue-tsc -b    # Type-check only, no build (tsconfig.json uses project references)
```

No test suite is configured. The README.md is Vite template boilerplate — ignore it.

## CDN / asset mode

Set `VITE_USE_CDN` in `.env`:
- `false`: assets load from `public/test-assets/` — used for local development with placeholder images
- `true`: assets load from `https://ling-birthday.oss-cn-chengdu.aliyuncs.com`

Both `.env` and `.env.production` currently have `VITE_USE_CDN=true`. Since there is no local test asset directory, development effectively uses CDN resources.

Always use the `asset(path)` helper from `src/data/config.ts` (or `CRITICAL_ASSETS`) rather than hardcoding asset URLs. The function strips `/assets/` prefix and maps to the correct base path per environment. Note: `bgmAsset()` is functionally identical to `asset()` — they can be unified.

## Architecture

### Layered rendering

```
z-index: 100+   Vue DOM overlays (GreetingCard, mic prompt, debug panel)
z-index: 20     Vue stage components (Ending, Timeline)
z-index: 5-10   PixiJS Canvas (fixed, fullscreen)
z-index: 0      Background
```

- **PixiJS Canvas** is `pointer-events: none` by default; stages enable it (`pointerEvents = 'auto'`) when they need interaction.
- **Vue DOM** handles UI that benefits from CSS (cards, text, buttons, scrollable timeline).
- **GSAP** animates both PixiJS DisplayObjects and DOM elements.

### State machine

`src/composables/useGameState.ts` — a module-level reactive singleton (not a provide/inject). The planned full linear flow was:

```
loading → match → (wishes merged into match) → blow-candle → timeline → ending
```

The **active** `STAGE_ORDER` array only contains `['match', 'ending']` — these are the two stages currently wired in `App.vue`. The initial state is `'match'` (loading is skipped; `reset()` also goes back to `'match'`). `nextStage()` iterates through the `STAGE_ORDER` array; it will not transition to loading, blow-candle, or timeline.

Current active stages in `App.vue`: `match`, `ending`. Blow-candle is fully implemented (`StageBlowCandle.vue` + `CandleScene.ts`) but removed from `STAGE_ORDER`. Timeline is implemented but commented out (`<!-- 暂搁置 -->`). The wishes stage was merged into the match stage — a single `MatchScene` handles both match-striking and firefly collection. Loading is implemented (`StageLoading.vue`) but not wired into App.vue.

Key state fields: `currentStage`, `wishesCollected`, `totalWishes`, `candleLit`, `isBlown`, `micStatus`.

The state is returned as `readonly(state)` — mutations go through action functions only (`collectWish()`, `nextStage()`, `reset()`, etc.). The `GameStage` type in `src/types/index.ts` includes `'loading'`, `'wishes'`, and `'timeline'` even though they aren't in the current `STAGE_ORDER` — the types accommodate future expansion.

**"再来一次" (restart) flow**: `StageEnding.vue`'s restart button animates out with GSAP, then calls `reset()`, which sets `currentStage = 'match'`. Because `App.vue` uses `v-if="state.currentStage === 'match'"` with `:key="match"`, Vue **fully destroys** the old component tree and mounts a fresh one. This triggers new `onMounted` → `await gameApp.init()` → scene creation — a clean restart without manual cleanup. The `reset()` function does NOT call `gameApp.destroy()` or clear any PixiJS state itself; the Vue lifecycle handles it.

### PixiJS scene management

`src/game/GameApp.ts` — singleton wrapper around `pixi.js` `Application`:
- `gameApp.init()` — creates the Application (called once, idempotent)
- `gameApp.setScene(scene)` — swaps the current scene Container; calls `clearScene()` internally
- `gameApp.mount(parentElement)` — appends canvas to DOM
- Scenes must expose `onResize(w, h)` for responsive handling (called automatically via ResizeObserver + window resize)
- Scenes must expose `destroyScene()` that cleans up event listeners, GSAP tweens, and children

Each stage Vue component owns the lifecycle: `onMounted` creates and mounts its scene, `onUnmounted` destroys it.

### Scene ↔ Vue communication

Scenes use callback properties (`onIgnited`, `onParticleCollected`, `onAllCollected`, `onBlown`, `onMicDenied`) that the Vue component assigns after instantiation. Vue components then call `useGameState()` actions (`collectWish()`, `nextStage()`, `setMicStatus()`) to advance the state machine.

### Audio

`src/composables/useAudio.ts` — Howler.js wrapper. BGM uses `html5: true` for streaming. Voice files are loaded lazily per-card, not cached. Video files use native `<video>` elements (not Howler).

**Audio config** (`AUDIO_CONFIG` in `src/data/config.ts`): `bgmVolume` (0.02), `duckBgmVolume` (0.008 — BGM level when voice/video is playing), `sfxVolume` (0.5), `voiceVolume` (0.7), `muted` (global mute flag for debugging).

**BGM autoplay + SFX queuing** (`App.vue` + `useAudio.ts`): browsers block autoplay of audio before user interaction. The system uses a three-event strategy:
1. `pointerdown` → tries `playBGM()` (works on desktop, rejected on mobile)
2. `touchend` → retries (the only reliably-allowed timing on mobile)
3. `click` → fallback
4. SFX calls before BGM is truly playing are queued in `pendingSFX[]`. Once `playBGM()` succeeds, `flushPendingSFX()` replays all queued SFX — ensuring the match-strike sound still plays on mobile where BGM starts later.

**Mute toggle**: a fixed mute button (top-right, `z-[150]`) in `App.vue` toggles `Howler.volume(0)` / `Howler.volume(1)`. The mute icon URLs are hardcoded external links from `webstatic.mihoyo.com` — they are **not** managed via the CDN asset system.

**Microphone (two implementations — know which is which):**
- `src/game/utils/audioAnalyzer.ts` — **active**: standalone (non-Vue) class used by `CandleScene` for mic blow detection. Uses raw `AudioContext` + `requestAnimationFrame` loop.
- `src/composables/useMicrophone.ts` — **unused**: Vue composable wrapping the same logic. Exists as an alternative but no stage currently imports it. If unifying mic logic, prefer this file's approach (it has the `BLOW_CONFIG.micTimeout` fallback pattern).

### Asset loading

`src/composables/useAssetLoader.ts` — Vue composable wrapping PixiJS v8 `Assets.load()` with progress tracking. Exposes `loadAssets(assets[])` for blocking preloads and `loadInBackground(assets[])` for silent background loads (failures are swallowed). Progress is a reactive `ref<number>` (0–100).

### Data contracts

`src/data/blessings.ts`, `src/data/timeline.ts`, and `src/data/audioAssets.ts` hold the content. Modify these to update fan blessings, timeline entries, and audio files without changing component code. Types are in `src/types/index.ts`.

**Audio assets** (`src/data/audioAssets.ts`): Exports `BGM` (background music — main, candle, ending), `SFX` (one-shot sound effects — matchStrike, fireflyCollect, allCollected, candleBlow, cardOpen, cardClose, buttonClick), and convenience aggregates `ALL_BGM` / `ALL_SFX` for batch preloading.

**Blessing fields**: `id` (unique key, e.g. `'wish_001'` — used for dedup in `shownBlessings`), `user` (display name), `text`, `avatarUrl?`, `audioUrl?`, `videoUrl?`. All asset URLs (avatar, audio, video) must use the `asset()` helper from `config.ts` for CDN/local switching. **Heads-up**: `FireflyState.blessingFrom` stores `Blessing.id`, not `Blessing.user` — despite its name, it is an ID that gets resolved via `blessingsData.find(b => b.id === blessingFrom)` in the Vue component.

**GreetingCard** (`src/components/GreetingCard.vue`): handles both audio and video blessings. When a blessing has `videoUrl`, a "播放视频" button appears alongside the audio button. Video opens in a fullscreen overlay with a `<video>` element; closing it restores BGM volume. The card uses responsive scaling based on viewport width (design width 780px as reference), with mobile-specific nudging to keep it visible.

### Key configuration

All tunable constants are in `src/data/config.ts`:
- `MATCH_CONFIG` — matchbox position, match offset, ignition speed/distance thresholds (desktop, ≥768px)
- `MOBILE_MATCH_CONFIG` — same fields, independent values tuned for mobile (<768px)
- `getMatchConfig()` — returns the appropriate config set based on `isMobile()` (window width check)
- `MOBILE_BREAKPOINT` — 768px, the threshold between desktop and mobile configs
- `PARTICLE_CONFIG` — firefly count, sizes, float amplitude, collect target position
- `CARD_CONFIG` — greeting card image dimensions and slice points for the 3-panel border-image layout
- `BLOW_CONFIG` — mic dB threshold, sustain duration, mic timeout for fallback button
- `AUDIO_CONFIG` — BGM/SFX/voice volumes, ducking level, global mute flag

## Current implementation status

| Stage | Status | Notes |
|-------|--------|-------|
| Loading | Implemented but not wired | `StageLoading.vue` + `LoadingScreen.vue` |
| Match + Wishes | **Active** (merged) | `StageMatch.vue` + `MatchScene.ts` — match striking, firefly burst, particle collection, greeting cards |
| Blow Candle | Shelved | `StageBlowCandle.vue` + `CandleScene.ts` — implemented (mic blow detection + manual fallback) but removed from STAGE_ORDER |
| Timeline | Shelved | `StageTimeline.vue` — CSS scroll-snap + GSAP ScrollTrigger horizontal gallery, commented out in App.vue |
| Ending | **Active** | `StageEnding.vue` — credits + confetti burst (`canvas-confetti`) + "再来一次" restart button |

**Before production**, remove from `StageMatch.vue`:
- The `showDebugCard` / `debugBlessing` reactive and the always-visible debug `<GreetingCard>`
- The debug panel (bottom-left overlay with sender/text inputs)

## Orphan / legacy files

These exist in the repo but are **not used** by any active code path:

| File | Reason |
|------|--------|
| `src/game/scenes/WishesScene.ts` | Standalone wishes scene — superseded when wishes merged into `MatchScene` |
| `src/stages/StageWishes.vue` | Vue wrapper for WishesScene — likewise unused |
| `src/game/objects/Candle.ts` | Candle display object with progressive lighting — not used by `CandleScene` (which just uses particle burst) |
| `src/game/utils/ParticlePool.ts` | Object pool for particle reuse — never instantiated; all scenes manage particles ad-hoc |
| `src/composables/useMicrophone.ts` | Duplicate mic logic — `CandleScene` uses `audioAnalyzer.ts` instead |

Do not reference or import these files in new work without confirming intent.

### Type shim

`src/types/howler.d.ts` — hand-written ambient module declaration for Howler.js (the library ships no types). Vue components and composables import directly from `'howler'`; TypeScript resolves types through this shim. Do not remove it unless you replace Howler.js with a typed alternative.

## Patterns to follow

- **Destroy scenes fully**: always call `gsap.killTweensOf(...)` on animated objects, remove DOM event listeners, and call `destroy({ children: true })` on the scene container.
- **Texture fallback**: the `getTex(alias)` pattern (defined identically in each stage Vue component) returns `Texture.WHITE` when `Assets.get()` returns nothing — so PixiJS objects always have a valid texture. This is duplicated across `StageMatch.vue`, `StageBlowCandle.vue`, and `StageWishes.vue`; consider extracting to a shared utility.
- **Responsive backgrounds**: use `Math.max(w / texW, h / texH)` scale with centered anchor (0.5) to cover the screen. This pattern is also duplicated (as inline `cover()`/`reCover()` functions) across scenes.
- **FireParticle**: `blendMode = 'add'` for glow effect, `eventMode = 'static'` for clickability, custom rectangular `hitArea` for larger touch targets.
- **`(p as any)._settled`**: particles only start floating after their settle animation completes; checked before `update()`.
- **GSAP Timeline in Ending**: `StageEnding.vue` creates a GSAP timeline in `onMounted` for entrance animations — it does NOT call `killTweensOf` on unmount since the elements are DOM nodes destroyed with the component. The restart button animates via `gsap.to('.ending-content', …)` and calls `reset()` on complete.
- **Confetti (`canvas-confetti`)**: `StageEnding.vue` creates a temporary `<canvas>` element (`position: fixed; pointer-events: none; z-index: 9999`), fires confetti bursts via `confetti.create(canvas, …)`, then removes the canvas after ~6 seconds. The canvas is created per-mount (not shared/reused) since the component is destroyed on restart.
