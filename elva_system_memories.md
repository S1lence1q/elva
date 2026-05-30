# Elva - Master System Memories, Architecture & Design Directives

Dette dokument er den urokkelige kilde til sandhed (Source of Truth) for Elvas kildekode, arkitektur og retningslinjer. 
**LÆS DETTE FØRST**, hvis du genoptager arbejdet efter en context-compaction eller i en ny session for at undgå at bryde eksisterende logik.

---

## 🛑 STRATEGISKE WORKSPACE-REGLER & FILOSOFI
*(Disse regler skal overholdes uanset hvad – ingen undtagelser!)*

### Rule 1: 🇬🇧 100% English Language Directive
* **Krav:** Hele applikationens brugerflade skal være **100% på engelsk**. 
* **Handling:** Eventuelle eksisterende danske ord (f.eks. *"Historik"*, *"Artister"*, *"Kunne ikke afspille sang"*, *"Søg efter kunstner eller sang"*, *"Nyligt afspillet"*) skal oversættes til engelsk for at opretholde en international, strømlinet og eksklusiv lytter-oplevelse.

### Rule 2: 🧱 Modulopbygget Kode (Mange små filer!)
* **Krav:** **Filer SKAL holdes små, fokuserede og opdelte!** Vi ønsker absolut ingen kæmpe filer på 2.000 linjer. 
* **Handling:** Hvis du tilføjer en ny komponent, utility-funktion eller logik-blok, må du **aldrig** bare smække den ind i `App.tsx` eller `MusicPlayer.tsx`. Opret en ny, selvstændig og isoleret fil i `src/app/components/` eller `src/app/utils/` og importér den.

### Rule 3: 💎 Quality-First Designfilosofi ("Gør det ordentligt!")
* **Krav:** **Vi laver tingene ordentligt, før vi tilføjer noget nyt.** Vi tilføjer aldrig funktioner, medmindre de giver 100% mening, tilføjer reel værdi og passer perfekt ind i den taktile, glassmorphic Scandinavian retro-papir æstetik.
* **Handling:** Ingen ufærdige knapper, ingen grimme standard-inputfelter og ingen "code-slop" (broken/dead code). Hvis noget ikke virker perfekt (f.eks. hvis en audio-fader hakker), skal det fikses eller fjernes – det må aldrig ligge og flyde.

---

## 🧭 Globale Designregler
1. **Pinterest & Skandinavisk Luksus-Estetik:** Ingen støjende hjælpetekster, ingen kunstige skrigende neonfarver eller stive grænser. Alt is glassmorphic, taktilt, luftigt og roligt.
2. **WebGL-Dominans:** Kun én enkelt, global `<FluidBackground />` kører i roden af appen. Ingen duplikerede baggrunde inde i afspilleren (for at maksimere GPU-ydeevne).
3. **Zero-Reflow GPU Animationer:** Alle spiller-animationer (såsom lyric-paneler og kø-skift) kører via absolute hardware-accelererede GPU translations (`x`-værdier) frem for CSS margin/width-layout-reflows.

---

## 🧩 EKSISTERENDE SYSTEMER & FUNKTIONER
*(Søg i disse filer, før du implementerer noget nyt, da disse systemer allerede er 100% aktive!)*

### 1. 🌌 Endless Fluid Canvas (Single-Scroll Layout)
* **Filer:** [App.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/App.tsx)
* **Hvordan det virker:** 
  * Appen er opdelt i 3 sektioner: **Search/Home** ➔ **Discover Charts** ➔ **My Hub**, som scroller lodret via CSS snap-scrolling (`snap-y snap-mandatory scroll-smooth`).
  * En LERP-baseret scroll-progress-tracker i `App.tsx` interpolerer baggrundsfarverne flydende i realtid.
  * **Scroll-Velocity Turbulence:** Scroll-begivenheder accelererer WebGL-væskens bevægelse blødt op. En dæmpningsmotor (`requestAnimationFrame`) dæmper farten med en viscositets-multiplikator (`0.92` pr. frame) for at forhindre hakkende hastighedsudslag.

