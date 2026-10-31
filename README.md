# ADIBA CHASE — Dhaka Love Run

A playable browser-based 3D endless-runner prototype built with Three.js. It includes three-lane movement, jump/slide controls, traffic obstacles, coin pickups, a chase-pressure system, Bangla dialogue bubbles, a catch sequence, and a generated newspaper ending.

## Run locally
Because this project uses JavaScript modules, serve it over HTTP rather than opening `index.html` directly.

```bash
python -m http.server 8080
```
Open `http://localhost:8080`.

## Deploy to Netlify
1. Extract the ZIP.
2. In Netlify, choose **Add new site → Deploy manually**.
3. Drag the extracted `adiba-chase` folder into the deploy area.
4. Or connect the folder's Git repository. No build command is required; publish directory is `.`.

## Deploy to Vercel
1. Push the extracted folder to a Git repository.
2. Import the repository in Vercel.
3. Framework preset: **Other**.
4. Build command: leave blank. Output directory: `.`.
5. Deploy.

## Controls
- Left / A: move left
- Right / D: move right
- Up / W / Space: jump
- Down / S: slide
- Mobile: swipe left, right, up, or down
- Escape / pause button: pause

## Character reference
Your uploaded image is included at `assets/character-reference.png` as a visual reference. The current build uses stylized procedural 3D characters, not a photogrammetry model. To make the characters closely resemble the people in the reference, replace the procedural models with licensed/custom rigged GLB character models and matching animations.

## Notes
- Three.js is loaded from jsDelivr, and fonts are loaded from Google Fonts. The first load therefore requires an internet connection.
- Scores and best score are stored in browser LocalStorage.
- This is a complete playable prototype, not a Subway Surfers-scale production. Voice acting, detailed custom character models, advanced traffic AI, missions, and online leaderboards are not included yet.
- Use original or properly licensed audio and 3D assets before public commercial release.


## Version 3.0 upgrade
- Uses the original working renderer, camera, game rules and requestAnimationFrame loop as its foundation.
- Adds a detailed player and Adiba character model with articulated arms and legs.
- Adds safe, guarded character run-cycle animation to avoid undefined body-part errors.
- Adds pedestrians along both sidewalks.
- Adds moving background traffic on the outer service strips and rotating wheels on moving obstacles.
- Adds a visibility timing reset for mobile browser tab switching.

This project uses Three.js from jsDelivr and therefore needs an internet connection.
Test on the target Android browser before replacing a production deployment.

## Version 4.0 (core upgrade)
- Fixed: road, lane markings and buildings now scroll (the world was static, so runners looked stationary).
- Fixed: characters now face -Z (the running direction) and feet touch the ground.
- Fixed: blank background (sky colour + fog set, ground extended).
- Fixed: single guarded rAF loop with try/catch, auto-pause on tab hide / WebGL context loss, clock reset on return.
- New: pooled, recycled road segments (6 x 30 m) with random buildings, shop awnings, trees, streetlights.
- New: 5 Dhaka areas (Main Road, Old Dhaka, Commercial, Residential, Market) switching every 300 m.
- New: Bangla poster textures on building walls.
- New: pedestrians scroll and walk; side traffic moves in correct directions with spinning wheels.
- New: randomised Bangla newspaper ending using a real screenshot of the final frame.
- Not yet done: sound/mute, detailed vehicle models, pedestrian types, meme events, share button.
- Not browser-tested (no network in the build sandbox): only a JS syntax check was run.


## Version 5.0 — Stage 1 (wallet, jetpack, accounts)
Backups: `backup_v4_0/` (v4.0) and `backup_v5_0_partial/` (the 5.0 you uploaded before this stage).

**Changed**
- Wallet: **1 coin = ৳100** (was 100 coins = ৳1). HUD shows Coins, MONEY ৳ (this run) and WALLET ৳ (saved total). "+৳100" floats up on every pickup.
- Jetpack: every **10 coins collected in a run** = 1 charge ("JETPACK UNLOCKED! / ভাই, এবার আকাশে উড়ার পালা!"). **Double-tap** (or **F**) flies for exactly **10 s** with a visible 10→1 countdown, flame and smoke puffs. Afterwards the character descends smoothly, squashes slightly on landing, gets ~0.6 s grace, then normal running/collisions resume. Score and run are not reset. Ground coins are not collected while flying.
- Accounts: username + password **Register / Log in / Log out**, show/hide password, validation, case-insensitive unique usernames, saved stats per account. Old auto-generated accounts still log in.
- Fix: the leaderboard tab handler was also bound to the new auth tabs; it is now scoped to the leaderboard.

