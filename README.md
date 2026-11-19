# Leonida Legend — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/tranquilnaturevista-code/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/tranquilnaturevista-code/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

The best offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a checklist saved in your browser, export and import of your progress, filters by kind and grade, a spoiler setting that hides the story trophies until you earn them, a six-stage roadmap to the platinum, flags for the missable trophy, and a guide to each trophy written for this entry, with its sources named beside it. Pure static HTML, CSS and vanilla JavaScript — no network requests, no uploads, no accounts. All artwork is original CSS; there is no Rockstar logo or official artwork anywhere.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. It works with the network off: every file it loads lives under `app/`.

## Features

- **All 55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze; 27 visible, 28 hidden — with the official names, descriptions and grades as published on PlayStation (listed by Exophase and PSNProfiles, 18 Nov 2026).
- **Tracker** — tick a trophy off and it stays ticked (localStorage). Export your progress to a file and import it back on any machine. Progress by grade and by kind, with a progress bar.
- **Filters** — by kind (story, collectibles, activities, platinum, missable), by grade, by earned/remaining, plus text search across names, descriptions and guides.
- **Spoiler setting** — hides the names, descriptions and guides of the 28 hidden trophies until you earn them. Off by default for the checklist, one click to hide them.
- **Roadmap to the platinum** — six stages in the order to play them (story, partner jobs and robberies, activities and skills, collectibles and exploration, money and properties, odd jobs and cleanup), each listing its trophies and your progress in that stage.
- **Missable flags** — Positive Mental Attitude is the only trophy the published guides flag as possibly missable (a Chapter 1 meditation spot disappears after that chapter). The guide says so, and the roadmap tells you to keep a manual save at the start of every chapter, because GTA VI has no mission replay.
- **A guide per trophy, in our own words, with sources** — what to do, where and how, and when it can be missed, with the source of each fact named beside it (GTABase, Planet GTA 6, Output Lag, KeenGamer, EGamers, GTA Vibes, GTA Vice City Hub). Where no published guide has confirmed a method yet (19 Nov 2026), the guide says so instead of inventing one.
- **Honest about the launch** — about 200 hours to the platinum at difficulty 4/10 (PowerPyx), a story of around 60 hours (VGC, Push Square), no online trophies, no difficulty trophies, one playthrough enough, cheats disable trophies and saving.

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself.
- `app/data/trophies.json` — the 55 trophies: official name, description, grade, hidden flag, kind, missable flag, roadmap stage, and the guide with its sources.
- `main.ts` — hands the guide in: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` (run it with `MAKEFUN_OUTPUT_DIR=out node main.ts` outside the grader).
- `screenshots/` — four real renders of the running app, taken with headless Chromium.
- `shots.json` — which views the screenshots were taken of.
- `serve.ts` — a tiny static server for trying the guide locally.

---

<sub>Entered on [make.fun](https://make.fun/?ref=hftc77mr&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
