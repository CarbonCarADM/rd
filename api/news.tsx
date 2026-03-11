import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_FEEDS = [
  'https://rollingstone.uol.com.br/feed/',
  'https://news.vagalume.com.br/feed/',
  'https://www.billboard.com.br/feed/',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;

  if (!url || typeof url !== 'string')
    return res.status(400).json({ error: 'Parâmetro url obrigatório' });

  if (!ALLOWED_FEEDS.includes(url))
    return res.status(403).json({ error: 'Feed não permitido' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioDifusora/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const items = parseRSS(xml);
    // Ordena do mais recente para o mais antigo
    items.sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));
    // Remove campo interno antes de retornar
    const clean = items.map(({ rawDate, ...rest }) => rest);

    return res.status(200).json({ status: 'ok', items: clean });
  } catch (err: any) {
    return res.status(500).json({ error: 'Falha ao buscar o feed', detail: err.message });
  }
}

function parseRSS(xml: string) {
  const items: any[] = [];
  const re = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m;

  while ((m = re.exec(xml)) !== null) {
    const block = m[1];

    const get = (tag: string) => {
      const r = block.match(
        new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i')
      );
      return r ? r[1].trim() : '';
    };

    let thumbnail =
      (block.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i) || [])[1] ||
      (block.match(/media:content[^>]+url=["']([^"']+)["']/i) || [])[1] ||
      (block.match(/enclosure[^>]+url=["']([^"']+)["']/i) || [])[1] || '';

    if (!thumbnail) {
      const desc = get('description') || get('content:encoded') || '';
      const img = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (img) thumbnail = img[1];
    }

    const title = get('title');
    if (!title) continue;

    const rawDesc = get('description') || get('content:encoded') || '';
    const description = rawDesc
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);

    const pubDateRaw = get('pubDate');
    const rawDate = pubDateRaw ? new Date(pubDateRaw).getTime() : 0;
    const pubDate = pubDateRaw
      ? new Date(pubDateRaw).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      : '';

    items.push({
      title,
      description,
      link: get('link') || get('guid') || '',
      pubDate,
      rawDate,
      thumbnail,
      author: get('dc:creator') || get('author') || '',
    });
  }

  return items.slice(0, 12);
}