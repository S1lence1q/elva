# Elva - Master System Memories, Architecture & Design Directives

Dette dokument er den urokkelige kilde til sandhed (Source of Truth) for Elvas kildekode, arkitektur og retningslinjer. 
**LÆS DETTE FØRST**, hvis du genoptager arbejdet efter en context-compaction eller i en ny session for at undgå at bryde eksisterende logik.

---

## 🛑 STRATEGISKE WORKSPACE-REGLER & FILOSOFI
*(Disse regler skal overholdes uanset hvad – ingen undtagelser!)*

### Rule 1: 🇬🇧 100% English Language Directive
* **Krav:** Hele applikationens brugerflade skal være **100% på engelsk**. 
* **Handling:** Eventuelle eksisterende danske ord (f.eks. *"Historik"*, *"Artister"*, *"Kunne ikke afspille sang"*, *"Søg efter kunstner eller sang"*, *"Nyligt afspillet"*) skal oversættes til engelsk for at opretholde en international, strømlinet og eksklusiv lytter-oplevelse.

### Rule 2: 🧱 Modulopbygget Kode — Filstørrelse & Struktur

**Krav:** Filer SKAL holdes små, fokuserede og opdelte!

**Forskning, begrundelse & optimal størrelsesfordeling (Hvorfor dette gælder i Elva):**

Der er tre helt afgørende grunde til at holde filer under en bestemt størrelse, og de peger alle i samme retning:

**1. For mennesker (vedligeholdelse & læsbarhed):**
Industristandarder fra React/TypeScript-fællesskabet 2024–2026 er klare:
- **100–150 linjer** = Den absolutte guldstandard / *sweet spot*. Ekstremt let at overskue, teste og vedligeholde.
- **150–200 linjer** = Acceptabelt for større præsentationskomponenter.
- **Over 250 linjer** = Hård grænse for nye filer. Bør straks splittes opsplitning! En stor fil bryder Single Responsibility-princippet og øger risikoen for uventede regressioner markant.

**2. For AI-agenter (Vibe Coding & Agent-effektivitet):**
- LLM-baserede agenter (som denne!) præsterer markant bedre, når filer er holdt kompakte og fokuserede.
- Store filer bruger store mængder af agentens kontekst-budget på overflødig kode, hvilket fører til unødig latency og markant øgede API-omkostninger under vibe coding.
- Vigtigst af alt: Agenter kan rette en 120-linjers fil med næsten 100% præcision, mens gigantiske filer (som de gamle 1000+ linjers `App.tsx` og `MusicPlayer.tsx`) tvinger agenter til at "gætte" sammenhænge, hvilket skaber hallucinationer og sideeffekter.

**3. For Web App Runtime & Bundler Performance:**
- **Hurtigere HMR (Hot Module Replacement):** Vite genindlæser og patcher små moduler på under 10ms direkte i din browser, mens tunge filer bremser udviklingstempoet.
- **Bedre Code Splitting & Tree-Shaking:** Små, modulære filer lader Vite og Rollup pakke din applikation i mikro-chunks, så den indledende indlæsningstid minimeres og ubenyttet kode udelukkes.
- **Hurtigere React Reconciliation:** Reacts Virtual DOM genberegner og re-renderer isolerede og afkoblede komponenter langt hurtigere end massive mega-komponenter.

**Handling:** Når du tilføjer ny funktionalitet, må du **aldrig** bare smække det ind i en eksisterende fil. Opret et nyt modul med klare props/interfaces. Følg de specifikke grænser:
- Komponenter: **100–150 linjer**.
- Hooks: **80–120 linjer**.
- Utilities: **50–100 linjer**.

**Aktuelle fremskridt & målsætninger i Elva:**
- Queue-panelet er allerede blevet succesfuldt splittet op i uafhængige underkomponenter under `src/app/components/queue/` for at overholde Rule 2.
- MusicPlayer UI og App.tsx er fortsat mål for fremtidig opdeling. Appen har nu et robust React Error Boundary-sikkerhedsnet, så eventuelle isolerede nedbrud i disse komponenter fanges på modul-niveau uden at ramme hele websiden.

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

