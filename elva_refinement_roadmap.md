# Elva Refinement & Polishing Roadmap - Master Progress Ledger

Dette dokument fungerer som vores langsigtede roadmap og statusregister over forbedringer af **Elva**. Det er gemt lokalt i dit projekt, så vi altid kan læse og opdatere det uden at miste historikken.

Sidst opdateret: 2026-05-26 23:45

---

## 📊 Overordnet Status

| Kategori | Beskrivelse | Status |
| :--- | :--- | :--- |
| **Fase 1: Visuel & UX Polering** | Løsning af de 5 umiddelbare irritationspunkter (branding, styling, centrering, kliks) | **100% Gennemført** |
| **Fase 2: Apple Music Lyrics** | 1.4s slow cinematic 3D flip på mobil & flydende, boksfri desktop lyrics side-by-side | **100% Gennemført** |
| **Fase 2: 120fps GPU Optimering** | Konvertering til rene GPU transform-animationer uden layout-reflows | **100% Gennemført** |
| **Fase 3: Artist Matching** | Optimering af YouTube-søgning og artist profil-genveje | *Mangler* (Næste skridt) |
| **Fase 3: Advanced Settings** | Opgradering af indstillinger til et "Advanced Control Center" | *Mangler* |
| **Fase 3: Farve-Ekstraktion** | Justering af farvemætnings-grænser og luminance-bund | *Mangler* |

---

## 🛠️ Detaljeret Status på de 9 Punkter

### Phase 1: Immediate high-impact polished fixes
#### 🟢 1. Double Branding on Landing Page
*   **Problem:** Det lille fastlåste "Elva"-logo i øverste venstre hjørne konkurrerede med det store velkomst-logo, når man lige var landet på siden.
*   **Løsning:** Det lille logo fader nu først blødt ind, når man scroller forbi 15% af velkomstsiden (`scrollProgress > 0.15`). Før dette er det fuldstændig usynligt og klik-isoleret.
*   **Filer:** `src/app/App.tsx`

#### 🟢 2. Redundant "Explore Live Charts" Text
*   **Problem:** Knap-teksten "Explore Live Charts" i toppen af Discover-sektionen virkede overflødig og rodet.
*   **Løsning:** Teksten er fjernet for et mere minimalistisk og stringent look.
*   **Filer:** `src/app/App.tsx`

#### 🟢 3. Player Title Alignment & Centering
*   **Problem:** Hjerte- og Playliste-knapperne skubbede sangtitlen mod venstre, så den ikke stod centreret under albumcoveret.
*   **Løsning:** Reworket med en absolut positioneringsmodel: Sangtitlen er nu 100% matematisk centreret i containeren, mens knapperne sidder yderst til henholdsvis venstre og højre.
*   **Filer:** `src/app/components/PlayerControls.tsx`

#### 🟢 4. Player Play/Pause Click Interference
*   **Problem:** Klik på "Like" eller "Tilføj til playliste" under albumcoveret stoppede afspilningen, fordi kliks og tryk-events boblede op til selve kortets play/pause-funktion.
*   **Løsning:** Tilføjet `stopPropagation()` på både pointerdown og click events for alle kontrolelementer under coveret. Afspilleren reagerer nu udelukkende på direkte klik på selve billedet.
*   **Filer:** `src/app/components/PlayerControls.tsx`

#### 🟢 5. Album Art Glow Lag & Sync
*   **Problem:** Den atmosfæriske, farvede lysglød (shadow glow) omkring albumcoveret opdaterede med en mærkbar forsinkelse ved sangskift, så den forkerte farve hang ved i et par sekunder.
*   **Løsning:** Skyggegløden er dæmpet en smule, farverne synkroniseres øjeblikkeligt via Canvas-farveekstraktoren, og overgangshastigheden er justeret til præcis 500ms for et glat farveskift i perfekt sync med sangskift.
*   **Filer:** `src/app/components/MusicPlayer.tsx`

---

