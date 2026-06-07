# Elva - Master System Memories, Architecture & Design Directives

Dette dokument er den urokkelige kilde til sandhed (Source of Truth) for Elvas kildekode, arkitektur og retningslinjer. 
**LÆS DETTE FØRST**, hvis du genoptager arbejdet efter en context-compaction eller i en ny session for at undgå at bryde eksisterende logik.

---

## 🛑 STRATEGISKE WORKSPACE-REGLER & FILOSOFI
*(Disse regler skal overholdes uanset hvad – ingen undtagelser!)*

### Rule 1: 🌐 Sprog (UI)
* **Standard:** UI-copy er primært **engelsk** (international baseline).
* **Dansk:** Brugeren ønsker **dansk + engelsk senere** (i18n) — undgå at *tilføje nye* hardcodede danske strenge i kode medmindre det er bevidst copy; eksisterende dansk i UI er OK.
* **Agenter:** Tilføj ikke danske tekster “automatisk” på nye features — hold nye strings engelske indtil et rigtigt sprog-lag findes.

### Rule 2: 🧱 Modulopbygget Kode — Ét ansvar, ikke et linjetal

**Krav:** Undgå monolitter. Opdel kode når det giver **klarere ansvar**, **lavere risiko** eller **genbrug** — ikke for at jage et magisk linjetal.

**Hvorfor (kort):**
- **Mennesker:** Store filer med mange ansvarsområder (fx 1000+ linjers `App.tsx`) er svære at navigere og giver flere regressioner.
- **AI-agenter:** Kompakte, fokuserede moduler er nemmere at rette præcist; monolitter øger hallucinationer og sideeffekter.
- **Runtime:** Små moduler kan hjælpe HMR og code-splitting, men det er **sekundært** — primært mål er forståelighed.

**Pragmatiske retningslinjer (soft limits — ikke hårde regler):**

| Type | Typisk OK | Overvej split når |
|------|-----------|-------------------|
| Præsentationskomponenter | ~200–350 linjer | Filen blander UI + tung logik, eller du rører den konstant med frygt |
| Hooks (kompleks state) | ~250–400 linjer | Én hook styrer flere uafhængige flows (fx crossfade + engines + progress) |
| Utilities | ~50–150 linjer | Filen blander urelaterede domæner (fx søg + kanal + ranking i én fil) |
| Nye filer | Ét ansvar du kan forklare på **én sætning** | — |

**Split når mindst én er sand:**
1. Forskellige ansvarsområder (fx HTTP-klient vs. søg-ranking vs. kanal-uploads).
2. Genbrug på tværs af features.
3. Testbar ren logik (utils uden DOM).
4. Filen er et vedligeholdelses-flaskehals (ofte ændret + høj regressionsrisiko).

**Split IKKE når:**
- Du kun får flere imports/props-drilling uden klarere mental model.
- To moduler **altid** ændres sammen (behold dem sammen).
- Du splitter midt i én sammenhængende state-machine (fx crossfade) uden klar grænse.
- Målet er linjetal, ikke læsbarhed.

**Handling ved ny funktionalitet:** Tilføj ikke blindt til en eksisterende stor fil. Opret et nyt modul med klart navn og interface. Brug barrel-exports (`apiUtils.ts` re-exports) hvis det reducerer import-støj under migration.

**Målrettet refactor-prioritet i Elva (kun hvor smerten er):**
1. **`src/app/utils/api/`** — opdelt fra `apiUtils.ts` (HTTP, søg, kanal, ranking, metadata).
2. **`App.tsx`** — global Volume HUD + landing Mini-Player ud i egne komponenter/hooks; orchestration bliver i `App.tsx`.
3. **`usePlaybackCore.ts`** — kun når crossfade/engines røres ofte; split engines vs. crossfade vs. progress-sync i samme mappe.
4. **Lad være** med at opdele filer der virker stabile (`MusicPlayer.tsx`, `ArtworkCard.tsx`, …) medmindre de aktivt debuggeres.

**Allerede gennemført:**
- Queue under `src/app/components/queue/` (inkl. `QueuePanelLayer`, `QueueSearchResults`, `queueArtistUtils`).
- Profile Hub + MusicPlayer UI-moduler + `components/app/` (GlobalVolumeHUD, LandingMiniPlayerPill).
- `src/app/utils/api/` barrel + chart utilities (`chartFeeds`, `chartPlaybackUtils`, `chartPrefetch`).
- React Error Boundary på rod-niveau.

### Rule 3: 💎 Quality-First Designfilosofi ("Gør det ordentligt!")
* **Krav:** **Vi laver tingene ordentligt, før vi tilføjer noget nyt.** Vi tilføjer aldrig funktioner, medmindre de giver 100% mening, tilføjer reel værdi og passer perfekt ind i den taktile, glassmorphic Scandinavian retro-papir æstetik.
* **Handling:** Ingen ufærdige knapper, ingen grimme standard-inputfelter og ingen "code-slop" (broken/dead code). Hvis noget ikke virker perfekt (f.eks. hvis en audio-fader hakker), skal det fikses eller fjernes – det må aldrig ligge og flyde.

---

