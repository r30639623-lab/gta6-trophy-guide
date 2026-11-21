[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/r30639623-lab/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/r30639623-lab/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI, 55 PS5 trophies

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze), built for [make.fun's gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **Every trophy** with its official name, description and grade exactly as PlayStation publishes them, plus a guide in plain words that says what to do, where and how, and when it can be missed. Every guide is broken into numbered steps and every step carries refs to a numbered source list — **120 claims cited, 120 backed by 2+ sources, from 42 pages across 31 sites**.
- **Tracker**: tick trophies off and progress is saved in the browser (localStorage), count trackers for the counted trophies (meditations, cards, WAiNK…), a next-up list in roadmap order, export progress to a file and import it back, reset when you want a fresh run.
- **Filters**: story, missable, collectibles, activities, online — plus grade filter and text search.
- **Spoiler-free mode**: hides the names, descriptions and guides of story trophies until you tick them earned. 28 of the 55 are hidden on PlayStation until earned; this guide marks them HIDDEN.
- **Roadmap to the platinum** in five stages with hours and difficulty per stage — story first, strangers and side missions, activities and races, collectibles and counts, then crime, money and the 100% completion cleanup. About 200 hours in total.
- **Missables tab**: a missable-windows grid for the 9 trophies to watch (1 possibly missable, 8 watch), story gates chapter by chapter, and disputes shown both ways with our call. Only one trophy can be missed: **Positive Mental Attitude** (one meditation spot is only open in Chapter 1).
- **Sources tab**: the numbered source list and a trophy × source matrix showing which sources back which trophy.
- **Fully offline**: static files under `app/`, no build step, no network request at run time. Serve `app/` with any static server and open `index.html`.

## Sources & honesty

Official names, descriptions and grades are as PlayStation publishes them (Exophase and PSNProfiles trophy lists, 18 November 2026). Guide methods draw on published post-launch guides — PowerPyx, KeenGamer, The Games Wiki, GTASnaps, TechForNerd, HappyGamer, Mobalytics, CryptoGames, Sixshore, GTABase, GTA Scoop and HowToVideoGame — each cited by number beside the step that uses it. No guide text here is copied from another guide.

The game released 19 November 2026 and guides are still confirming a few unlocks. Where a method is unconfirmed (Personal Best, Actions Speak Louder, Bad Luck, I Guess, The Truth Is Out There, Ten Pin, and parts of Baited My Tackle and Challenging Tank), the guide says so instead of guessing. All 55 trophies are offline and single-player; there are no online trophies. Cheats disable trophies and saving, so leave cheats off for a trophy run (reported by GTABase and PowerPyx). Guides estimate about 200 hours for the platinum.

## Run it

```sh
node serve.ts        # serves app/ at http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # hands the guide in
```

Node 22, standard library only, no network. Two runs write byte-identical output. An unofficial fan guide, not affiliated with Rockstar Games: no Rockstar logo, artwork or game images are used.