### Phase 2: Lyrics & Performance Refactoring
#### 🟢 9. Lyrics Flip Speed & Apple Music Style Floating Lyrics
*   **Problem:** Tryk på "L" vendte afspilleren for hurtigt (0.8s) på mobil. På desktop var det ærgerligt at albumcoveret blev gemt væk bag sangteksterne, da man gerne ville se begge dele side-by-side.
*   **Løsning:**
    *   **Mobil:** Fuldstændig opgraderet med en langsom, luksuriøs 3D-kortvending på **`1.4s`** med en specialdesignet, dæmpet cubic-bezier kurve.
    *   **Desktop (>= 1024px):** Implementeret **Floating Lyrics Mode** inspireret af Apple Music. Albumcoveret glider majestætisk til venstre, mens en 100% boks- og kantfri, gennemsigtig sangtekst-oversigt glider ind fra højre. Teksterne er venstrestillet med en stor, fed skrifttype, der svæver direkte oven på WebGL-baggrunden.
    *   **Ydeevne (120/144fps):** Fjernet alle tunge layout- og positionsændringer på CPU (`layout`, `marginLeft`, `maxWidth`). Alt kører nu via GPU-accelererede transform-oversættelser (`translateX` via Framer Motion `x`), hvilket sikrer **0% hakken** eller reflows, selv under opbremsninger eller ved sangskift!
    *   **AnimatePresence:** Teksterne på desktop fader og glider nu blødt ind og ud under åbning og lukning i stedet for at forsvinde brat.
    *   **Tekst-klipningssikring:** En maksimal breddegrænse på `max-w-[75%]` sikrer, at bogstaver aldrig skæres af mod højre, når linjerne zoomes op til `scale-[1.3]`.
*   **Filer:** `src/app/components/MusicPlayer.tsx`, `src/app/components/LyricsPanel.tsx`, `src/styles/theme.css`

---

### Phase 3: Future refactoring & features
#### 🟡 6. Artist Search & Matching Heuristics
*   **Hvad mangler:**
    *   Søgninger på YouTube kan til tider trække numre ind fra forkerte eller uofficielle kunstnere.
    *   Det kan være svært at navigere fejlfrit fra en igangværende sang til den korrekte kunstnerprofil (f.eks. at klikke på artistnavnet i afspilleren og springe direkte til deres hub-profil).
*   **Planlagt Løsning:**
    *   Refaktorering af søgestrengssaneringen (`search query sanitization`).
    *   Implementering af en sekundær søgnings-fallback, der sikrer, at officielle artist-kanaler (verified channel IDs) prioriteres og gemmes i sangens metadata, så navigeringslinks altid peger på den korrekte profil.

#### 🟡 7. Premium Settings Modal & Advanced Mode
*   **Hvad mangler:**
    *   Indstillingsmenuen (Settings) trænger til et visuelt løft, så det føles som et rigtigt "Advanced Control Center" frem for standard-kasser.
    *   Muligheden for at vælge accentfarver (emerald, wine, navy, sand) fylder meget visuelt, selvom appen er designet til at køre med en stramt kurateret skandinavisk standardfarve.
*   **Planlagt Løsning:**
    *   Redesigne indstillingerne med en smuk, foldbar struktur.
    *   Skjule farvepaletten under en "Advanced/Ekspert"-fane, så standardbrugeren møder et rent, fuldstændig perfekt kurateret design-preset, mens avancerede brugere stadig kan udfolde og tilpasse farverne under motorhjelmen.

#### 🟡 8. Dynamic Color Extraction Tweaks
*   **Hvad mangler:**
    *   Farveekstraktoren (der scanner albumcoverets pixels) trækker nogle gange meget dæmpede eller kedelige nuancer ud, selvom coveret indeholder flotte, levende farvespor.
    *   Ekstremt mørke eller næsten sorte albumcovers kan få WebGL fluid-baggrunden til at slukke helt og blive kulsort, hvilket mindsker den dynamiske og luksuriøse atmosfære.
*   **Planlagt Løsning:**
    *   Justere farvemætnings-grænseværdien (`colorfulness threshold`) i canvas-pixel-scanneren.
    *   Implementere en boost-multiplikator for levende accenter.
    *   Lægge en minimums-luminansbund (`luminance ceiling/floor`), der sikrer, at WebGL-baggrunden altid lyser en lille smule bioluminescent op, selvom sangens cover er komplet sort.

---

## 🚀 Klar til næste skridt!

Når du er klar, kan du blot bede mig om at tage fat på **Fase 3** (f.eks. Punkt 6, 7 eller 8). Vi tager dem én ad gangen for at sikre absolut perfektion!
