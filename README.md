# Insectarium

An exploration game: you are the size of an ant and search a meadow, its pond and the tunnels underneath for 18 species. Approach them and observe them to fill in your field notebook. The game is currently in Italian (title in game: *Insettario*).

Play it at **https://beppujah.github.io/insectarium/**. Runs in the browser on desktop and mobile, with keyboard, touch or a MIDI controller (knobs and pads, with MIDI learn).

## Commands

```
npm install          # first time only
npm run dev          # dev server with hot reload (http://localhost:5173)
npm run build        # regular build in dist/ (what GitHub Pages serves)
npm run build:single # one self-contained dist/index.html that also opens with a double click
npm run typecheck    # type checking (for modules already converted to .ts)
```

Requires Node.js 20 or newer. Every push to `main` is built and published to GitHub Pages by `.github/workflows/deploy.yml`.

## Structure

```
index.html            markup for screens, HUD and touch controls
src/
  main.js             startup: loads the save, builds the world, wires up the buttons
  style.css
  content/
    species.json      the 18 species: name, habitat, behaviour, fact, Wikipedia entry, photos
    photo-credits.json author and license of every photo
    photos.js         bundled photos and their credits
  assets/photos/      the photos (<species>-1.jpg … -3.jpg)
  core/
    util.js           $, clamp, lerp, rng, noise
    loop.js           main loop: movement, physics, levels, HUD
    save.js           saving to localStorage
  input/
    controls.js       virtual knobs/buttons, MIDI learn, controller screen
    keyboard.js
    touch.js          on-screen joystick and buttons
  world/
    constants.js      map size, cell types and their properties
    level.js          level state, generation of meadow, pond and tunnels
    textures.js       procedural textures
    sky.js            cloud and distant-meadow panorama
    creatures.js      insect sprites and behaviour
    portals.js        passages between meadow, tunnels and pond
  render/
    raycaster.js      3D raycasting renderer
    minimap.js
  game/
    actions.js        observe, jump, photo, toasts, catalog
  ui/
    notebook.js       the field notebook
    gallery.js        the 3 photos shown on first observation (game paused)
  audio/
    audio.js          WebAudio synthesized sounds
    voice.js          narration with the browser's speech synthesis
tools/
  fetch-photos.mjs    downloads the photos from Wikimedia Commons with author and license
```

Shared game state lives in the `G` object in `world/level.js`; control values are in `ctl` (`input/controls.js`).

## Adding a species

1. Add an entry to `src/content/species.json` (unique `id`; `levels`, or `under`/`both`, for the habitat).
2. Draw its sprite with `sprite('<id>', x => { ... })` in `world/creatures.js`.
3. Download its photos: `node tools/fetch-photos.mjs <id>`.

## Photos

Each species has 3 photos from Wikimedia Commons, bundled with the project: the game never goes online.
They appear one after another the first time a species is observed (click, tap, any key or Observe to advance; Esc closes)
and can be viewed again from the notebook.

```
node tools/fetch-photos.mjs            # fetch missing photos
node tools/fetch-photos.mjs --dry      # list the images it would pick, without downloading
node tools/fetch-photos.mjs ape rana   # re-fetch only these species
```

Only free licenses are accepted (CC0, public domain, CC BY, CC BY-SA; no GFDL, NC or ND).
Automatic picks come from the species' Wikipedia articles and are not always right, so most species
have hand-picked files in `species.json` (`"photos": ["File:Name.jpg", ...]`).
Authors and licenses are stored in `src/content/photo-credits.json` (shown in the game) and in `CREDITS.md`.

## Look and feel

- Finer pixels by default (the "Grana dei pixel" control still goes back to the chunky look).
- Grass of varying heights, bases that fade into the soil, and light through the blades when facing the sun.
- Grass, flowers, clover and reeds can be walked through (a little slower); fallen leaves lie flat on the ground.

## Narration

When a species is observed for the first time, each photo comes with its own fact (`facts` in `species.json`,
one per photo, matched by file name) read aloud in Italian. Recorded clips in `src/assets/voice/` are used when present:
`nuova-specie.m4a`, `<id>-name.m4a` and `<id>-1.m4a` … `<id>-3.m4a`. Any line without a recording falls back to the
browser's speech synthesis (Web Speech API, no network). The voice can be switched off with the gallery's
voice button; the choice is remembered.

## Roadmap

- Gradual conversion of the modules to TypeScript (`.js` → `.ts`, one at a time).
- PWA (manifest, icons, service worker), then Capacitor for Android and iOS.
- Translations (it, en, cs): UI text still lives in the code and in `index.html`.

## License

Code: not yet licensed (all rights reserved). Photos: see `CREDITS.md`.