### 🎨 2. Poleret Kviksølv-Sølv & Slate-Scroll-morfning (Scroll-farver)
* **Filer:** [App.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/App.tsx) (`getWebGLBackgroundColors`), [playerColorUtils.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/utils/playerColorUtils.ts)
* **Hvordan det virker:** 
  * Applikationen bruger en ultra-premium, uforstyrrende og yderst sofistikeret mørk sølv- og slate-baseret marmorering som primært tema. For at undgå forstyrrende farvehop skifter farverne MILDT under scrolling gennem tre analoge og harmoniske nuancer:
    * **Search & Home (Top):** Poleret Kviksølv-Sølv & Dyb Obsidian Slate (`#111216`, `#323640`, `#040507`). Det er den smukke, urokkelige sølv-hovedbaggrund.
    * **Discover Charts (Midte):** Muted Stål-Blå & Grafit-Grå Glow (`#141720`, `#2c3547`, `#07090d`).
    * **My Hub Profile (Bund):** Varm Sølv-Aske & Muted Platin-Sand Glow (`#161513`, `#35322e`, `#060504`).
  * **Dynamic Muted Extraction:** Song-farveekstraktion i `playerColorUtils.ts` dæmper automatisk farvemætningen til maksimalt 22% (spænd: 8% - 22%) for at holde alle sangbaggrunde (inkl. Kundos grønne covers) ekstremt milde og slate-lignende, så det harmonerer fejlfrit med sølv-æstetikken.

### ⚡ 3. Synkroniseret Pre-Extraction & CORS-Proxy (Zero-Delay Overgange)
* **Filer:** [App.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/App.tsx) (`handleSelectSong`), [playerColorUtils.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/utils/playerColorUtils.ts)
* **Hvordan det virker:**
  * Når en sang klikkes, indlæses billedet med `crossOrigin = 'anonymous'` igennem `images.weserv.nl` proxyen, hvilket forhindrer "tainted canvas" browser-sikkerhedsfejl.
  * Farverne ekstraheres **mens loaderen vises** i `'processing'` state.
  * `songColors` sendes som en færdig prop to `<MusicPlayer />` ([MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx)), som med det samme initialiserer sine CSS-variabler (`dominantColors` / `targetColors`). Det forhindrer fuldstændigt det grimme "dobbelt farveskift" eller flimmer under load!

### ❄️ 4. Skandinavisk Charcoal & Silver-Mist (Ren Grayscale)
* **Filer:** [playerColorUtils.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/utils/playerColorUtils.ts)
* **Hvordan det virker:**
  * Hvis et cover har under `5%` mætning (som moody pressebilleder i sort-hvid), gennemtvinges en ren **0% mættet grafit-gradient**:
    * Primary: Charcoal Gray (`l: 0.22`)
    * Secondary: Obsidian Black (`l: 0.14`)
    * Accent: Silver-Mist (`l: 0.28`)
  * Det danner en utrolig smuk, lysende metal-marmorering i stedet for en kulsort tom baggrund.

### 🪐 5. Bioluminescent Floor (Farve-Glow-Bund)
* **Filer:** [playerColorUtils.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/utils/playerColorUtils.ts)
* **Hvordan det virker:**
  * Meget mørke covers (som Annikas "Livsforladt") trues af at efterlade baggrunden helt sort. Vi gennemtvinger en bund på **`38% mætning`** (`s`) og **`25% lysstyrke`** (`l`) for farvet artwork. Det trækker de dybe glødepigmenter frem, så baggrundsforløbet altid morfer i en smuk, rolig ambient sky.

### 🖥️ 6. Apple Music-style "Floating Lyrics" & **Interactive Lyric Scrubbing**
* **Filer:** [MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx), [LyricsPanel.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/LyricsPanel.tsx)
* **Hvordan det virker:**
  * På store skærme (`isLargeScreen`) klappes eller vendes albumcoveret ikke. I stedet glider en boxless, gennemsigtig tekstbjælke ind fra højre, mens albumcoveret glider til venstre (`x: -284px` via GPU). 
  * **Interactive Lyric Scrubbing (Aktiv):** Sangteksterne er fuldt klikbare! Når en bruger klikker på en specifik tekstlinje i `LyricsPanel.tsx`, kaldes `seekToAbsoluteTime` som spoler sangens playhead direkte til det pågældende sekund.

