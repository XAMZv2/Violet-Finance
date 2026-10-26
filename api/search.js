const youtube = require('youtube-search-api');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Query kosong' });

  try {
    const result = await youtube.GetListByKeyword(q, false, 10);
    const videos = result.items.map(item => ({
      videoId: item.id,
      title: item.title,
      channel: item.channelTitle,
      thumbnail: item.thumbnail.thumbnails[0].url
    }));
    res.status(200).json({ videos });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mencari video' });
  }
};
