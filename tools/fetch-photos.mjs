// Downloads 3 photos per species from Wikipedia / Wikimedia Commons, with author and license.
// Usage:  node tools/fetch-photos.mjs              fetch only species that don't have 3 photos yet
//         node tools/fetch-photos.mjs --force      re-download everything
//         node tools/fetch-photos.mjs --dry        list the chosen images without downloading
//         node tools/fetch-photos.mjs ape rana     only these species (re-downloaded)
// To pick images by hand, add to the species in src/content/species.json:
//         "photos": ["File:First.jpg", "File:Second.jpg", "File:Third.jpg"]
// With fewer than 3, the rest are searched automatically; with 3, only those are used.
// Output: src/assets/photos/<id>-1.jpg ..., src/content/photo-credits.json, CREDITS.md

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPECIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/species.json'), 'utf8'));
const OUT = path.join(ROOT, 'src/assets/photos');
const CREDITS = path.join(ROOT, 'src/content/photo-credits.json');
const PER_SPECIES = 3;
const WIDTH = 800;
const UA = 'Insettario/0.1 (educational game; photo fetch script)';
// GFDL is excluded: inside an app it requires shipping the full license text
const FREE = /^(cc0|public domain|pd\b|cc[ -]by)/i;
// file names that are usually not photos of the animal
const SKIP = /map|mappa|range|areale|distribu|diagram|schema|icon|logo|flag|stamp|francobollo|skeleton|scheletro|drawing|disegno|illustra|plate|tavola|tafel|anatomy|anatomia|chart|graph|commons-|wiki|edit|question|symbol|\.svg$|\.gif$|\.tiff?$|\.webm$|\.ogg$|\.ogv$|\.pdf$|\.djvu$/i;

const args = process.argv.slice(2);
const force = args.includes('--force');
const dry = args.includes('--dry');
const only = args.filter(a => !a.startsWith('--'));

// Wikipedia's API also answers for Commons files; images are downloaded from upload.wikimedia.org
const LANGS = ['it', 'en', 'de', 'fr'];
const HOST = Object.fromEntries(LANGS.map(l => [l, l + '.wikipedia.org']));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(host, params, tries = 5) {
  const u = new URL(`https://${host}/w/api.php`);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', maxlag: '5', ...params })) u.searchParams.set(k, v);
  for (let t = 0; ; t++) {
    let r;
    try { r = await fetch(u, { headers: { 'User-Agent': UA } }); }
    catch (e) { if (t < tries) { await sleep(2000 * (t + 1)); continue; } throw e; } // flaky network: retry
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && t < tries) {
      if (t === 1) console.log('   rate limited by Wikipedia, waiting…');
      await sleep(1000 * (Number(r.headers.get('retry-after')) || 2 ** (t + 1)));
      continue;
    }
    throw new Error(`${host} ${r.status}`);
  }
}

async function download(url) {
  for (let t = 0; t < 2; t++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status !== 429) return r;
    } catch { /* flaky network */ }
    await sleep(3000);
  }
  return null;
}

// Download candidates, best first. Thumbnails may be served from thumb.wikimedia.org: the same file is on
// upload.wikimedia.org. For images narrower than the requested width the API returns the original, which is
// often refused (429) to scripts, so standard thumbnail widths below the original's are tried first.
function downloadUrls(ii) {
  const clean = u => u.replace('//thumb.wikimedia.org/', '//upload.wikimedia.org/').replace(/\?.*$/, '');
  const out = [];
  if (ii.thumburl && clean(ii.thumburl).includes('/thumb/')) out.push(clean(ii.thumburl));
  const orig = clean(ii.url);
  const m = orig.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/)(.+\/)([^/]+)$/);
  if (m) for (const w of [960, 500, 330]) if (w < ii.width) out.push(`${m[1]}thumb/${m[2]}${m[3]}/${w}px-${m[3]}`);
  out.push(orig);
  return [...new Set(out)];
}