## 🧭 Globale Designregler
1. **Pinterest & Skandinavisk Luksus-Estetik:** Ingen støjende hjælpetekster, ingen kunstige skrigende neonfarver eller stive grænser. Alt is glassmorphic, taktilt, luftigt og roligt.
2. **WebGL-Dominans:** Kun én enkelt, global `<FluidBackground />` kører i roden af appen. Ingen duplikerede baggrunde inde i afspilleren (for at maksimere GPU-ydeevne).
3. **Zero-Reflow GPU Animationer:** Alle spiller-animationer (såsom lyric-paneler og kø-skift) kører via absolute hardware-accelererede GPU translations (`x`-værdier) frem for CSS margin/width-layout-reflows.
4. **Forebyggelse af Skygge-Beskæring (Shadow Clipping):** I browsere tvinger `overflow-y: auto` (eller `scroll`) automatisk `overflow-x: hidden`, hvilket klipper vandrette skygger på elementer tæt på kanten. For at undgå hårde lodrette beskæringskanter, skal der tilføjes side-padding på scroll-containeren (fx `px-10` eller `px-12`) eller bruges et ydre negative-margin offset (`-mx-12` på ydre, `pl-12 pr-[88px]` på indre).
5. **Tailwind Layout Strækning:** Kombiner **ALDRIG** `w-full` med negative marginer (`-mx-...`) for at strække en boks ud over sin forælders padding. `w-full` låser bredden, så boksen blot rykkes til venstre og bliver for kort i højre side. Fjern `w-full` og lad boksen strække sig naturligt via standard `width: auto` block-adfærd.

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

### 🎚️ 7. A/B Dual-Engine Crossfade, Buffering Sync & Double-Trigger Guards
* **Filer:** [usePlaybackCore.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/hooks/usePlaybackCore.ts), [useFadeVolume.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/hooks/useFadeVolume.ts), [MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx)
* **Hvordan det virker:**
  - **A/B Dual-Engine Orchestrator:** Afspilningen administreres af to uafhængige afspiller-sæt (Engine A og Engine B) for både lokale filer (`audioRefA`/`B`) og YouTube streams (`ytPlayerRefA`/`B`). Dette muliggør parallel indlæsning og afspilning.
  - **Constant-Power Equal-Power Fade:** Lydstyrken reguleres af en trigonometrisk (sinus/cosinus) konstant-energi-kurve ($\text{In} = \sin(\text{progress} \cdot \pi/2)$ og $\text{Out} = 1 - \cos(\text{progress} \cdot \pi/2)$). Dette forhindrer det perceivede "volumen-dyk" ved midpoint (50%) under overgange.
  - **Customizable Transition Timing:** Triggermærket og fade-varigheden indlæses dynamisk fra `localStorage` under nøglen `elva_crossfade_duration`. Brugeren kan indstille denne flydende fra **0s til 12s** via en premium-slider under Control Center (**Audio Preferences**). Hvis indstillet til 0s, slås crossfaden helt fra og sangene skifter øjeblikkeligt ved track-end.
  - **Buffering Synchronization (`playPromise`):** Før crossfade-lydovergangen reelt begynder, afventer motoren et `playPromise`, der resolves når den inaktive afspiller skifter til `PLAYING`/`playing` tilstand (enten via HTML5 audio begivenheder eller YouTube player state callback-opsnapning). Dette eliminerer helt tavse huller under buffering, uanset internethastighed.
  - **Double-Trigger Prevention (`isCrossfadingRef.current`):** Under en aktiv crossfade er track-ended events på den afspillende engine blokeret af et `isCrossfadingRef`-guard, så applikationen ikke forsøger at køre en almindelig skip (`handleNextSong()`) midt i fadet.
  - **Progress & Tekst-Synkronisering under Crossfade:** Så snart en crossfade startes, nulstilles `currentTime` og `duration` med det samme til 0 for at matche skiftet i album art og metadata. Tidsmåler-timeren begynder derefter med det samme at læse status fra den *kommende* afspiller (Engine B/A), så seek-baren og sangteksterne (lyrics) synkroniseres flydende fra startsekunderne af den nye sang (f.eks. 0:00 ➔ 0:03) uden visuelle hop (f.eks. fra den gamle sangs 2:15 direkte til den nyes 0:05).
  - **Fader Safeguard:** Hvis en ny fade starter, afvikles den foregående faders Promise øjeblikkeligt via `fadeResolveRef` for at forhindre hængende asynkrone tråde.
  - **Stale DOM Recovery:** Detekterer proaktivt hvis en afspillers DOM iframe er blevet udskiftet eller fjernet af React under rendering, hvorefter den gamle instans destrueres og en ny opbygges flydende uden at afbryde appens flow.
  - **Synkroniseret WebGL Farve-Crossfade (Visuel Overgang):** For at matche lyd-crossfadet visuelt, sender lydmotoren et `isCrossfade: true`-flag til `App.tsx` ved overgangens start. Appen indlæser øjeblikkeligt crossfade-varigheden (f.eks. 8s) og sender den til `<FluidBackground />` som `transitionDuration`. For at skabe en ekstremt luksuriøs og blød "liquid paint" sammensmeltning, skalerer baggrunden denne varighed med **1.6x** og anvender en blid eksponentiel dæmpning på `-2.0`:
    $$\text{speed} = 1.0 - e^{-2.0 / (\text{duration} \cdot 1.6 \cdot 60.0)}$$
    Dette gør, at farverne morfer utroligt langsomt og flydende under hele crossfade-vinduet og fortsætter blødt et par sekunder efter, at lyden har lagt sig. Ved almindelige manuelle sangskift nulstilles transitionstiden automatisk til standarden på `1.2s` for øjeblikkelig taktil respons.