### 🎚️ 7. A/B Dual-Engine Crossfade, Buffering Sync & Double-Trigger Guards
* **Filer:** [usePlaybackCore.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/hooks/usePlaybackCore.ts), [useFadeVolume.ts](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/hooks/useFadeVolume.ts), [MusicPlayer.tsx](file:///Users/applemacbook/AntiGravity%20Shit/Elva.nosync/Elva/src/app/components/MusicPlayer.tsx)
* **Hvordan det virker:**
  - **A/B Dual-Engine Orchestrator:** Afspilningen administreres af to uafhængige afspiller-sæt (Engine A og Engine B) for både lokale filer (`audioRefA`/`B`) og YouTube streams (`ytPlayerRefA`/`B`). Dette muliggør parallel indlæsning og afspilning.
  - **Constant-Power Equal-Power Fade:** Lydstyrken reguleres af en trigonometrisk (sinus/cosinus) konstant-energi-kurve ($\text{In} = \sin(\text{progress} \cdot \pi/2)$ og $\text{Out} = 1 - \cos(\text{progress} \cdot \pi/2)$). Dette forhindrer det perceivede "volumen-dyk" ved midpoint (50%) under overgange.
  - **Customizable Transition Timing:** Triggermærket og fade-varigheden indlæses dynamisk fra `localStorage` under nøglen `elva_crossfade_duration`. Brugeren kan indstille denne flydende fra **0s til 12s** via en premium-slider under Control Center (**Audio Preferences**). Hvis indstillet til 0s, slås crossfaden helt fra og sangene skifter øjeblikkeligt ved track-end.
  - **Buffering Synchronization (`playPromise`):** Før crossfade-lydovergangen reelt begynder, afventer motoren et `playPromise`, der resolves når den inaktive afspiller skifter til `PLAYING`/`playing` tilstand (enten via HTML5 audio begivenheder eller YouTube player state callback-opsnapning). Dette eliminerer helt tavse huller under buffering, uanset internethastighed.
  - **Double-Trigger Prevention (`isCrossfadingRef.current`):** Under en aktiv crossfade er track-ended events på den afspillende engine blokeret af et `isCrossfadingRef`-guard, så applikationen ikke forsøger at køre en almindelig skip (`handleNextSong()`) midt i fadet.
  - **Fader Safeguard:** Hvis en ny fade starter, afvikles den foregående faders Promise øjeblikkeligt via `fadeResolveRef` for at forhindre hængende asynkrone tråde.
  - **Stale DOM Recovery:** Detekterer proaktivt hvis en afspillers DOM iframe er blevet udskiftet eller fjernet af React under rendering, hvorefter den gamle instans destrueres og en ny opbygges flydende uden at afbryde appens flow.
  - **Synkroniseret WebGL Farve-Crossfade (Visuel Overgang):** For at matche lyd-crossfadet visuelt, sender lydmotoren et `isCrossfade: true`-flag til `App.tsx` ved overgangens start. Appen indlæser øjeblikkeligt crossfade-varigheden (f.eks. 8s) og sender den til `<FluidBackground />` som `transitionDuration`. For at skabe en ekstremt luksuriøs og blød "liquid paint" sammensmeltning, skalerer baggrunden denne varighed med **1.6x** og anvender en blid eksponentiel dæmpning på `-2.0`:
    $$\text{speed} = 1.0 - e^{-2.0 / (\text{duration} \cdot 1.6 \cdot 60.0)}$$
    Dette gør, at farverne morfer utroligt langsomt og flydende under hele crossfade-vinduet og fortsætter blødt et par sekunder efter, at lyden har lagt sig. Ved almindelige manuelle sangskift nulstilles transitionstiden automatisk til standarden på `1.2s` for øjeblikkelig taktil respons.

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

---

## 📁 16. Modulopbygget Kodebase

### `src/app/utils/` — Utilities
1. `playerColorUtils.ts` — HSL/RGB konvertering, downsampled 32x32 scanning og fallbacks.
2. `lyricsUtils.ts` — LRC parsing og dynamiske fallback lyrics.
3. `stringUtils.ts` — Song title sanitizing.
4. `apiUtils.ts` — YouTube search, ranking, channel uploads.
5. `hudUtils.ts` — Global `showMiniHUD()` toast-hjælper.
6. `discographyCache.ts` — 48-timers localStorage-baseret discography cache med LRU eviction.

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

### `src/app/components/` — Vigtige komponenter
- **`App.tsx`** — Root controller og state host. Orchestrerer alle hooks og delegerer UI til `LandingPage.tsx`. Hoster det globale Volume HUD og MiniPlayer Pill.
- **`LandingPage.tsx`** — Udtrukket UI-komponent for landing page. Modtager all relevant state og callbacks som props fra `App.tsx`. Indeholder Search, Charts og My Hub sektionerne.
- **`MusicPlayer.tsx`** — Bridge mellem player-hooks og præsentationslaget (`LyricsPanel`, `PlayerControls`). Bruger `useFadeVolume`, `useAudioPlayer` og `useYouTubePlayer`.
- **`LyricsPanel.tsx`** — Apple Music-stil floating lyrics med interactive scrubbing.
- **`PlayerControls.tsx`** — Afspillingskontroller, volumen-slider, seek-bar.
- **`Queue.tsx`** — Sidebar med køstyring, søgning, favoritter og historik.
- **`ProfileHubView.tsx`** — Widescreen My Hub profil-side med tabs.
- **`LandingRecents.tsx`** — Vandret rullende historik + artist-kortvisning.