### 🎚️ 7. Volume Fader & Audio Transition Hook (`fadeVolume`)
* **Filer:** [MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx) (linje 293-332, `fadeVolume` funktion)
* **Hvordan det virker:**
  - En volume fader-motor (`fadeVolume(target, duration)`) bruger `requestAnimationFrame` til at interpolere afspillerens lydstyrke blødt fra `0` til `1` (og omvendt) over 300ms-400ms.
  - **Fader Safeguard:** Hvis en ny fade starter, afvikles (resolves) den foregående faders Promise øjeblikkeligt via `fadeResolveRef` for at forhindre hængende asynkrone tråde.
  - **State Decoupling:** En `isFadingOutRef` sikrer, at afspillerens `useEffect` state-synkronisering ikke pauses før faderen har nået `0` volumen. Alle play/pause-veje (inklusive tastaturgenveje og macOS MediaSession/AirPods) er dirigeret gennem `togglePlayPause()` for at drage fordel af fades.
  - **Gapless Transitions:** Forsinkelsen springes over ved automatisk sangskift eller pausede tracks for at undgå akavede tavse pauser.

### 🔍 8. Metadata Weighted Search Ranker
* **Filer:** [apiUtils.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/utils/apiUtils.ts) (`rankAndSortSearchResults`)
* **Hvordan det virker:**
  - Modvirker uofficiel YouTube-støj (fan-made, live-klip, 10-timers loops).
  - Søgeresultater scores: **Topic kanaler (+150 pts)**, **VEVO (+100 pts)**. 
  - **Aggressive strafpoint:** Bootlegs, live-optagelser, cover-versioner og specielt lyric-videoer straffes hårdt med op til **-250 pts** til **-500 pts**. 
  - **Kanal-filtrering:** Hvis kanalen/uploaderen indeholder ord som "lyrics", "cover", "remix" osv., trækkes der op til **-500 pts** fra resultatet, hvilket udelukker uofficielle uploadere fuldstændigt.

### 🖱️ 9. Klikbart Artist-navn med Smart Fallback
* **Filer:** [PlayerControls.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/PlayerControls.tsx), [App.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/App.tsx)
* **Hvordan det virker:**
  - Klik på kunstnernavnet under titlen navigerer direkte to Artist Hub.
  - Hvis sangen blev indlæst direkte (uden `channelId`), viser Hubben en glas-skabelon (`skeleton loader`), mens en asynkron baggrundssøgning opsøger kunstnerens officielle Topic-kanal for at hente diskografi og MusicBrainz-data.

### 💾 10. LandingRecents (History & Artists Switcher)
* **Filer:** [LandingRecents.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/LandingRecents.tsx)
* **Hvordan det virker:**
  - Kombinerer afspilningshistorik og nyligt besøgte kunstnere i én enkelt række med en glidende glas-pille.
  - Kortene er forstørret med **25%** for maksimal læsbarhed (sange: `170px` brede kort, artister: `w-24 / 96px` store perfekte cirkulære avatarer).

### 🗂️ 11. "Active Session" Tab-less Sidebar (Endless Playback Control)
* **Filer:** [Queue.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/Queue.tsx)
* **Hvordan det virker:**
  - Fjerner overflødige faneblade fuldstændigt for at eliminere kognitiv overbelastning. Siden er opdelt i en dynamisk, enkelt lodret strøm.
  - **Søgning i toppen:** Et permanent, slankt glassmorphic søgefelt lader dig søge direkte på YouTube. Når der tastes, erstattes kø-visningen øjeblikkeligt af søgeresultaterne.
  - **Up Next (Musikkøen):** Viser kommende numre med store, taktile vinyl-sleeves/bannere. Covers er forstørret til **64px (`w-16 h-16`)** med bløde `rounded-xl` hjørner og tydelig, stor typografi for uovertruffen læsbarhed.
  - **Quick-Add Favorites (Likes):** En vandret rullende LP-række placeret lige under Up Next musikkøen. Viser dine mest likede sange som store visuelle kort (`w-28`). Overskriften indeholder en collapse-knap (Chevron), så hele rækken kan foldes helt sammen for at rydde skærmen.
  - **Carousel End-Gate lyttehistorik toggle:** For enden af favoritter-rækken er placeret en rammeløs, transparent knap med et `History`-ikon og en diskret tekst. Ved klik glider historik-rækken (Recently Played) blødt frem nedenunder via en Framer Motion transition. Den gennemsigtige og rammeløse æstetik forhindrer, at elementet klippes grimt i kanten af panelets højre fade-maske.
  - **Apple-style Carousel Mask-Fade:** Alle vandret rullende carouseller (Likes, History og Favorite Artists) bruger en CSS `mask-image` linear-gradient, der toner elementerne blødt ud mod højre kant (fra 85% dækning til 100% gennemsigtighed). For at forhindre, at de sidste elementer (såsom "View History"-teksten, det sidste cover eller kunstnernavnet) bliver tonet ud eller cuttet af ved maksimal scrolling, er der tilføjet en ikke-komprimerbar trailing spacer (`w-[15px] shrink-0 h-1`) i slutningen af hver række. Dette danner en flydende, luksuriøs overgang til panelets obsidian-baggrund, mens alt indhold kan rulles helt ind i det 100% ubeskårne, tydelige område.
  - **Understated Library Shortcut Pill (Browse Full Library):** En minimalistisk, rolig glassmorphic-pille placeret centreret direkte under dine Quick-Add favoritter. Det sikrer, at adgangen til det fulde bibliotek altid er synlig uden scroll.