### 🔍 8. Metadata Weighted Search Ranker & Audio-First Playback
* **Filer:** `src/app/utils/api/searchRanking.ts`, `musicStreamFilters.ts` (`isLikelyMusicVideoStream`), `chartPlaybackUtils.ts`, `App.tsx` (`handleSelectSong`)
* **Hvordan det virker:**
  - Modvirker uofficiel YouTube-støj (fan-made, live-klip, 10-timers loops).
  - Søgeresultater scores: **Topic kanaler (+220 pts)**, **official audio (+90)**. **VEVO/MV straffes** når brugeren ikke søger efter video (`music video` ca. **-200 pts**).
  - **Aggressive strafpoint:** Bootlegs, live, cover, lyric-videoer (op til **-500 pts**).
  - **Chart/Apple-tracks uden `videoId`:** `resolveYouTubeForChartTrack()` — parallel søgning (official audio + Topic), hurtig sti for Topic-match, ellers max 2 metadata-verifikationer.
  - **MV-swap ved afspilning:** Hvis et valgt resultat ligner musikvideo/VEVO (`isLikelyMusicVideoStream`), re-resolves til audio-version automatisk (ingen manuelt lyrics-offset).
  - **Baggrund-prefetch:** `chartPrefetch.ts` — op til **2 parallelle** resolves af kø-tracks efter Play All / første sang (gemmes i `elva_resolved_video_ids` + opdaterer kø-rækker).

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
  - **My Space (Browse Full Library) — overgang uden layout-hop:**
    - **Filer:** `Queue.tsx`, `QueuePanelLayer.tsx`, `motionPresets.ts` (`queuePanelLayerClass`, `searchPhaseMotion`)
    - Header/titel/tilbage-pil **crossfader** (ikke instant swap). Søgefelt skjules via **CSS grid `0fr → 1fr`** (ikke Framer `height`).
    - Indhold ligger i **absolutte lag** (`QueuePanelLayer`) med `AnimatePresence mode="wait"` — undgår at to views stables i flow og fordobler panelhøjde under crossfade.
    - Queue-søg bruger **samme premium animation** som landing (`SearchSection` + `SearchLoadingState`).
  - **Artist-kort i søg (landing + queue):** `pickArtistCardFromSearchResults()` i `artistHelpers.ts` — grupperer resultater, kræver **min. 2 tracks** fra samme artist, undgår collab-kanal som “Kundo and Benny Jamz” ved søgning på `kundo`. `getPrimaryArtist()` splitter også ` and `.
  - **Dobbelt Enter i landing-søg:** `handleSearch` ignorerer gentagen submit af samme query (forhindrer at `verifiedArtist` nulstilles).

### 📊 11b. Discover Charts (Apple Music Live Charts)
* **Filer:** `DiscoverView.tsx`, `chartFeeds.ts`
* **Hvordan det virker:**
  - Henter Apple most-played JSON: **dev** via Vite-proxy `/api-apple`, **production** via `robustFetch` direkte til `rss.marketingtools.apple.com`.
  - **Ingen falsk fallback-liste** — ved fejl: fejlkort + Retry (ikke hardcodet placeholder-chart).
  - **Cache:** `elva_apple_chart_dk_v2` / `elva_apple_chart_us_v2` i localStorage (6 t TTL, stale tilladt offline).
  - **Play All:** `handlePlayPlaylist` i `App.tsx` sætter kø + starter prefetch; første sang resolves, resten i baggrunden.

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

### 🌐 14. Continuous Background Playback & Centered Mini-Player Pill ("Sømløs baggrundsafspilning")
* **Filer:** [App.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/App.tsx)
* **Hvordan det virker:**
  - `MusicPlayer` afmonteres **aldrig** fra DOM'en, når der navigeres tilbage til landing page. Den skjules i stedet blødt via Framer Motion med `opacity: 0`, `y: 40` og CSS `visibility: hidden` (på dens overordnede wrapper). Det tillader baggrundslyden, lydstyrkefaderen og YouTube-afspilleren at køre uforstyrret videre.
  - **B&O-Style Mini-Player Pill:** Når en sang spiller i baggrunden, glider en svævende glaspille (`w-[410px] h-14 rounded-2xl bg-black/55 border-white/10`) frem i bunden af landing page.
  - **Taktile Kontroller:** Indeholder static cover art (B&O minimalism), afspilningsinfo, klik-for-at-gendanne-afspiller samt taktile genveje for SkipBack, Play/Pause, SkipForward og Stop & Ryd (`X`).
  - **Fejlfri Centrering (Tailwind v4 clashing):** I Tailwind v4 kompilerer `left-1/2 -translate-x-1/2` til den selvstændige CSS `translate: -50% 0px` egenskab, mens Framer Motion kompilerer `x: '-50%'` inline til `transform: translateX(-50%)`. For at undgå, at de to egenskaber lagde sig oven i hinanden og skubbede pillen skævt til venstre, fjernes `x` helt fra Framer Motions inline animationer. Centreringen styres **rent og fejlfrit** af Tailwind-klassen.
  - **Decoupled Event-Driven Styring:** Knapperne på MiniPlayeren afsender globale CustomEvents (`'elva-play-prev'`, `'elva-toggle-play'`, `'elva-play-next'`), som opfanges direkte af baggrundsafspilleren for at synkronisere tilstande øjeblikkeligt.

