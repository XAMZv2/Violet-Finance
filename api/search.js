// Audius search + stream redirect for Violet Finance.
// Read-only search is public; the stream endpoint redirects to the playable audio file.
const API_BASE = 'https://api.audius.co/v1';
const APP_NAME = 'VioletFinance';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Vercel rewrites /api/stream?id=... to this handler as well.
  if (req.query.id) {
    const id = String(req.query.id);
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return res.status(400).json({ error: 'ID lagu tidak valid' });
    return res.redirect(302, `${API_BASE}/tracks/${encodeURIComponent(id)}/stream?app_name=${APP_NAME}`);
  }

  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Query kosong' });

  try {
    const url = `${API_BASE}/tracks/search?query=${encodeURIComponent(q)}&limit=10&app_name=${APP_NAME}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Audius returned ${response.status}`);
    const payload = await response.json();
    const tracks = (payload.data || []).filter(t => t && t.id && t.is_streamable !== false).map(t => {
      const artwork = t.artwork || {};
      return {
        videoId: String(t.id),
        id: String(t.id),
        title: t.title || 'Untitled track',
        channel: (t.user && (t.user.name || t.user.handle)) || 'Audius artist',
        thumbnail: artwork['480x480'] || artwork['150x150'] || artwork['1000x1000'] || '',
        duration: Number(t.duration) || 0,
        audioUrl: `/api/stream?id=${encodeURIComponent(t.id)}`,
        permalink: t.permalink ? `https://audius.co${t.permalink}` : ''
      };
    });
    return res.status(200).json({ tracks });
  } catch (err) {
    return res.status(502).json({ error: 'Pencarian Audius gagal. Coba lagi nanti.' });
  }
};