**Account security (important)** — local accounts live in this browser's localStorage only. Passwords are never stored in plaintext (salted SHA-256 when `crypto.subtle` is available, i.e. HTTPS/localhost; weak fallback hash on plain HTTP). This is a demo, not secure authentication, and the leaderboard is local, not global. Real accounts/global rankings need a backend (hashed passwords with Argon2/bcrypt, server-side score validation). Passwords are intentionally *not* required to be unique across players — that would reveal other players' passwords.

**Debug:** `?testwallet=50` grants 50 lifetime coins to the logged-in local account.


## Version 5.0 — Stage 2 (leaderboard + full-scene newspaper)
- **Leaderboard** (local, this device only — labelled as such): top 10 sorted by highest score (ties → distance), 🥇🥈🥉 medals, one row per account (no duplicates), your row highlighted with "(তুমি)" and appended with your rank if you're outside the top 10. Each row: username, rank, highest score, highest distance, total coins, total taka, completed runs. Daily / Weekly / All-time tabs. Updated after every finished run.
- **Newspaper:** the real final renderer frame is shown with `object-fit: contain` (whole frame, never cropped or stretched; the paper scrolls if the screen is short). Headline, sub-headline, 4-paragraph article and photo caption are assembled from large template pools (conditional on jetpack use, coins, distance, and the vehicle that hit you); the last 6 headlines are never reused. Includes username, score, distance, coins, taka earned, wallet, jetpack usage (times + seconds) and date/time. Buttons: Play Again, Main Menu, Leaderboard, Share (Web Share, else PNG download; the PNG also uses contain-fit).
- **Fixes:** leaderboard × button was covered by the top bar on phones; in-run banners/toasts no longer draw over the newspaper.

## Version 5.0 — Stage 3 (winding roads)
- **How it works:** `src/road-path.js` generates an endless road centreline from a smooth curvature profile (gentle left/right, long winding, S-bends, serpentine runs, occasional sharper bends; every curve eases in/out of a straight; first 150 m always straight; max curvature radius ≈ 150 m; heading kept within ≈ ±52°). `src/bend.js` patches every material's vertex shader (including the shadow depth pass) so the whole world is displaced sideways by that curve. Because it is one shared function of distance-ahead, **road surface, lane marks, edge lines, sidewalks, buildings, props, traffic, pedestrians and coins all follow the same continuous curve** — no gaps between recycled segments. The player's lane logic/collision stays on straight lanes, so difficulty is unchanged; the camera looks smoothly (damped) into the bend.
- Road/sidewalk meshes are subdivided along their length so they bend smoothly. The ground plane is deliberately not bent.
- **Safety net:** if a phone's GPU rejects the patched shader, the game switches the bend (and shadows) off and keeps running. `?nobend=1` in the URL disables it manually.