### 🖼️ 15. Decoupled Global Volume HUD & Filmisk Vignette Mask
* **Filer:** [App.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/App.tsx), [MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx)
* **Hvordan det virker:**
  - **Rod-niveau Afkobling:** Volume HUD-overlægget er fjernet fra `MusicPlayer.tsx` og flyttet op i rod-niveauet i `App.tsx` som en del af det globale UI.
  - **Event-Driven Kommunikation:** Lydstyrkeændringer (via piletaster eller sliders) i afspilleren afsender en `'elva-volume-change'` event. `App.tsx` opfanger denne, opdaterer sit eget rod-state og viser en spring-animeret glassmorphic Volume HUD (`z-[99999]`) i toppen af skærmen. Dette løser fuldstændigt problemet med, at HUD'en blev skjult, når afspilleren kørte i baggrunden under `visibility: hidden`.
  - **Vibrant Filmisk Vignette Maske:** Den overordnede mørklægningsmaske er gjort væsentligt lysere og mere sofistikeret:
    - **Center-gennemsigtighed på 0%** (`rgba(0,0,0,0.0)`): Bevarer de glødende neon-marmorerede WebGL-farver i fuld styrke midt på skærmen.
    - **Kant-vignette på 48%** (`rgba(7,7,10,0.48)`): Indrammer skærmen med elegant filmisk dybde.
    - **Flad dæmpning på kun 8%** (`bg-black/8`): Sikrer optimal kontrast for hvid tekst (som sangtekster) uden at mærke eller dæmpe de lysende farver.
  - **Persistens på Landing Page:** Masken forbliver **aktiv på landing page**, så længe en sang spiller i baggrunden. Dette eliminerer ethvert lysstyrke- eller farveskift, når du skifter frem og tilbage mellem landing page og den fulde afspiller – baggrundslysstyrken forbliver 100% identisk og ubrudt!

### 🖼️ 16. Double-Image Artwork Crossfader, Stacking Context & Settings Sync
* **Filer:** [ArtworkCard.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/musicplayer/ArtworkCard.tsx), [PlayerControls.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/PlayerControls.tsx), [App.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/App.tsx), [useKeyboardShortcuts.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/hooks/useKeyboardShortcuts.ts)
* **Hvordan det virker:**
  - **Double-Image Render Stack:** For at undgå hvide blink under indlæsning af nye billeder bruges to billednoder i `ArtworkCard.tsx`: Et baggrundsbillede `<img>` for den forrige sang og et forgrundsbillede `<motion.img>` for den nye sang.
  - **Dynamisk Transition & Sort Blink Eliminering:** Det bageste billede har sin transition styret dynamisk: `showPreviousArtwork ? 'none' : 'opacity 0.5s ease-out'`. Når skiftet starter, gøres billedet øjeblikkeligt 100% synligt (`opacity: 1`, `transition: 'none'`), hvilket eliminerer det sorte blink (da begge billeder ikke længere er gennemsigtige på samme tid). Når det nye billede er indlæst, fader baggrunden blødt ud.
  - **Flimmerfrit Billedskift (`key`):** Baggrundsbilledet er udstyret med `key={previousArtwork}`. Dette tvinger React to genoprette elementet i stedet for at genbruge det, hvilket eliminerer browserens standardadfærd med at flimre det forrige-forrige cover under indlæsning af det nye `src`.
  - **Z-Index & Stacking Context (Controls Overlap):** Forgrundsbilledet er sat to `z-10`, og `PlayerControls` wrapperen er sat to `z-20` (med `isolation: 'isolate'` på forælderen). Dette løser CSS stacking context fejl, så kontrolpanelet fader ind fejlfrit (uden forsinkelse), og den mørke skygge-gradient altid tegnes oven på albumcoveret for optimal kontrast.
  - **Timeout Ref Cleanup:** Indlæsnings- og udtoningstimere styres af `loadTimeoutRef` og `hidePrevTimeoutRef` via `useRef`, som nulstilles proaktivt ved hvert sangskift for at forhindre hængende overgange under hurtigt sangskift (rapid skip).
  - **Settings Modal Synkronisering:** For at forhindre at indstillings-modaler overlapper eller åbnes automatisk under skift tilbage til landing page, deaktiveres den globale `Cmd+,` keyboard shortcut (i `useKeyboardShortcuts.ts`), når app-tilstanden er `'ready'` (da afspilleren har sin egen lokale settings instans). Derudover kaldes `setShowSettings(false)` proaktivt i `onBackToHome` callback'en i `App.tsx`.

