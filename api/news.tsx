import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  // A chave da API é mantida aqui no backend para segurança e evitar problemas de CORS
  const apiKey = '8bcd801adc73430c7ae1e3bee3733839';

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Parâmetro q obrigatório' });
  }

  try {
    // Busca notícias relacionadas a música usando a NewsAPI
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q + ' música')}&language=pt&sortBy=publishedAt&pageSize=12&apiKey=${apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Formata os itens para o padrão esperado pelo frontend
    const items = (data.articles || []).map((a: any) => ({
      title: a.title || '',
      description: (a.description || '').slice(0, 160),
      link: a.url || '#',
      pubDate: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '',
      thumbnail: a.urlToImage || '',
      author: a.source?.name || a.author || 'Notícias',
    }));

    return res.status(200).json({ status: 'ok', items });
  } catch (err: any) {
    console.error('Erro ao buscar notícias:', err.message);
    return res.status(500).json({ error: 'Falha ao buscar notícias', detail: err.message });
  }
}
