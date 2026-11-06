import ALL from './species.json';

// The worlds you can visit from the map. The meadow is the original world with 18 species;
// the others start with 7. `under` / `pond` say which extra levels a world has.
export const WORLDS = {
  prato: {
    id: 'prato', name: 'Prato', under: true, pond: true,
    levels: { surf: 'Prato', under: 'Gallerie', water: 'Stagno' },
    blurb: 'Fili d\'erba alti come alberi, un piccolo stagno e le gallerie sotto terra.',
    welcome: 'Benvenuto nel prato',
    where: { surf: ['Sul prato', 'Vive sul prato'], under: ['Sotto terra', 'Vive sotto terra'], water: ['Nello stagno', 'Vive nello stagno'] },
  },
  deserto: {
    id: 'deserto', name: 'Deserto', under: true, pond: false,
    levels: { surf: 'Deserto', under: 'Sotto la sabbia' },
    blurb: 'Dune, sassi roventi e cactus. Di giorno si nasconde quasi tutto, di notte il deserto si sveglia.',
    welcome: 'Benvenuto nel deserto',
    where: { surf: ['Tra le dune', 'Vive tra le dune'], under: ['Sotto la sabbia', 'Vive sotto la sabbia'] },
  },
  giungla: {
    id: 'giungla', name: 'Giungla', under: false, pond: true,
    levels: { surf: 'Giungla', water: 'Pozza' },
    blurb: 'Felci giganti, tronchi coperti di muschio e una pozza nella penombra della foresta.',
    welcome: 'Benvenuto nella giungla',
    where: { surf: ['Nel sottobosco', 'Vive nel sottobosco'], water: ['Nella pozza', 'Vive nella pozza'] },
  },
};

export const ALL_SPECIES = ALL;
const ofWorld = id => ALL.filter(s => (s.world || 'prato') === id);

/** The current world and its species (live bindings: importers always see the current values). */
export let world = WORLDS.prato;
export let SPECIES = ofWorld('prato');
export const speciesOf = ofWorld;

const hooks = [];
/** Run `f(world)` every time the world changes (textures, sky, colours…). */
export const onWorld = f => { hooks.push(f); };

export function setWorld(id) {
  world = WORLDS[id] || WORLDS.prato;
  SPECIES = ofWorld(world.id);
  hooks.forEach(f => f(world));
}
