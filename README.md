# ADIBA CHASE — Dhaka Love Run 2.0

A static Three.js endless-runner project, ready for Netlify or Vercel.

## Run locally
Use a local static server (ES modules require HTTP):
- `python -m http.server 8080` from this folder, then open `http://localhost:8080`
- Or use VS Code Live Server.

Three.js is loaded from jsDelivr (`three@0.160.0`), and Google Fonts are optional enhancements. The game itself has no backend dependency.

## Controls
- Left / Right arrows or A / D: change lanes
- Up / W / Space: jump
- Down / S: slide
- Escape: pause / resume
- Mobile: swipe left/right/up/down

## Deploy to Netlify
1. Extract the ZIP.
2. In Netlify, choose **Add new site → Deploy manually** and drag the `adiba-chase` folder, or connect the Git repository.
3. No build command is needed. Set the publish directory to `.` if the project root is `adiba-chase`.

## Deploy to Vercel
1. Import the repository or upload the project through your preferred Git workflow.
2. Set Framework Preset to **Other**.
3. Set the Root Directory to `adiba-chase` (if the repository contains the parent folder).
4. Leave Build Command empty; set Output Directory to `.`.

## Notes on this upgrade
- Replaced capsule-only people with articulated procedural characters, facial features, outfit details, backpack straps and Adiba's black-and-gold traditional styling.
- Added synchronized procedural leg, knee, arm, torso and head movement while running.
- Brightened the lighting, fog and city palette; enhanced traffic obstacle details.
- The newspaper now captures the live WebGL game frame at the catch moment and displays it in the article instead of emoji art.
- Existing lane, swipe, keyboard, score, coin, pause, chase and newspaper flows are retained.

## Known limitations
This is a procedural art upgrade, not a studio-authored character production. The supplied reference is retained in `assets/character-reference.png`; no external rigged GLB files or motion-capture clips were included in the source ZIP. Cloth simulation, full facial blendshapes, detailed independently animated traffic actors, licensed audio and automated cross-device browser QA still require dedicated assets/device testing. The current procedural characters are rig-like joint hierarchies rather than imported skinned GLTF skeletons.


## 2.1 mobile render hotfix
This build makes the WebGL canvas opaque, sets an explicit sky clear color, adjusts the gameplay camera framing for portrait phones, and gives the canvas an explicit stacking layer. If the scene is still blank after redeploying, check the browser's WebGL support and the JavaScript console; this patch cannot fix a device/browser where WebGL is disabled.
