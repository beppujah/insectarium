# Insectarium

An exploration game: you are the size of an ant. Pick a place on the map (a meadow with its pond and tunnels, a desert, a jungle) and search it for the species that live there. Approach them and observe them to fill in your field notebook. The game is currently in Italian (title in game: *Insettario*).

Play it at **https://beppujah.github.io/insectarium/**. Runs in the browser on desktop and mobile, with keyboard, touch or a MIDI controller (knobs and pads, with MIDI learn).

On a phone it can be installed like an app: on iPhone tap **Share → Add to Home Screen**, on Android open the browser menu and tap **Install app** (or **Add to Home screen**). It then opens full screen and also works offline; photos and voice clips are kept on the device the first time they are shown. The installed app keeps its own saves, separate from the browser.

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
public/               copied as is to the site root
  manifest.webmanifest name, colours and icons of the installed app
  sw.js               service worker: offline copy of the game
  *.png               app icons (drawn by tools/make-icons.py)
src/
  main.js             startup: the map of the worlds, loads the save, builds the world
  style.css
  content/
    worlds.js         the worlds (meadow, desert, jungle): levels, texts, current world and its species
    species.json      all species: world, name, habitat, behaviour, facts, Wikipedia entry, photos
    photo-credits.json author and license of every photo
    photos.js         bundled photos and their credits
  assets/photos/      the photos (<species>-1.jpg … -3.jpg)
  core/
    util.js           $, clamp, lerp, rng, noise
    loop.js           main loop: movement, physics, levels, HUD
    save.js           saving to localStorage, one save per world
  input/
    controls.js       virtual knobs/buttons, MIDI learn, controller screen
    keyboard.js
    touch.js          on-screen joystick and buttons
  world/
    constants.js      map size, cell types and their properties
    level.js          level state, generation of meadow, pond and tunnels
    textures.js       procedural textures (meadow)
    style.js          textures and plant heights of the desert and the jungle, swapped in when the world changes
    sky.js            clouds and distant horizon of each world
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
  make-icons.py       draws the app icons in public/ (needs Python with Pillow)
```

Shared game state lives in the `G` object in `world/level.js`; control values are in `ctl` (`input/controls.js`).

## Adding a species

1. Add an entry to `src/content/species.json` (unique `id`; `world`: `prato`, `deserto` or `giungla`, default `prato`; `levels`, or `under`/`both`, for the habitat).
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

## Worlds

The start screen is a map with three places. The meadow (18 species) has a pond and tunnels underground;
the desert (7 species) has dunes, rocks and cacti and a level under the sand; the jungle (7 species) has ferns, mossy trunks
and a pool. Each world has its own textures, sky, ground and save; the "Cambia mondo" button goes back to the map.

## Look and feel

- Finer pixels by default (the "Grana dei pixel" control still goes back to the chunky look).
- Grass of varying heights, bases that fade into the soil, and light through the blades when facing the sun.
- Plants are crossed planes through their cell (grass, clover, reeds, algae) or a plane that always faces you (flowers),
  so they read as tufts from every side instead of boxes.
- Detailed procedural textures: tapered grass blades with seed heads, trefoil clover, round barked twigs, lit stones
  with lichen, a crumb-built ant hill, a fly agaric with gills, soil crumbs lit from above.
- Fallen twigs are real cylinders, intersected pixel by pixel, with bark wrapping around and cut ends showing growth rings.
- Insect sprites are drawn at 128×128: segmented bodies lit from above, jointed legs, compound eyes, veined translucent wings.
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
