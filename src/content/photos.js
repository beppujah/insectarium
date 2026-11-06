import CREDITS from './photo-credits.json';

// photos bundled with the project (downloaded with tools/fetch-photos.mjs):
// the game never contacts Wikipedia while playing
const FILES = import.meta.glob('../assets/photos/*.{jpg,png}', { eager: true, query: '?url', import: 'default' });

/** Photos available for a species: [{src, author, license, licenseUrl, page, file}] */
export function photosFor(id) {
  const list = Array.isArray(CREDITS[id]) ? CREDITS[id] : [];
  return list.map(c => ({ ...c, src: FILES['../assets/photos/' + c.local] })).filter(p => p.src);
}
