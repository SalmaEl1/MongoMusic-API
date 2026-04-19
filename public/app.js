const API = 'http://localhost:5000';

const I = {
  mic:'<i class="bi bi-mic-fill"></i>',
  disc:'<i class="bi bi-vinyl-fill"></i>',
  note:'<i class="bi bi-music-note-beamed"></i>',
  cal:'<i class="bi bi-calendar3"></i>',
  clock:'<i class="bi bi-clock-history"></i>',
  alert:'<i class="bi bi-exclamation-octagon-fill"></i>',
  empty:'<i class="bi bi-inbox"></i>',
};

const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const toMMSS = s => { if (!s && s !== 0) return '—'; const v = Math.round(Number(s)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };
const fmtDate = d => { if (!d) return '—'; return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }); };
const spinner = () => `<div class="state-box"><div class="spinner"></div><p>Cargando...</p></div>`;
const empty = (m = 'Sin resultados') => `<div class="state-box">${I.empty}<p>${m}</p></div>`;
const errHTML = m => `<div class="err-box">${I.alert}<span>${m}</span></div>`;
const q = id => document.getElementById(id);

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error('La API devolvió un error.');
  return json;
}

const secs = ['artists', 'albums', 'songs', 'stats'];
const loadedSecs = {};

function navigate(name) {
  secs.forEach(s => {
    q(`sec-${s}`).classList.toggle('visible', s === name);
    document.querySelector(`.nav-btn[data-s="${s}"]`).classList.toggle('active', s === name);
  });
  if (!loadedSecs[name]) {
    loadedSecs[name] = true;
    if (name === 'artists') loadArtists(1);
    if (name === 'albums') loadAlbums(1);
    if (name === 'songs') loadSongs(1);
    if (name === 'stats') loadStats();
  }
}

function paginationHTML(pagination, loadFn) {
  if (!pagination || pagination.pages <= 1) return '';
  const { page, pages } = pagination;
  const nums = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) {
    nums.push(`<button class="pg-num${p === page ? ' cur' : ''}" onclick="${loadFn}(${p})">${p}</button>`);
  }
  return `<div class="pagination">
    <button class="pg-btn" onclick="${loadFn}(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← Ant</button>
    <div class="pg-nums">${nums.join('')}</div>
    <button class="pg-btn" onclick="${loadFn}(${page + 1})" ${page >= pages ? 'disabled' : ''}>Sig →</button>
    <span class="pg-info">${page} / ${pages}</span>
  </div>`;
}

async function loadArtists(page = 1) {
  q('artists-container').innerHTML = spinner();
  q('artists-err').innerHTML = '';
  q('artists-pages').innerHTML = '';

  const params = new URLSearchParams({ page, limit: q('f-artist-limit').value });
  const name = q('f-artist-name').value.trim();
  if (name) params.set('name', name);

  try {
    const { data, pagination } = await apiFetch(`/artists?${params}`);
    q('artists-cnt').textContent = pagination ? `${pagination.total} artistas` : `${data.length} artistas`;
    if (!data.length) { q('artists-container').innerHTML = empty('No se encontraron artistas'); return; }
    q('artists-container').innerHTML = `<div class="cards-grid">${data.map(a => artistCard(a)).join('')}</div>`;
    q('artists-pages').innerHTML = paginationHTML(pagination, 'loadArtists');
  } catch (e) {
    q('artists-err').innerHTML = errHTML(`No se pudo conectar con la API: ${e.message}`);
    q('artists-container').innerHTML = '';
  }
}

function artistCard(a) {
  return `<div class="card" onclick="openArtistPanel('${a._id}','${esc(a.name)}')">
    <div class="card-bar bv"></div>
    <div class="card-ico iv">${I.mic}</div>
    <div class="card-name">${esc(a.name)}</div>
    <div class="card-meta">
      <div class="mrow">${I.cal}<span class="mono">${fmtDate(a.createdAt)}</span></div>
    </div>
  </div>`;
}

function resetArtists() {
  ['f-artist-name'].forEach(id => q(id).value = '');
  loadArtists(1);
}