## Version 5.0 — Stage 4 (audio, voice, memes, textures, vehicles)
- **Sound** (all synthesized at runtime — no audio files to license): coin reward ting + cartoon boing, jump/slide/land, footsteps, rickshaw bells, car/bus/truck horns, motorcycle pass-by, jetpack engine loop, meme stingers (boing, sad trombone, bruh, airhorn), unlock fanfare, bump, game-over sting, plus a procedural bazaar-style music loop. Audio starts only after a tap (mobile autoplay rules), suspends on pause/tab switch and resumes cleanly.
- **Settings** (🔊 button, also reachable from Pause): sound, voice, music on/off and volume; saved on the device.
- **Funny Bangla voice:** ~35 lines in 9 categories (coin, near miss, jump, slide, jetpack, land, caught, hit, pedestrians). One voice at a time, global gap + per-category cooldowns, random non-repeating selection, and important lines (near miss, jetpack, caught) can cut in on minor ones. Lines are always shown as a caption bubble and are spoken with the **device's Bangla text-to-speech voice if one is installed**. ⚠ I could not generate or ship recorded voice actors; to use real recordings, add original/licensed files to `assets/audio/voice/` and list them in `manifest.json` (instructions inside the file).
- **Near-miss system:** passing a vehicle within one lane-gap gives +15 score, a voice line and a meme.
- **Memes:** short original emoji + Bangla-caption cards (near miss, big money, jetpack, shopkeeper/pedestrian gags, landing). 6 s cooldown, never the same one twice in a row, placed in its own slot below HUD/caption so it never covers the runner, road or controls; pedestrians throw their arms up and hop when a pedestrian meme fires.
- **Textures** (procedural canvas, no downloads, 20 shared textures ≈ 0.5 M pixels total, each ≤ 256 px except 768×64 shop-sign strips): asphalt with grain, cracks, tyre marks and a repair patch; concrete paving; brick and weathered painted walls with world-scale UVs (bricks stay the same size on every building); alpha-tested windows with balcony rails; ribbed shop shutters; shop-name awnings in Bangla; fabric, skin and hair maps on the characters; paint-flake bodywork and tread on tyres; striped barriers and round speed signs.
- **Street objects:** edge lines, benches, dustbins, traffic signs, barriers, shutters, rooftop water tanks (plus the existing lamps, trees, stalls, posters).
- **Vehicles:** added the **delivery van** (now moto, car, bus, truck, CNG, rickshaw, van, barrier).
- **Draw calls:** stage 3/4 add up to ~150 small meshes across the 6 recycled segments (roughly half visible at any time). I could not measure frame rate on a phone — if an older Android struggles, hide the props in `buildSeg` first.

## Tests (what was actually run)
Run in headless Chromium with a stub in place of three.js (the sandbox has no network), plus real WebGL2 for shader checks:
- **Stage 1–2 suites:** 35 + 32 checks (accounts, wallet, jetpack timing, leaderboard, newspaper fit/no-crop, share PNG, headline variety).
- **Road path unit tests:** 18 checks over 20 random roads × 30 km (no kinks, bounded turns, all road types, recycling equals untrimmed, bounded memory).
- **Shader tests (real WebGL2):** the bend GLSL compiles and links, and its output matches the JS reference to < 1 mm at 84 sample points.
- **Stage 3–4 browser suite:** 74 checks (shader patch wiring, audio gesture gating, settings persistence, voice cooldown/priority, sound events, near miss, horns, memes layout on a 390 px phone, pause/resume audio, swipe controls, all vehicle types, texture budget, fallback, play-again).
- **Not tested (needs your phone):** actual 3D appearance of the bend/textures, the real three.js shader chunk compile (my GLSL was validated against a mock of three's prelude), frame rate/battery, Bangla TTS quality, and real touch feel.

## Earlier 5.0 notes (superseded where they conflict with Stage 1 above)
- Moving traffic: motorcycle, car, bus, truck, CNG, rickshaw (multi-part models, glass, head/tail lights, bumpers, spinning wheels). They travel the same direction as the player at their own speed (3-14), spawn at the fog edge, and a spawn rule prevents lane overlap.
- Virtual BDT wallet: 100 coins = ৳1 (integer maths, 1 coin = 1 paisa). Fictional currency, not real money.
- Jetpack: unlocks at 100,000 total coins (৳1,000). Double-tap (or F key) flies for 4 s, 12 s cooldown, swipe left/right still changes lanes. Debug: open `index.html?testwallet=100000` to grant a test balance on the local account.
- Local demo account + leaderboard (Daily = last 24 h, Weekly = last 7 days, All-time). Device-only (localStorage); passwords are SHA-256 + salt hashed when `crypto.subtle` is available (HTTPS/localhost), otherwise a weak fallback hash. NOT secure online authentication and NOT a global leaderboard.
- Newspaper: more headlines, no repeat in consecutive games, username/taka/date line, SHARE exports a PNG.
- Asphalt texture (procedural canvas).

### Needs a backend (not included)
Global leaderboard, cross-device accounts, server-side password hashing (e.g. Argon2/bcrypt) and server-side score validation over HTTPS.

### Not implemented
Winding/curved roads, PBR/normal-map textures, extra street props (tea stalls, garages, construction), sound beyond a jetpack beep.