### 🎬 17. Premium Motion Presets (Landing + Queue Search)
* **Filer:** `motionPresets.ts`, `SearchSection.tsx`, `SearchLoadingState.tsx`, `QueueSearchResults.tsx`
* **Regler for agenter:**
  - Brug **`EASE_PREMIUM`** `[0.16, 1, 0.3, 1]` og **`searchPhaseMotion`** (opacity + let blur/lift) til fase-skift.
  - **ALDRIG `layout` prop** på søge-/queue-containere der skifter indholdshøjde — det giver “vokse/skubbe”-effekt.
  - Landing search: faser `recents | loading | results` med `AnimatePresence mode="wait"`; resultatrækker **stagger** via `searchStaggerContainer` / `searchStaggerItem`.
  - Recents vises indtil **`lastSearchedQuery`** (ikke debounced `searchQuery` alene).
  - Søgeresultater på landing page er samlet i én elegant glasramme (`rounded-[28px] border border-white/[0.06] bg-[#0a0b10]/60 shadow-[...] backdrop-blur-2xl`) for både kunstner-kort og sange, mens det individuelle kunstner-kort (`SearchArtistCard`) er baggrundsløst og adskilt fra sangene af en tynd divider-linje, hvilket forhindrer nested border-indpakning ("dobbelt ramme").

### 🚀 18. Deploy & Miljø
* **Repo:** `Elva/` (GitHub: `S1lence1q/elva`)
* **Production:** GitHub Actions (`.github/workflows/deploy.yml`) deployer **`dist/`** til GitHub Pages ved **push til `main`**.
* **Vigtigt:** Lokal `npm run dev` ≠ live site før push. Test charts/queue-fixes på dev-server eller efter deploy.
* **`elva_resolved_video_ids`:** Stadig simpel `trackId → videoId` map i localStorage (rigere cache med `resolvedAt` er **ikke** implementeret — kun tilføj hvis reel smerte).

### 🎯 20. Aim & Shoot Charging Volume Indicator (Hidden UX Game)
* **Filer:** [BottomBarControls.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/musicplayer/BottomBarControls.tsx)
* **Hvordan det virker:**
  - **Hold-to-Charge & Aim:** Ved at holde pointeren nede på højttaler-ikonet starter en 60fps tidsbaseret opladningscyklus, der ping-ponger volumenværdien op og ned (0% ➔ 100% ➔ 0%) over 2,4 sekunder. Samtidig roterer ikonet fysisk opad (mod uret fra 0° til -35°) for at angive kastevinklen.
  - **Uforstyrret Lydstyrkebar:** Under opladningen forbliver selve volumen-slideren og procentvisningen (f.eks. `70%`) helt statiske. Slider-knappen (thumb) er synlig under opladning for at vise nuværende niveau, men skjules under skudflyvningen.
  - **Glow Projectile & Parabolsk Fysik:** Når knappen slippes, skydes et høj-synligt, lysende hvidt projektil (18px med tema-farvet border og dobbelt skygge-glow) ud af højttalerikonet. Det flyver i en matematisk korrekt parabolsk bane og lander præcist på slider-sporet for at indstille den nye lydstyrke.
  - **Fokusring- & Spacebar-sikring:** Alle knapper i bunden og afspillerkontrollerne i [PlayerControls.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/PlayerControls.tsx) (Play/Pause, Heart, Playlist, Previous/Next og Artist-link) er sikret med `outline-none focus:outline-none focus:ring-0`, `onKeyDown` (der blokerer default Spacebar browser-activation), samt `blur()` ved tryk. Dette forhindrer browserens standard-fokusringe og sikrer at tryk på Spacebar altid kun afspiller/pauser sangen globalt i stedet for at genaktivere en fokuseret knap.

### 🎭 21. Transition Layout Shift Hover Lock (Lyrics Hover Bug)
* **Filer:** [ArtworkCard.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/musicplayer/ArtworkCard.tsx)
* **Hvordan det virker:**
  - **Udfordring:** Når live lyrics åbnes via `L` tasten, rykker album art sig mod venstre (GPU `x: -284px`). Hvis musen var placeret på højre side af album art, ender den stationære mus pludselig over de indglidende lyrics. Fordi elementet bevæger sig væk under musen, affyrer browseren fejlagtigt `mousemove`-begivenheder på det bevægelige album art, hvilket genaktiverer dets hover-state (`isArtworkHovered`). Efter endt animation er musen udenfor, og der affyres aldrig `mouseleave`, hvorved hover-kontrollerne (play/pause overlay, mørk gradient, osv.) forbliver permanent synlige på album art.
  - **Løsning:** Ved ændring af `showLyrics` aktiveres en midlertidig `isTransitioning` tilstand i 800ms. I denne periode nulstilles hover-state, og der påsættes `pointer-events: none` på hele `#artwork-card` wrapperen, samtidig med at JS-mouse events blokeres. Når spring-animationen har lagt sig helt, re-aktiveres pointer-events, hvilket eliminerer alle stuck hover/controls flimmer-tilstande.

---

## 📁 19. Modulopbygget Kodebase

