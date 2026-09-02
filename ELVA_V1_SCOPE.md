# Elva V1 Scope & Technical Plan

```
V1 i én sætning:
Elva er en luksuriøs, minimalistisk musikafspiller med flydende WebGL-visuals, equal-power crossfade og synkroniserede Apple Music-stil lyrics, der kører lokalt på brugerens enhed med YouTube som lydkilde.
```

---

## §1 Produkt-identitet
*   **Retning:** Elva er en **Premium Lydafspiller (Playback Client)**, ikke en streaming-klient. YouTube bruges som rå lydkilde i baggrunden. Brugeren skal forvente en fokuseret afspilningsoplevelse frem for et komplet musikbibliotek.

---

## §2 V1 — Hvad SKAL med
Fokus er på den uforstyrrede afspilleroplevelse:
*   **Player Core:** Equal-power crossfade (0-12s, trigonometry fade) og buffering sync.
*   **Lyrics:** Floating lyrics (side-by-side på desktop, 1.4s 3D flip på mobil) med klik-spoling (interactive scrubbing) og Safari-kompatibel scroll-fade.
*   **Visuals:** Muted farveekstraktion fra covers (8-22% mætning) i WebGL-baggrunden.
*   **Search & Queue:** Søg og "Up Next" kø-styring i sidepanel.
*   **Local Library:** Gem favoritter (likes) og opret simple playlister i `localStorage`.
*   **Mini-Player:** Den svævende glaspille i bunden af landing-page til baggrundskontrol.
*   **Basic Settings:** Kun kernefunktioner (volumen, crossfade-sekunder, accentfarve). Avancerede indstillinger er *ikke* et V1-krav.

---

## §3 V1 — Hvad udelades (Uden)
*   **Discover / Live Charts:** Skjules helt i V1 for at undgå API-skrøbelighed.
*   **Rigtige Artist Profiler:** Skjules/simplificeres drastisk. Ingen fuld diskografi eller biografi.
*   **Landing Page:** Forenkles til primært søg + recents. Fuld 3-sektions scroll er ikke et V1-krav.
*   **Cloud Sync / Konti:** Alt gemmes lokalt.
*   **Rescue Shop / Spil-elementer:** Findes ikke i denne kodebase (hvis rester fra andre projekter findes, skjul dem).

---

## §4 Kunstnerprofiler — "Good enough"
*   **Forventning:** Vi lover **IKKE** en komplet discografi i V1.
*   **Løsning:** Ved klik på en artist søges efter kunstnerens Topic-kanal (`"Artist - Topic"`). Vi henter de seneste 10-15 uploads og præsenterer dem som en simpel "Seneste udgivelser"-række, gemt i en 48-timers diskograficache (`discographyCache.ts`).

---

## §5 UI-prioriteret Backlog (Zone A–D)
*   **Zone A (Rør ikke):** Afspiller (`MusicPlayer.tsx`), cover-card, lyrics scrubbing, lyd-crossfade.
*   **Zone B (Forbedr til V1):** LandingPage navigation flow, Mini-Player pille, søgefelt-UX, drag & drop lokale filer.
*   **Zone C (Simplificer drastisk):** `ProfileHubView.tsx` (omdan til et simpelt "Favorites & Playlists"-bibliotek).
*   **Zone D (Skjul / Polish-later):** Discover/Live charts, point/mønt-butik, fuld 3-sektions scroll.

---

## §6 App.tsx Refactor-plan
Fjern state fra `App.tsx` (~1.464 linjer) i denne rækkefølge:
1.  `LibraryContext.tsx` (State for likes, playlister, historik) — **Før launch (Vigtigst)**.
2.  `useScrollOrchestrator.ts` (Scroll- og WebGL-transitioner) — **Før launch**.
3.  `VolumeHUDOverlay.tsx` — **Før launch** (Bemærk: `GlobalVolumeHUD.tsx` er *delvist done*).
4.  `LandingSearchSection.tsx` (Søge-state og debouncing) — **Efter launch**.

---

## §7 Reddit-checkliste
*   [ ] Lydovergange (crossfade) er 100% klikfri og buffer synkroniseret.
*   [ ] Ingen uvirksomme knapper eller tomme faner i UI'et.
*   [ ] Taktil respons på taster (Spacebar, Q, osv.) fungerer uden browser-fokusfejl.
*   [ ] Safari scroll-fade og blurs ser rigtige ud.
*   **Reddit Strategi:** Post på r/frontend, r/design, r/reactjs. Tone: Ydmyg, design-fokuseret ("I built this local audio player with WebGL and Apple-style lyrics"). Skriv *ikke*, at det er en gratis Spotify-kopi eller at den hacker YouTube.
*   **Heuristik-forventning:** Skriv "best-effort YouTube matching, ikke Spotify-præcision".

---

## §8 30 sek demo-video storyboard
*   **0-5s:** Landing Page. Der søges på en sang, og Mini-Playeren i bunden viser aktivitet.
*   **5-15s:** Scroll ned til fuldskærms-player. WebGL-baggrunden morfer blødt. Coveret tilter ved hover.
*   **15-20s:** Tryk på 'L' (lyrics). Teksten glider ind fra højre (desktop side-by-side). Der klikkes på en linje 30 sek fremme, og sangen spoler øjeblikkeligt.
*   **20-30s:** Åbn køen, træk en ny sang ind, og vis den glatte crossfade-overgang, hvor WebGL-farverne flyder langsomt sammen.
*   *Anbefalet sang:* En kendt sang med et farverigt cover og gode LRC-lyrics (fx Daft Punk - Get Lucky).
*   *Vis IKKE:* Indstillinger, ufuldstændige kunstnerprofiler eller tomme playlister.

---

## §9 Ugesplan (5–10 timer/uge efter ferie)
*   **Uge 1 (Fokus: Zone B & C):** Ret Mini-Player positionering, poler navigation, og simplificer `ProfileHubView.tsx`. (2-4 timer).
*   **Uge 2 (Fokus: Refactor):** Udfør refaktorering af `LibraryContext` og `useScrollOrchestrator` fra `App.tsx` (6-8 timer).
*   **Uge 3 (Fokus: Zone D & Test):** Skjul alle charts/discover-elementer, test på Safari og Windows. (2-4 timer).
*   **Uge 4 (Reddit Launch):** Optag 30 sek demo-video og lav posts.
*   *God nok til Reddit:* Realistisk efter **3 ugers fokuseret arbejde**.

---

## §10 Beslutninger der er låst vs åbne
*   **Låst:** Elva = audio-player, Discover/Charts er skjult, ingen cloud-databaser.
*   **Åbne:** Electron release vs. ren web demo, monetization (tip jar / donationer), kunstner-række (skjule helt vs. "good enough" uploads).

---

## §11 Første dag efter ferie (3 timers session)
1.  **Åbn projektet og start dev-miljøet** (`npm run dev`).
2.  **Skjul charts/discover fanen** helt fra landing-page navigationen.
3.  **Flyt `GlobalVolumeHUD.tsx`** helt ud af `App.tsx` render-træet.
*   *Lille momentum win:* Visualiseringen af, at discover-siden er væk, og interfacet nu føles 100% færdigt og rent.