### 🏛️ 12. Profile Hub (My Hub) Widescreen & Widescreen Tabbed Redesign
* **Filer:** [ProfileHubView.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/ProfileHubView.tsx)
* **Hvordan det virker:**
  - Overhaler den tidligere cramped to-kolonners visning til en luftig, luksuriøs widescreen-oplevelse:
  - **Tab-nested Profile Header:** Profil-headeren (avatar, navn og stats-søjler) lever KUN i `Overview`-dashboardet. Når der skiftes faneblad til `Favorites` eller `Playlists`, fader headeren helt væk, og indholdet glider helt op til toppen, introduceret af en stor Kaobe-serif overskrift.
  - **Profile Customizer Modal:** Alle redigeringsmuligheder (navn-input og gradient Preset farver) er lagt i en svævende glassmorphic popup-modal, hvilket renser selve profil-headeren fuldstændigt for tom plads.
  - **Overview "Vinyl Flip" Sange (Nyligt Afspillet):** Sange på dashboardet rulle vandret som store, kvadratiske LP-covers på **144px (`w-36 h-36`)** med bløde `rounded-2xl` hjørner og hover play overlays.
  - **Library Sange (Favorites & Playlists):** I disse faneblade vises sange i store, brede glas-bjælker med gigantiske covers på **64px (`w-16 h-16`)** og stepped-up skrifttyper (`text-base` for sangnavne, `text-sm text-white/50` for kunstnere).

### 🎚️ 13. HIFI Volumen-Transitions & Decoupling
* **Filer:** [MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx), [PlayerControls.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/PlayerControls.tsx)
* **Hvordan det virker:**
  - Garanterer blød, 100% hørbar volumen-transitions uden race-conditions eller klikstøj:
    - **PLAYING-Bound Fade-In:** Volumenfaderen for YouTube tracks forsinkes til videoens `PLAYING` callback for at modvirke buffering-forsinkelser.
    - **Lock Ref Decoupling:** En `isTogglingPlayPauseRef` forhindrer sync effects i at duplikere fader loops under manuelle klik.
    - **Linear-Logaritmisk dæmpning:** Pauser fader ud langs en blød `progress * progress` ease-in dæmpningskurve.
    - **Knap-sanering:** Fjernede `onPointerDown` klik-duplikation fra Play/Pause-knappen for 100% præcision.
    - **Volumen-persistens (localStorage):** Spilleren indlæser og gemmer automatisk din valgte lydstyrke (`elva_player_volume`) og pre-mute lydstyrke (`elva_player_premute_volume`) i `localStorage`. Dette sikrer, at lydstyrken altid huskes på tværs af sangskift, når spilleren unmountes, og ved browser-genindlæsning.

---

## 📁 14. Modulopbygget Kodebase
Vi har trukket utilities og logik ud af `MusicPlayer.tsx` for at holde koden let-vedligeholdelig. Vigtige hjælpefiler under `src/app/utils/`:
1. `playerColorUtils.ts` (HSL/RGB konvertering, downsampled 32x32 scanning og fallbacks).
2. `lyricsUtils.ts` (LRC parsing og dynamiske fallback lyrics).
3. `stringUtils.ts` (Song title sanitizing).