### `src/app/utils/` — Utilities
1. `playerColorUtils.ts` — HSL/RGB konvertering, downsampled 32x32 scanning og fallbacks.
2. `lyricsUtils.ts` — LRC parsing og dynamiske fallback lyrics.
3. `stringUtils.ts` — Song title sanitizing.
4. `apiUtils.ts` — Barrel re-export for `src/app/utils/api/*` (HTTP client, search, ranking, channel uploads, video metadata).
5. `hudUtils.ts` — Global `showMiniHUD()` toast-hjælper.
6. `discographyCache.ts` — 48-timers localStorage-baseret discography cache med LRU eviction.
7. `chartFeeds.ts` — Apple chart fetch + 6t localStorage cache (DK/US).
8. `chartPlaybackUtils.ts` — Chart/Apple track → verified YouTube audio (Topic-prioritet).
9. `chartPrefetch.ts` — Baggrund-resolve af kø-tracks (concurrency 2).
10. `motionPresets.ts` — Delte Framer transitions (`searchPhaseMotion`, `queuePanelLayerClass`, stagger variants).

### `src/app/hooks/` — Custom React Hooks (fra App.tsx og MusicPlayer.tsx refactor)
Disse hooks er udtrukket for at holde `App.tsx` og `MusicPlayer.tsx` fokuserede og fri for koderod.

| Hook | Formål |
|------|--------|
| `useScrollTracking.ts` | LERP-baseret scroll-progress tracker + velocity turbulence engine for WebGL |
| `useBackgroundColors.ts` | Beregner og interpolerer WebGL-baggrundsfarverne baseret på scroll-position og sang-farver |
| `useKeyboardShortcuts.ts` | Globale keyboard shortcuts (mellemrum, piletaster, osv.) — event-driven, kobles på `window` |
| `useSearchLogic.ts` | Søge-state, debounce, YouTube API kald og resultat-håndtering |
| `useFadeVolume.ts` | Trigonometrisk Equal-Power (sinus/cosinus) volume fader, der garanterer en konstant samlet perceived loudness under overgange. |
| `useAudioPlayer.ts` | *[Forældet/Subsumeret]* Erstattet af Dual-Engine arkitekturen i `usePlaybackCore.ts` |
| `useYouTubePlayer.ts` | *[Forældet/Subsumeret]* Erstattet af Dual-Engine arkitekturen i `usePlaybackCore.ts` |
| `usePlaybackCore.ts` | Core Dual-Engine (A/B) afspilnings-livscyklus med asynkron pre-loading, automatisk equal-power crossfading og localStorage-baseret timing. |
| `useLyrics.ts` | LRC parsing og dynamisk synkronisering/søgning af sangtekster |
| `usePlayStats.ts` | Sporing af afspilningshistorik, nyligt afspillede og ugentlig lyttetid |
| `useGlobalVolumeHUD.ts` | Lytter på `elva-volume-change` og styrer det globale volume HUD |

### `src/app/components/` — Vigtige komponenter
- **`App.tsx`** — Root controller og state host. Delegerer landing UI til `LandingPage.tsx`.
- **`components/app/GlobalVolumeHUD.tsx`** + **`hooks/useGlobalVolumeHUD.ts`** — Rod-niveau volume overlay (event-driven).
- **`components/app/LandingMiniPlayerPill.tsx`** — Mini-player på landing under baggrundsafspilning.
- **`LandingPage.tsx`** — Udtrukket UI-komponent for landing page. Modtager all relevant state og callbacks som props fra `App.tsx`. Indeholder Search, Charts og My Hub sektionerne.
- **`MusicPlayer.tsx`** — Bridge mellem player-hooks og præsentationslaget (`LyricsPanel`, `PlayerControls`). Bruger `useFadeVolume`, `useAudioPlayer` og `useYouTubePlayer`.
- **`LyricsPanel.tsx`** — Apple Music-stil floating lyrics med interactive scrubbing.
- **`PlayerControls.tsx`** — Afspillingskontroller, volumen-slider, seek-bar.
- **`Queue.tsx`** — Sidebar med køstyring, søgning, favoritter og historik.
- **`ProfileHubView.tsx`** — Widescreen My Hub profil-side med tabs.
- **`LandingRecents.tsx`** — Vandret rullende historik + artist-kortvisning.
- **`SearchSection.tsx`** + **`SearchLoadingState.tsx`** — Landing-søg med fase-animationer.
- **`DiscoverView.tsx`** — Live Apple charts (ingen fake fallback).
- **`queue/QueuePanelLayer.tsx`** — Absolut crossfade-lag i queue-panelet.

---

### 🎯 22. Dynamic Profile Storefronts & Personalized Greetings
* **Filer:** [chartFeeds.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/utils/chartFeeds.ts), [ProfileCustomizerModal.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/profilehub/ProfileCustomizerModal.tsx), [ProfileHubView.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/ProfileHubView.tsx), [DiscoverView.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/DiscoverView.tsx), [BrandingHeader.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/BrandingHeader.tsx)
* **Hvordan det virker:**
  - **Dynamic Storefront Selector:** Profilens customizer-modal lader nu brugeren vælge deres tilknyttede musikland (fx Danmark, USA, Storbritannien, Sverige, Norge, Tyskland, Frankrig, Japan, Canada eller Australien), hvilket gemmes i localStorage under `elva_profile_country`.
  - **Event-Driven Feed Update:** Når profilen gemmes, afsendes en global `elva-profile-updated` CustomEvent. `DiscoverView.tsx` reagerer på denne ved øjeblikkeligt at genindlæse Apple Music Live Charts for det valgte land og re-labele playlists (fx "Top Hits: Norway").
  - **Personalized Header Greeting Banner:** Sektionens hovedoverskrift (`BrandingHeader.tsx`) synkroniserer ligeledes med eventet og viser en premium glassmorphic badge i toppen med tidsbaserede danske hilsner (`Godmorgen / Goddag / Godaften`), curator-avatar, profilnavn samt det valgte lands flagemoji.

