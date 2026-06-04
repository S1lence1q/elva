# 🌌 Elva — Premium Fullscreen Immersive Music Experience

Elva is a premium, glassmorphic fullscreen music player built with a tactile, Scandinavian retro-paper aesthetic. It features an endless fluid scroll canvas, WebGL background morphing, high-performance audio crossfading, interactive synchronized lyrics, and a playful Aim & Shoot volume charging game.

---

## ✨ Core Features & Design Highlights

### 🎨 Premium Scandinavian Aesthetics
* **Glassmorphic Minimalism:** Sleek, borderless controls with subtle gradients, natural light refraction, and premium typography.
* **Mercury-Silver Theme Morphing:** The background shifts dynamically between polished mercury-silver, muted slate, and warm ashes as you scroll through Search, Charts, and My Hub.
* **Bioluminescent Cover Tinting:** Image color extraction automatically limits saturation (clamped to a mild 8% - 22% range) to keep the WebGL canvas elegant, while adding a warm luminance floor for extremely dark covers.
* **Double-Image Artwork Crossfader:** Eliminates black blinks during track changes by rendering a fading background node behind the incoming front cover.

### 🔊 High-Fidelity Audio Engineering
* **Dual-Engine (A/B) Orchestrator:** Parallel engines pre-load incoming audio streams (both HTML5 and YouTube audio tracks) for seamless transitions.
* **Constant-Power Crossfade:** A mathematical equal-power transition curve ($\sin/\cos$) prevents volume dips during track handovers (adjustable from 0s to 12s).
* **Buffer Synchronization:** Overlaps start only after the upcoming engine resolves its `playPromise`, preventing silence gaps.
* **Volume Persistence:** Automatically preserves player volume and mute state in `localStorage` across page updates.

### 🎮 Hidden Aim & Shoot Volume Game
* **Hold-to-Aim Charging:** Hold down the volume icon to initiate a 60fps charging meter that ping-pongs between 0% and 100% over 2.4s. The speaker icon rotates visually up to $-35^\circ$ to aim.
* **Parabolic Physics Projectile:** Releasing the pointer launches a glowing, theme-colored white projectile in a calculated physics arc. It lands directly on the volume track to set your level.
* **Spacebar Lock:** Native focus rings are removed, and spacebar default behavior is intercepted on controls, preventing accidental activations during key playback controls.

### 🎤 Apple Music-Style "Floating Lyrics"
* **Interactive Lyric Scrubbing:** Floating, translucent lyrics slide in from the side as the cover shifts. Clicking on any line immediately updates the song's playhead position (absolute scrubbing).
* **Flimmer-Free Transitions:** Hover states and 3D tilts on the artwork card are fully decoupled and paused during the sliding transition to avoid stuck pointer highlights.

---

## 🛠️ Architecture & Modularity

Elva's codebase is designed with modular React hooks and focused presentational components to maintain scalability and prevent regression bugs.

```
src/app/
├── components/          # React Presentation Layers
│   ├── musicplayer/     # ArtworkCard, BottomBarControls
│   ├── queue/           # Absolute layers, QueuePanel, QueueSearchBar
│   └── profilehub/      # ProfileCustomizerModal, ProfileHubView
├── hooks/               # Decoupled Feature State Hooks
│   ├── usePlaybackCore  # Dual Engine lifecycle & Crossfader
│   ├── useFadeVolume    # Trigonometric volume curves
│   ├── useLyrics        # LRC parsing & interactive seeker
│   └── useScrollTracking# WebGL scroll velocity listener
└── utils/               # Helper Methods
    ├── playerColorUtils # Downsampled color extraction & grayscales
    ├── lyricsUtils      # LRC parsers
    └── api/             # Search ranking and prefetch concurrent queues
```

---

## 🚀 Running the Project

### Prerequisites
* **NodeJS** (v18+ recommended)
* **npm** or **pnpm**

### Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### Start Development Server
Run Vite's rapid dev server:
```bash
npm run dev
```

### Production Build
Create an optimized production bundle:
```bash
npm run build
```

---

## 🌐 Deployment
Pushes to the `main` branch trigger a GitHub Actions pipeline (`deploy.yml`) which automatically compiles the codebase and deploys the bundle to GitHub Pages.