async function loadAlbums(page = 1) {
  q('albums-container').innerHTML = spinner();
  q('albums-err').innerHTML = '';
  q('albums-pages').innerHTML = '';

  const params = new URLSearchParams({ page, limit: q('f-album-limit').value });
  const title = q('f-album-title').value.trim();
  const from = q('f-album-from').value;
  const to = q('f-album-to').value;
  if (title) params.set('title', title);
  if (from) params.set('releaseDateFrom', from);
  if (to) params.set('releaseDateTo', to);

  try {
    const { data, pagination } = await apiFetch(`/albums?${params}`);
    q('albums-cnt').textContent = pagination ? `${pagination.total} álbumes` : `${data.length} álbumes`;
    if (!data.length) { q('albums-container').innerHTML = empty('No se encontraron álbumes'); return; }
    q('albums-container').innerHTML = `<div class="cards-grid">${data.map(albumCard).join('')}</div>`;
    q('albums-pages').innerHTML = paginationHTML(pagination, 'loadAlbums');
  } catch (e) {
    q('albums-err').innerHTML = errHTML(`No se pudo conectar con la API: ${e.message}`);
    q('albums-container').innerHTML = '';
  }
}

function albumCard(a) {
  const artist = a.artist?.name || a.artist || '—';
  return `<div class="card" onclick="openAlbumPanel('${a._id}','${esc(a.title)}','${esc(artist)}')">
    <div class="card-bar bt"></div>
    <div class="card-ico it">${I.disc}</div>
    <div class="card-name">${esc(a.title)}</div>
    <div class="card-meta">
      <div class="mrow">${I.mic}<span>${esc(artist)}</span></div>
      <div class="mrow">${I.cal}<span class="mono">${fmtDate(a.releaseDate)}</span></div>
    </div>
  </div>`;
}

function resetAlbums() {
  ['f-album-title', 'f-album-from', 'f-album-to'].forEach(id => q(id).value = '');
  loadAlbums(1);
}

async function loadSongs(page = 1) {
  q('songs-container').innerHTML = spinner();
  q('songs-err').innerHTML = '';
  q('songs-pages').innerHTML = '';

  const params = new URLSearchParams({ page, limit: q('f-song-limit').value });
  const search = q('f-song-search').value.trim();
  const year = q('f-song-year').value;
  const minY = q('f-song-miny').value;
  const maxY = q('f-song-maxy').value;
  const minD = q('f-song-mind').value;
  const maxD = q('f-song-maxd').value;
  const sort = q('f-song-sort').value;

  if (search) params.set('search', search);
  if (year) {
    params.set('releaseYear', year);
  } else {
    if (minY) params.set('minReleaseYear', minY);
    if (maxY) params.set('maxReleaseYear', maxY);
  }
  if (minD) params.set('minDuration', minD);
  if (maxD) params.set('maxDuration', maxD);
  if (sort) params.set('sort', sort);

  try {
    const { data, pagination } = await apiFetch(`/songs?${params}`);
    q('songs-cnt').textContent = pagination ? `${pagination.total} canciones` : `${data.length} canciones`;
    if (!data.length) { q('songs-container').innerHTML = empty('Sin resultados para esa búsqueda'); return; }
    q('songs-container').innerHTML = `<div class="cards-grid">${data.map(songCard).join('')}</div>`;
    q('songs-pages').innerHTML = paginationHTML(pagination, 'loadSongs');
  } catch (e) {
    q('songs-err').innerHTML = errHTML(`No se pudo conectar con la API: ${e.message}`);
    q('songs-container').innerHTML = '';
  }
}

function songCard(s) {
  const artist = s.artist?.name || '—';
  const album = s.album?.title || '—';
  return `<div class="card">
    <div class="card-bar ba"></div>
    <div class="card-ico ia">${I.note}</div>
    <div class="card-name">${esc(s.title)}</div>
    <div class="card-meta">
      <div class="mrow">${I.mic}<span>${esc(artist)}</span></div>
      <div class="mrow">${I.disc}<span>${esc(album)}</span></div>
      <div class="mrow">${I.clock}<span class="mono">${toMMSS(s.duration)}</span></div>
      <div class="mrow">${I.cal}<span class="mono">${s.releaseYear || '—'}</span></div>
    </div>
  </div>`;
}

function resetSongs() {
  ['f-song-search', 'f-song-year', 'f-song-miny', 'f-song-maxy', 'f-song-mind', 'f-song-maxd'].forEach(id => q(id).value = '');
  q('f-song-sort').value = '';
  loadSongs(1);
}

async function loadStats() {
  q('stats-err').innerHTML = '';
  await Promise.all([loadSongsPerArtist(), loadAvgDuration()]);
}