---

### 🎯 23. Screen-Top Progress Bar Portal Positioning
* **Filer:** [MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx), [ArtworkCard.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/musicplayer/ArtworkCard.tsx)
* **Hvordan det virker:**
  - **CSS Transform Containing Block Bug:** Når lyrics åbnes, translateres `#artwork-card` til venstre (`x: -284px`). Under CSS-specifikationer skaber en transform på en forældernode et nyt absolut/fixed koordinatsystem (containing block) for alle efterkommere. Dette medførte, at den skærm-toppede `fixed top-0 left-0 right-0` progress-linje blev trukket til venstre og beskåret.
  - **Portal-løsning:** Afspillerens rod-container i `MusicPlayer.tsx` har nu fået tildelt id'et `elva-player-root` (som ikke har nogen layout-transformeringer, men indeholder alle farvetema-CSS-variablerne). Progress-linjen i `ArtworkCard.tsx` renderes nu via `createPortal` direkte som efterkommer af `elva-player-root`. Dette sikrer, at den altid spænder over hele viewporten, forbliver uafhængig af artworkets translationsanimationer og bibeholder adgang til farvevariablerne.

---

### 🎯 24. Heavy Bass Oscilloscope Audio Visualizer
* **Filer:** [VisualizerCanvas.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/VisualizerCanvas.tsx), [MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx)
* **Hvordan det virker:**
  - **Oscilloscope Waveform Drawing:** Den tidligere inaktive `VisualizerCanvas` er blevet implementeret og monteret som en baggrunds-canvas i `MusicPlayer.tsx` (placeret bag albumcoveret og teksterne). I stedet for traditionelle frekvenssøjler tegner den en hardware-lignende oscilloskop-bølge (`getByteTimeDomainData`).
  - **Trap/Hardstyle Beat Synthesizer:** Ved afspilning af YouTube-streams (hvor CORS-sandboxing blokerer direkte iframe-audiomåling) syntetiserer canvasen en yderst overbevisende og aggressiv waveform-strøm i realtid. Den simulerer en tung 138-BPM bas-puls (fast decay), sub-bass rumble, 16. dels trap hi-hat rolls samt forvrængede savtaks-leads.
  - **Bass Shake & Glow Ticks:** Kraftige bas-slag (både fra ægte AudioAPI-frekvenser og den interne synthesizer) udløser et dynamisk viewport-rystelses-matrix (`translate` på canvasen), forstørrer kurvens amplitude, og øger gløden på linjens endepunkter og hardware-skala-tringitteret.
  - **Motion Blur Trails:** For at bevare baggrundens gennemsigtighed (så WebGL-canvasen kan ses igennem), undgås fuld farve-overtegning. I stedet gemmes en historik over de seneste 7 frames af bølgebaner, som renderes med aftagende gennemsigtighed og tykkelse, hvilket skaber en jævn og lynhurtig eftergløds-effekt (motion blur).

---

### 🎯 25. Sidebar Option Menus, Keyboard Shortcuts, and Mini Player Polish
* **Filer:** [SongRowOptions.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/SongRowOptions.tsx), [QueueUpNext.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/queue/QueueUpNext.tsx), [QueueSongRow.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/queue/QueueSongRow.tsx), [Queue.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/Queue.tsx), [MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx), [KeyboardShortcutsModal.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/KeyboardShortcutsModal.tsx), [LandingMiniPlayerPill.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/app/LandingMiniPlayerPill.tsx)
* **Hvordan det virker:**
  - **Context Options Everywhere:** De simple quick-add `+` knapper i sidebarens lister (søg, bibliotek, artister, playlists, likes) er fuldt erstattet af `SongRowOptions` dropdown-menuerne, som lader brugeren tilføje til playliste, like eller afspille næste. I den aktive kø skjules "Add to Queue", men "Remove from Queue" tilføjes.
  - **Hover Thumbnail Play/Plus Morphing:** Hover over sidebarsangrækker tegner et Play-ikon oven på coveret. Hvis cursor flyttes direkte over selve cover-rektanglet, morpher det til et Plus-ikon (`+`), hvilket skaber en intuitiv visuel adskillelse: Klik på cover tilføjer til køen, klik på række afspiller med det samme.
  - **Flicker-Free Portal Layout Effect:** `SongRowOptions` bruger nu `getBoundingClientRect()` i `useLayoutEffect` til dynamisk højdemåling frem for statiske skøn. For at forhindre kortvarig 1-frame blink i toppen (ved bundrækker der åbner opad), mounter portalen i usynlig tilstand (`visibility: 'hidden'`) og gøres først synlig (`visibility: 'visible'`), når den synkrone layout-positionering er fuldført inden browser-paint.
  - **Focused Outline & Margin Balance:** Tilføjet `pt-1.5` padding til søgefeltet i kø-drawer og justeret header-højde (`pb-2.5`) for at forhindre beskæring af den hvide fokus-ring under containerens `overflow-hidden`.
  - **Keyboard Toggle & OS-Aware Labels:**
    - Genvejen **`Q`** er implementeret i afspilleren til lynhurtigt at folde køen ud og ind, og er fuldt dokumenteret på genvejskortet (`?`).
    - Hjalp Windows/Linux brugere ved dynamisk at erstatte Mac-specifikke **`⌘,`** med **`Ctrl+,`** på settings-hints og genvejs-modaler.
    - Ryddet op i kø-headeren ved at fjerne genvejsknappen derfra, og strammet keyboard-knappens afstand til "Elva"-teksten i afspillerens top-bar.
  - **Mini Player Upgrade:** Landing page mini-playeren er udvidet i volumen (højde 56px ➔ 64px, bredde 410px ➔ 440px) og forsynet med større cover-thumbnails (44px) og markant hævet tekstskalering (titel: `xs`/12px, artist: 11px med `text-white/50` kontrast) for uovertruffen læsbarhed.
  - **EQ Pause Sync:** Detekterer afspilningstilstand i kø-lister og sætter automatisk EQ-bølgernes CSS-animationer på pause (`animation-play-state: paused`), når lyden standses.

