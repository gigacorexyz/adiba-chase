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


## Version 5.0 (incremental upgrade of 4.0; original saved in `backup_v4_0/`)
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
