# Matchflow

Matchflow is a soccer tracking playback and clip-making interface for the US Soccer × ColorStack Tech League. It is designed for the familiar **watch → scrub → clip → share** flow. The first screen makes the next step clear: open a demo match, choose a locally prepared SkillCorner match, or load a local tracking file.

## Run the app

```sh
npm install
npm run dev
```

If no local SkillCorner manifest is present, Matchflow offers three generated demo matches. The mock source uses the same normalized frame model as real tracking and exercises playback, scrubbing, player selection, clip creation, suggestions, annotations, and sharing.

## Use another SkillCorner match

SkillCorner Open Data keeps a `matches.json` manifest and, for each match, a match metadata JSON file plus an extrapolated tracking JSONL file. Tracking is at 10 fps; player and ball coordinates use meters with the pitch center as the origin. Match metadata includes team IDs, player IDs, jersey numbers, names, and match periods. See the [official SkillCorner data documentation](https://github.com/SkillCorner/opendata#documentation).

The app reads local files only; it does not download the repository on each launch. To prepare one match (example ID `1925299`) without checking the dataset into this project:

```sh
git lfs install
GIT_LFS_SKIP_SMUDGE=1 git clone https://github.com/SkillCorner/opendata.git ../skillcorner-opendata
cd ../skillcorner-opendata
git lfs pull --include="data/matches/1925299/1925299_tracking_extrapolated.jsonl"
mkdir -p ../teamy/public/data/matches/1925299
cp data/matches.json ../teamy/public/data/matches.json
cp data/matches/1925299/1925299_match.json ../teamy/public/data/matches/1925299/
cp data/matches/1925299/1925299_tracking_extrapolated.jsonl ../teamy/public/data/matches/1925299/
```

Replace `1925299` with another match ID and pull/copy that match’s two files to switch games. For a tidy selector, keep only the match entries you have prepared in `public/data/matches.json`. The directory is git-ignored, so tracking data stays out of the application repository. The chooser discovers matches from the local manifest; if files for a listed match are missing, the loader shows which path to provide. The local file button also accepts a single SkillCorner `.jsonl` or `.json` export (without lineup metadata, it uses generic player labels).

## Technical design

```text
SkillCorner manifest + selected match files
  → services/matchLoader.ts
  → parsers/skillcornerParser.ts + match metadata join
  → normalized TrackingFrame[]
  → playback, suggestions, clips, analyst state
  → SVG pitch and timeline
```

- `parseSkillCornerMatch()` maps vendor frame/player fields, joins names, teams, and jersey numbers from match metadata, converts centered coordinates to a lower-left pitch origin, and normalizes timestamps to match-relative seconds.
- `TrackingFrame` and `TrackingPlayer` are the visualization contract. The viewer does not read SkillCorner’s raw schema. Mock, local-file, and prepared-directory sources all end at this same contract.
- `derivePhysicalMetrics()` calculates speed when absent and cumulative distance for each player. The speed overlay flags sprints at 7.2 m/s.
- Match names, IDs, team names, and team IDs come from the selected match. There is no fixture-specific pitch rendering logic.
- The local match service can be replaced with a FastAPI/Flask API later without changing the field or clip UI.

## Analyst features

- **Team shape:** a current-position hull and inferred back line for each team.
- **Speed and distance:** live player speed, cumulative distance, and sprint markers.
- **Suggested moments:** tracking-derived sprint and fast entry-to-final-third candidates. Each can be reviewed or loaded into the clip creator.
- **Pitch annotations:** pause, draw an arrow or circle, then save it with the clip. Clip playback restores those marks.
- **Clip sharing:** links carry `/match/:id?start=...&end=...`; a prepared local match with that ID opens at the same range.

Clips are currently stored in memory for this UI phase. A later backend can persist clips and serve an authorized game list while keeping the same browser-facing normalized contract.