---

### 🎯 26. LandingRecents Horizontal Scroll Mask Bugfix
* **Filer:** [LandingRecents.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/LandingRecents.tsx)
* **Hvordan det virker:**
  - **Udfordring:** Scroll-masken (der fader siderne ud) var permanent aktiv på venstre side i historikken, selv når man var scrollet helt til venstre. Dette skyldtes primært to ting:
    1. Deling af et enkelt `scrollState` og en enkelt callback ref mellem Songs og Artists tabs. Da det ene liste-element blev afmonteret ved tab-skift under exit-animationerne, forblev dets rullestatus (`canScrollLeft: true`) gemt i det fælles state og blev fejlagtigt overført til det nye element.
    2. Manglende CSS `scroll-padding` (Tailwind class `scroll-px-3`) på de to rullende containere. Browserens snapping-motor forsøgte at justere de `snap-start` indrettede elementer (som startede 12px inde pga. `px-3` container-padding) helt mod scrollportens start (0px). Dette tvang en permanent rullestilling på `scrollLeft = 12px` (hvilket gemte venstre-paddingen og udløste masken).
  - **Løsning:** 
    - Opdelte det fælles state i to fuldstændigt isolerede states (`songsScrollState` og `artistsScrollState`) samt to separate ref-instanser (`songsRef` og `artistsRef`).
    - Tilføjede `scroll-px-3` på begge scroll-containere, så det rullende snap-start punkt indrettes mod padding-grænsen og lader startrullestillingen forblive præcis på `scrollLeft = 0px`.
    - Hævede afbøjningsgrænsen for venstrerul (`canLeft`) til `node.scrollLeft > 10` for at eliminere subpixel-fejl på skærme med høj opløsning.
    - Tilføjede en nulstilling af rullestatus i `useEffect`-cleanup'en ved tab-skift og afmontering, så nye views altid starter med rene, umaskede venstre-kanter.

### 🎯 27. Profile Hub Design Unification & No Glow / Clean Apple Aesthetic
* **Filer:** [theme.css](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/styles/theme.css), [OverviewTab.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/profilehub/OverviewTab.tsx), [FavoritesTab.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/profilehub/FavoritesTab.tsx), [PlaylistsTab.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/profilehub/PlaylistsTab.tsx), [AdvancedSettingsTab.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/profilehub/AdvancedSettingsTab.tsx), [SettingsModal.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/SettingsModal.tsx)
* **Hvordan det virker:**
  - **Unificering af kort- og række-baggrunde:** Tidligere brugte Profile Hub-arkene og indstillingerne forskellige rå `bg-white/[0.015]`- og `border-white/[0.03]`-klasser spredt ad hoc i koden. Disse er fuldt erstattet af de to globale semantiske CSS-klasser i `theme.css`:
    - `.elva-hub-card`: Bruges til store container-kort (fx overbliksbokse, indstillingspaneler, oprettelses-popups). Den har en ren, subtil gennemsigtighed (`bg-white/[0.015]`), en meget tynd og sprød border (`border-white/[0.04]`), og en dæmpet, naturlig skygge.
    - `.elva-hub-row`: Bruges til rækker, sange og toggles (fx favoritnumre, afspilningslister, inline søgeresultater, indstillingsknapper). Den har samme baggrund som kortene, men ændrer sig blødt på hover til en mere markeret platin-glasoverflade (`bg-white/[0.04] border-white/[0.06]`) med en tidsmæssig transition på 300ms.
  - **Fjernelse af støjende lyseffekter (Glows & 3D-skygger):** For at imødekomme brugerens ønske om at fjerne "glow glød lort" er følgende ændret:
    - Alle neonagtige accent-skyggelys (`shadow-elva-accent-glow`) er fjernet fra aktive toggles, indstillingsknapper og farvevælgere.
    - De slørede farvegløder bag Playlists-overskriftskortet og Customizer-modal-swatches er fuldstændigt fjernet.
    - Omskifterknapperne (SettingsToggle) bruger nu et Apple-inspireret solidt design: et fladt farvet spor uden glød, når de er tændt, og en hvid knap uden lysende skyggekontur.