const strip = html => String(html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// candidate files, in order of preference
async function candidates(sp) {
  const out = [...(sp.photos || [])];
  // with 3 hand-picked photos, never fall back to automatic picks (they can be wrong)
  if (out.length >= PER_SPECIES) return out;
  const title = sp.wiki[0];
  for (const lang of LANGS) {
    try {
      const j = await api(HOST[lang], { action: 'query', titles: title, prop: 'pageimages|images', piprop: 'name', pilicense: 'free', imlimit: '50', redirects: '1' });
      const p = j.query?.pages?.[0];
      if (p?.pageimage) out.push('File:' + p.pageimage);
      for (const im of p?.images || []) out.push('File:' + im.title.replace(/^[^:]+:/, ''));
    } catch (e) { console.log(`   ${sp.id}: ${lang} ${e.message}`); }
    await sleep(1000);
  }
  const seen = new Set();
  return out.filter(f => {
    const k = f.replace(/_/g, ' ');
    if (seen.has(k)) return false;
    seen.add(k);
    return (sp.photos || []).includes(f) || !SKIP.test(f);
  });
}

// metadata for several files in one request, in the same order as the candidates
async function imageInfos(files) {
  const j = await api(HOST.en, { action: 'query', titles: files.join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: String(WIDTH) });
  const norm = Object.fromEntries((j.query?.normalized || []).map(n => [n.to, n.from]));
  const byTitle = {};
  for (const pg of j.query?.pages || []) {
    const ii = pg.imageinfo?.[0];
    if (!ii || pg.imagerepository !== 'shared') continue; // Commons files only (free licenses)
    if (!/jpeg|png/.test(ii.mime) || ii.width < 400) continue;
    const m = ii.extmetadata || {};
    byTitle[norm[pg.title] || pg.title] = {
      file: pg.title,
      urls: downloadUrls(ii),
      page: ii.descriptionurl,
      author: strip(m.Artist?.value) || 'Unknown author',
      license: strip(m.LicenseShortName?.value) || strip(m.UsageTerms?.value),
      licenseUrl: m.LicenseUrl?.value || '',
    };
  }
  return files.map(f => byTitle[f.replace(/_/g, ' ')] || byTitle[f]).filter(Boolean);
}

const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, 'utf8')) : {};
fs.mkdirSync(OUT, { recursive: true });
const complete = id => Array.isArray(credits[id]) && credits[id].length >= PER_SPECIES && credits[id].every(c => fs.existsSync(path.join(OUT, c.local)));

for (const sp of SPECIES) {
  if (only.length && !only.includes(sp.id)) continue;
  if (!force && !only.length && complete(sp.id)) { console.log(`=  ${sp.id}`); continue; }
  try {
    // photos already on disk, reused if a new download of the same file fails
    const previous = new Map();
    for (const c of credits[sp.id] || []) {
      const p = path.join(OUT, c.local);
      if (fs.existsSync(p)) previous.set(c.file, { ...c, bytes: fs.readFileSync(p) });
    }
    const list = [];
    const cand = await candidates(sp);
    for (let k = 0; k < cand.length && list.length < PER_SPECIES; k += 40) {
      for (const info of await imageInfos(cand.slice(k, k + 40))) {
        if (list.length >= PER_SPECIES) break;
        if (!FREE.test(info.license) || /\b(NC|ND)\b/i.test(info.license)) { console.log(`   ${sp.id}: skipping ${info.file} (${info.license})`); continue; }
        if (dry) { list.push({ local: '-', ...info }); console.log(`?  ${sp.id} ${list.length}: ${info.file} — ${info.author}, ${info.license}`); continue; }
        let r = null;
        for (const u of info.urls) { r = await download(u); if (r && r.ok) break; }
        let bytes, ext;
        if (r && r.ok) {
          bytes = Buffer.from(await r.arrayBuffer());
          ext = (r.headers.get('content-type') || '').includes('png') ? 'png' : 'jpg';
        } else if (previous.has(info.file)) {
          const old = previous.get(info.file);
          bytes = old.bytes; ext = path.extname(old.local).slice(1);
          console.log(`   ${sp.id}: download failed, keeping the existing copy of ${info.file}`);
        } else {
          console.log(`   ${sp.id}: download failed (${r ? r.status : 'network'}) ${info.file}`);
          continue;
        }
        const local = `${sp.id}-${list.length + 1}.${ext}`;
        list.push({ local, bytes, ...(({ urls, ...keep }) => keep)(info) });
        console.log(`+  ${sp.id} ${list.length}: ${info.file} — ${info.author}, ${info.license}`);
        await sleep(2000); // be gentle with Wikimedia's servers
      }
    }
    if (dry) continue;
    if (list.length < PER_SPECIES && previous.size >= list.length && !force) {
      console.log(`?  ${sp.id}: only ${list.length} photos found, keeping the previous ones (retry later)`);
      continue;
    }
    // write the new set and remove leftovers
    for (const f of fs.readdirSync(OUT)) if (f.startsWith(sp.id + '-')) fs.unlinkSync(path.join(OUT, f));
    for (const c of list) { fs.writeFileSync(path.join(OUT, c.local), c.bytes); delete c.bytes; }
    credits[sp.id] = list;
    if (list.length < PER_SPECIES) console.log(`?  ${sp.id}: only ${list.length} photos found (add "photos" in species.json)`);
  } catch (e) {
    console.log(`x  ${sp.id}: ${e.message}`);
  }
}

if (dry) process.exit(0);
fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 1) + '\n');
const md = ['# Photo credits', '', 'Photos from Wikimedia Commons, used under their respective licenses.', ''];
for (const s of SPECIES) {
  if (!credits[s.id]?.length) continue;
  md.push(`## ${s.name} (${s.wiki[0]})`, '');
  for (const c of credits[s.id]) md.push(`- [${c.file.replace(/^File:/, '')}](${c.page}) — ${c.author}, ${c.licenseUrl ? `[${c.license}](${c.licenseUrl})` : c.license}`);
  md.push('');
}
fs.writeFileSync(path.join(ROOT, 'CREDITS.md'), md.join('\n'));
const n = SPECIES.filter(s => credits[s.id]?.length >= PER_SPECIES).length;
console.log(`\n${n}/${SPECIES.length} species with ${PER_SPECIES} photos. Check the images in src/assets/photos and the credits in CREDITS.md`);