async function loadSongsPerArtist() {
  const el = q('stats-spa');
  el.innerHTML = spinner();
  try {
    const { data } = await apiFetch('/stats/songs-per-artist');
    if (!data.length) { el.innerHTML = empty('Sin datos'); return; }
    const max = Math.max(...data.map(r => r.songCount || 0), 1);
    el.innerHTML = `<table>
      <thead><tr><th>#</th><th>Artista</th><th>Canciones</th><th class="bar-cell"></th></tr></thead>
      <tbody>${data.map((r, i) => `<tr>
        <td class="rank">${String(i + 1).padStart(2, '0')}</td>
        <td>${esc(r.artistName || '—')}</td>
        <td>${r.songCount ?? '—'}</td>
        <td class="bar-cell"><div class="mini-bar"><div class="mini-fill" style="width:${Math.round((r.songCount || 0) / max * 100)}%"></div></div></td>
      </tr>`).join('')}</tbody>
    </table>`;
  } catch (e) {
    el.innerHTML = errHTML(`Error: ${e.message}`);
  }
}

async function loadAvgDuration() {
  const el = q('stats-avg');
  el.innerHTML = spinner();
  try {
    const { data } = await apiFetch('/stats/avg-duration-per-album');
    if (!data.length) { el.innerHTML = empty('Sin datos'); return; }
    const max = Math.max(...data.map(r => r.averageDuration || 0), 1);
    el.innerHTML = `<table>
      <thead><tr><th>Álbum</th><th>Media</th><th>Songs</th><th class="bar-cell"></th></tr></thead>
      <tbody>${data.map(r => `<tr>
        <td>${esc(r.albumTitle || '—')}</td>
        <td>${toMMSS(r.averageDuration)}</td>
        <td>${r.songCount ?? '—'}</td>
        <td class="bar-cell"><div class="mini-bar"><div class="mini-fill" style="width:${Math.round((r.averageDuration || 0) / max * 100)}%"></div></div></td>
      </tr>`).join('')}</tbody>
    </table>`;
  } catch (e) {
    el.innerHTML = errHTML(`Error: ${e.message}`);
  }
}

function openPanel(title, sub) {
  q('panel-title').textContent = title;
  q('panel-sub').textContent = sub;
  q('panel-body').innerHTML = spinner();
  q('overlay').classList.add('open');
  q('panel').classList.add('open');
}

function closePanel() {
  q('overlay').classList.remove('open');
  q('panel').classList.remove('open');
}

async function openArtistPanel(id, name) {
  openPanel(name, 'Canciones del artista');
  try {
    const { data } = await apiFetch(`/artists/${id}/songs`);
    q('panel-sub').textContent = `${data.length} canciones`;
    if (!data.length) { q('panel-body').innerHTML = empty('Este artista no tiene canciones'); return; }
    q('panel-body').innerHTML = `<div class="songs-list">${data.map(songRow).join('')}</div>`;
  } catch (e) {
    q('panel-body').innerHTML = errHTML(`Error: ${e.message}`);
  }
}

async function openAlbumPanel(id, title, artist) {
  openPanel(title, `Álbum · ${artist}`);
  try {
    const { data } = await apiFetch(`/albums/${id}/songs`);
    q('panel-sub').textContent = `${artist} · ${data.length} canciones`;
    if (!data.length) { q('panel-body').innerHTML = empty('Este álbum no tiene canciones'); return; }
    q('panel-body').innerHTML = `<div class="songs-list">${data.map(songRow).join('')}</div>`;
  } catch (e) {
    q('panel-body').innerHTML = errHTML(`Error: ${e.message}`);
  }
}

function songRow(s) {
  const artist = s.artist?.name || '—';
  return `<div class="song-row">
    <div>
      <div class="song-row-title">${esc(s.title)}</div>
      <div class="song-row-meta">${esc(artist)}</div>
    </div>
    <div>
      <div class="song-row-dur">${toMMSS(s.duration)}</div>
      <div class="song-row-year">${s.releaseYear || ''}</div>
    </div>
  </div>`;
}

q('f-song-search').addEventListener('keydown', e => {
  if (e.key === 'Enter') loadSongs(1);
});

loadedSecs.artists = true;
loadArtists(1);

window.navigate = navigate;
window.loadArtists = loadArtists;
window.resetArtists = resetArtists;
window.loadAlbums = loadAlbums;
window.resetAlbums = resetAlbums;
window.loadSongs = loadSongs;
window.resetSongs = resetSongs;
window.closePanel = closePanel;
window.openArtistPanel = openArtistPanel;
window.openAlbumPanel = openAlbumPanel;
