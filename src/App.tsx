/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

import { 
  Play, Pause, Volume2, VolumeX,
  Mic2, Share2, Maximize2,
  Instagram, Facebook, Twitter,
  Mail, Phone, MapPin, Send, ArrowLeft,
  Newspaper, ExternalLink, RefreshCw, Music2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

// ─── Types ───────────────────────────────────────────────
interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  author: string;
}

// ─── News Component ───────────────────────────────────────
function NewsPage({ onBack }: { onBack: () => void }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSource, setActiveSource] = useState(0);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const SOURCES = [
    { label: 'Rolling Stone', url: 'https://rollingstone.uol.com.br/feed/' },
    { label: 'Vagalume',      url: 'https://news.vagalume.com.br/feed/' },
    { label: 'Billboard BR',  url: 'https://www.billboard.com.br/feed/' },
  ];
  // Nota: no AI Studio os feeds reais não carregam por bloqueio de CORS.
  // Na Vercel a função /api/news busca os feeds no servidor sem restrições.

  const MOCK_NEWS: NewsItem[] = [
    { title: 'Beyoncé anuncia nova turnê mundial para 2026', description: 'A cantora confirmou datas para América do Sul, incluindo três shows no Brasil em março de 2026. Os ingressos estarão disponíveis a partir da próxima semana nas principais plataformas de venda.', link: 'https://rollingstone.uol.com.br', pubDate: '11 jun', thumbnail: 'https://picsum.photos/seed/music1/800/450', author: 'Rolling Stone BR' },
    { title: 'Festival Lollapalooza divulga line-up completo', description: 'Edição 2026 traz headliners internacionais e nomes do indie nacional no Autódromo de Interlagos. O evento acontece nos dias 4, 5 e 6 de abril com mais de 80 atrações.', link: 'https://billboard.com.br', pubDate: '10 jun', thumbnail: 'https://picsum.photos/seed/music2/800/450', author: 'Billboard BR' },
    { title: 'Novo álbum de Ludmilla quebra recordes no Spotify', description: 'Projeto foi o mais ouvido em 24 horas na plataforma, com mais de 12 milhões de streams logo nas primeiras horas de lançamento.', link: 'https://vagalume.com.br', pubDate: '10 jun', thumbnail: 'https://picsum.photos/seed/music3/800/450', author: 'Vagalume' },
    { title: 'The Weeknd confirma show em São Paulo', description: 'Cantor canadense retorna ao Brasil após cinco anos com a turnê After Hours Til Dawn. O show está marcado para o Allianz Parque em outubro.', link: 'https://g1.globo.com/musica', pubDate: '09 jun', thumbnail: 'https://picsum.photos/seed/music4/800/450', author: 'G1 Música' },
    { title: 'IVE e BLACKPINK lideram charts do K-Pop no Brasil', description: 'Grupos sul-coreanos dominam as paradas nacionais com lançamentos da última semana e acumulam milhões de plays nas plataformas digitais.', link: 'https://popline.com.br', pubDate: '09 jun', thumbnail: 'https://picsum.photos/seed/music5/800/450', author: 'POPline' },
    { title: 'Gusttavo Lima bate recorde de público em Goiânia', description: 'Show reuniu mais de 80 mil pessoas e foi o maior evento de sertanejo do ano no país. O cantor celebrou o marco nas redes sociais.', link: 'https://terra.com.br/musica', pubDate: '08 jun', thumbnail: 'https://picsum.photos/seed/music6/800/450', author: 'Terra Música' },
    { title: 'Grammy Latino 2026 anuncia indicados', description: 'Anitta, Ivete Sangalo e Gilberto Gil estão entre os artistas brasileiros na disputa pelas principais categorias da premiação.', link: 'https://billboard.com.br', pubDate: '08 jun', thumbnail: 'https://picsum.photos/seed/music7/800/450', author: 'Billboard BR' },
    { title: 'Raul Seixas completa 50 anos do álbum Novo Aeon', description: 'Relançamento especial com faixas remasterizadas chega às plataformas digitais neste mês com documentário inédito sobre as gravações.', link: 'https://rollingstone.uol.com.br', pubDate: '07 jun', thumbnail: 'https://picsum.photos/seed/music8/800/450', author: 'Rolling Stone BR' },
    { title: 'Matuê lança clipe com mais de 5 milhões de views em 24h', description: 'Videoclipe do novo single foi gravado em Tóquio e já figura no trending do YouTube Brasil, consolidando o artista como um dos maiores do rap nacional.', link: 'https://rapnacional.com.br', pubDate: '07 jun', thumbnail: 'https://picsum.photos/seed/music9/800/450', author: 'Rap Nacional' },
    { title: 'Rock in Rio 2026 esgota ingressos em tempo recorde', description: 'Todos os passaportes do festival foram vendidos em menos de duas horas após abertura das vendas, superando o recorde anterior de 2022.', link: 'https://g1.globo.com/musica', pubDate: '06 jun', thumbnail: 'https://picsum.photos/seed/music10/800/450', author: 'G1 Música' },
  ];

  const newsCache = React.useRef<Record<number, { items: NewsItem[]; ts: number }>>({});

  const fetchNews = async (sourceIndex: number) => {
    // Cache de 60 minutos para economizar requisições
    const cached = newsCache.current[sourceIndex];
    if (cached && Date.now() - cached.ts < 60 * 60 * 1000) {
      setNews(cached.items);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      // Em produção (Vercel): chama a função serverless que busca o RSS sem CORS
      // No AI Studio: cai no catch e exibe notícias mock para visualizar o layout
      const feedUrl = encodeURIComponent(SOURCES[sourceIndex].url);
      const res = await fetch(`/api/news?url=${feedUrl}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.items?.length) throw new Error('Sem itens');
      newsCache.current[sourceIndex] = { items: data.items, ts: Date.now() };
      setNews(data.items);
    } catch {
      // Fallback com notícias mock — visível apenas no AI Studio
      const shuffled = [...MOCK_NEWS].sort(() => Math.random() - 0.5).slice(0, 10);
      newsCache.current[sourceIndex] = { items: shuffled, ts: Date.now() };
      setNews(shuffled);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(activeSource); }, [activeSource]);

  const handleSource = (i: number) => { setActiveSource(i); setNews([]); };

  const NewsCard = ({ item, featured = false }: { item: NewsItem; featured?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => setSelected(item)}
      className={`${featured ? 'col-span-2' : ''} rounded-2xl overflow-hidden bg-white/8 border border-white/10 hover:bg-white/12 transition-all active:scale-[0.98] group cursor-pointer flex flex-col`}
    >
      <div className={`relative w-full overflow-hidden bg-white/5 ${featured ? 'aspect-video' : 'aspect-video'}`}>
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-white/5"><svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='1.5'><path d='M9 18V5l12-2v13'/><circle cx='6' cy='18' r='3'/><circle cx='18' cy='16' r='3'/></svg></div>`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={28} className="text-white/15" />
          </div>
        )}
        {featured && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-white border border-red-500/40" style={{ background: 'linear-gradient(135deg,#c41e10cc,#8b1208cc)' }}>
              Destaque
            </span>
          </>
        )}
      </div>
      <div className={`flex flex-col flex-1 ${featured ? 'p-4' : 'p-3'}`}>
        <p className={`font-bold leading-snug flex-1 ${featured ? 'text-sm line-clamp-2' : 'text-xs line-clamp-3'}`}>{item.title}</p>
        {featured && <p className="text-white/40 text-xs mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1.5">
            {item.author && <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest truncate max-w-[80px]">{item.author}</span>}
            {item.author && item.pubDate && <span className="text-white/20 text-[9px]">·</span>}
            <span className="text-[9px] text-white/30">{item.pubDate}</span>
          </div>
          <ExternalLink size={11} className="text-white/20 shrink-0" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <motion.div
        key="news"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex flex-col min-h-screen"
      >
        {/* Wrapper centralizado para desktop */}
        <div className="w-full max-w-2xl mx-auto flex flex-col flex-1">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-6 pb-4 shrink-0">
            <div className="w-10" />
            <img src="https://i.postimg.cc/3whN6qqq/rd104.png" alt="Logo" className="h-20 sm:h-16 w-auto object-contain" referrerPolicy="no-referrer" />
            <button onClick={onBack} className="p-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/15 transition-all active:scale-95 flex items-center justify-center">
              <X size={20} />
            </button>
          </div>

          {/* Title */}
          <div className="px-4 pb-3 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <Music2 size={18} className="text-red-400" />
              <h2 className="text-2xl font-bold tracking-tight">Notícias</h2>
            </div>
            <p className="text-white/40 text-xs tracking-wide">Mundo da música em tempo real</p>
          </div>

          {/* Source Tabs */}
          <div className="flex gap-2 px-4 pb-4 shrink-0 overflow-x-auto no-scrollbar">
            {SOURCES.map((s, i) => (
              <button key={i} onClick={() => handleSource(i)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all active:scale-95 min-h-[36px] border ${activeSource === i ? 'text-white border-red-600/60' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                style={activeSource === i ? { background: 'linear-gradient(135deg,#c41e10,#8b1208)' } : {}}
              >{s.label}</button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-8 no-scrollbar">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 rounded-full border-2 border-white/10 border-t-red-500" />
                <p className="text-white/30 text-xs tracking-widest uppercase">Carregando notícias...</p>
              </div>
            )}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <Newspaper size={40} className="text-white/20" />
                <p className="text-white/60 font-medium">Não foi possível carregar</p>
                <button onClick={() => fetchNews(activeSource)} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white border border-white/15 bg-white/8">
                  <RefreshCw size={14} /> Tentar novamente
                </button>
              </div>
            )}
            {!loading && !error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {news[0] && <NewsCard item={news[0]} featured />}
                {news.slice(1).map((item, i) => <NewsCard key={i} item={item} />)}
              </motion.div>
            )}
          </div>

        </div>
      </motion.div>

      {/* ── Modal de Preview ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setSelected(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-t-[2rem] overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0a0a 100%)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '85vh' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="overflow-y-auto no-scrollbar pb-8" style={{ maxHeight: 'calc(85vh - 20px)' }}>
                {/* Imagem */}
                {selected.thumbnail && (
                  <div className="relative w-full aspect-video overflow-hidden">
                    <img src={selected.thumbnail} alt={selected.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  </div>
                )}

                <div className="px-5 pt-4 space-y-4">
                  {/* Fonte + data */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selected.author && (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-white border border-red-500/40" style={{ background: 'linear-gradient(135deg,#c41e1020,#8b120820)' }}>
                        {selected.author}
                      </span>
                    )}
                    {selected.pubDate && (
                      <span className="text-[10px] text-white/40 font-medium">{selected.pubDate}</span>
                    )}
                  </div>

                  {/* Título */}
                  <h3 className="text-lg font-bold leading-snug">{selected.title}</h3>

                  {/* Descrição */}
                  <p className="text-white/60 text-sm leading-relaxed">{selected.description}</p>

                  {/* Créditos */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/8 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Créditos</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-800/30 flex items-center justify-center shrink-0">
                        <Newspaper size={14} className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{selected.author || 'Fonte desconhecida'}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">Publicado em {selected.pubDate || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Botão ler completo */}
                  <a
                    href={selected.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold tracking-wider uppercase text-sm text-white transition-all active:scale-[0.98] hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#c41e10,#8b1208)' }}
                  >
                    <ExternalLink size={15} />
                    Ler notícia completa
                  </a>

                  <button onClick={() => setSelected(null)} className="w-full py-3 rounded-2xl text-sm font-bold text-white/50 bg-white/5 border border-white/10 hover:bg-white/8 transition-all">
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [activePage, setActivePage] = useState<'home' | 'podcast' | 'contact' | 'news'>('home');
  const [radioStatus, setRadioStatus] = useState<'paused' | 'playing' | 'loading'>('paused');

  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const STREAM_URL = 'https://sua-radio.com/stream'; // troque pela URL real

  useEffect(() => {
    audioRef.current = new Audio(STREAM_URL);
    audioRef.current.preload = 'none';
    audioRef.current.volume = volume / 100;
    audioRef.current.addEventListener('playing', () => setRadioStatus('playing'));
    audioRef.current.addEventListener('pause',   () => setRadioStatus('paused'));
    audioRef.current.addEventListener('waiting', () => setRadioStatus('loading'));
    audioRef.current.addEventListener('error',   () => setRadioStatus('paused'));
    return () => { audioRef.current?.pause(); };
  }, []);

  useEffect(() => {
    if (activePage === 'podcast') {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const first = document.getElementsByTagName('script')[0];
        first.parentNode?.insertBefore(tag, first);
        window.onYouTubeIframeAPIReady = () => initPlayer();
      } else {
        initPlayer();
      }
    }
    return () => {
      if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
    };
  }, [activePage]);

  const initPlayer = () => {
    if (playerRef.current) return;
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: 'dQw4w9WgXcQ',
      playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
    });
  };

  const toggleRadio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
    } else {
      audioRef.current.src = STREAM_URL;
      setRadioStatus('loading');
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setRadioStatus('paused'));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
    if (v > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const statusLabel = {
    paused:  'RÁDIO EM PAUSA',
    playing: 'AO VIVO',
    loading: 'CONECTANDO...',
  }[radioStatus];

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">

      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline preload="auto" className="w-full h-full object-cover opacity-80">
          <source src="https://image2url.com/r2/default/videos/1773241632009-36a19a63-51f3-4a08-8cf8-6d6bb985fc30.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      <AnimatePresence mode="wait">

        {/* ═══════════════ HOME ═══════════════ */}
        {activePage === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex flex-col items-center justify-between min-h-screen pb-6 pt-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex-1 flex items-center justify-center"
            >
              <img
                src="https://i.postimg.cc/3whN6qqq/rd104.png"
                alt="Difusora Colatina 104.3"
                className="h-64 sm:h-80 w-auto object-contain drop-shadow-[0_0_70px_rgba(180,30,20,0.7)]"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="w-full px-4 max-w-sm mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-2xl rounded-[1.75rem] border border-white/15 shadow-2xl overflow-hidden">

                <div className="flex flex-col items-center pt-8 pb-6 px-6 gap-3">
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
                    Difusora Colatina 104.3
                  </p>

                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={toggleRadio}
                    className="relative w-[6.5rem] h-[6.5rem] rounded-full flex items-center justify-center mt-2 shadow-[0_0_60px_rgba(200,30,20,0.55)]"
                    style={{ background: 'radial-gradient(circle at 35% 35%, #e83020, #8b1208)' }}
                  >
                    {radioStatus === 'loading' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 rounded-full border-t-2 border-white border-2 border-white/20"
                      />
                    ) : isPlaying ? (
                      <Pause className="w-10 h-10" fill="white" color="white" />
                    ) : (
                      <Play className="w-10 h-10 ml-1" fill="white" color="white" />
                    )}
                    {isPlaying && (
                      <motion.span
                        animate={{ scale: [1, 1.55], opacity: [0.35, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-full bg-red-600"
                        style={{ zIndex: -1 }}
                      />
                    )}
                  </motion.button>

                  <div className="flex items-center gap-1.5 mt-1">
                    {isPlaying && (
                      <motion.span
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-red-400"
                      />
                    )}
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="grid grid-cols-3 gap-0">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActivePage('podcast')}
                    className="flex items-center justify-center gap-2 py-2 border-r border-white/10 hover:bg-white/8 transition-all active:scale-95"
                  >
                    <Mic2 size={12} className="text-white/60" />
                    <span className="text-[9px] font-bold tracking-wider uppercase text-white/70">Podcast</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActivePage('news')}
                    className="flex items-center justify-center gap-2 py-2 border-r border-white/10 hover:bg-white/8 transition-all active:scale-95"
                  >
                    <Newspaper size={12} className="text-white/60" />
                    <span className="text-[9px] font-bold tracking-wider uppercase text-white/70">Notícias</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActivePage('contact')}
                    className="flex items-center justify-center gap-2 py-2 hover:bg-white/8 transition-all active:scale-95"
                  >
                    <Mail size={12} className="text-white/60" />
                    <span className="text-[9px] font-bold tracking-wider uppercase text-white/70">Contato</span>
                  </motion.button>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <a href="#" className="text-white/40 hover:text-white transition-colors p-2"><Instagram size={17} /></a>
                    <a href="#" className="text-white/40 hover:text-white transition-colors p-2"><Facebook size={17} /></a>
                    <a href="#" className="text-white/40 hover:text-white transition-colors p-2"><Twitter size={17} /></a>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors p-1">
                      {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range" min="0" max="100" value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 rounded-full appearance-none cursor-pointer accent-red-500 bg-white/20"
                    />
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════ NEWS ═══════════════ */}
        {activePage === 'news' && (
          <NewsPage onBack={() => setActivePage('home')} />
        )}

        {/* ═══════════════ PODCAST ═══════════════ */}
        {activePage === 'podcast' && (
          <motion.div
            key="podcast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            <div className="flex items-center justify-between px-4 pt-6 pb-4">
              <div className="w-10" />
              <img src="https://i.postimg.cc/3whN6qqq/rd104.png" alt="Logo" className="h-32 sm:h-24 w-auto object-contain" referrerPolicy="no-referrer" />
              <button
                onClick={() => setActivePage('home')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/15 transition-all active:scale-95 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center px-4 pb-4 gap-3">
              <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl" style={{ aspectRatio: '16/9' }}>
                <div id="youtube-player" className="absolute inset-0 w-full h-full" />
              </div>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">Ao Vivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const i = document.getElementById('youtube-player'); i?.requestFullscreen?.(); }} className="flex items-center gap-1.5 px-3 py-2.5 bg-white/10 rounded-full border border-white/10 hover:bg-white/15 transition-all active:scale-95 min-h-[44px]">
                    <Maximize2 size={13} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Tela cheia</span>
                  </button>
                  <button className="p-2.5 bg-white/10 rounded-full border border-white/10 hover:bg-white/15 transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 px-4 py-4 border-t border-white/8">
              <a href="#" className="text-white/40 hover:text-white transition-colors p-2"><Instagram size={18} /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors p-2"><Facebook size={18} /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors p-2"><Twitter size={18} /></a>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ CONTACT ═══════════════ */}
        {activePage === 'contact' && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            <div className="flex items-center justify-between px-4 pt-6 pb-4">
              <div className="w-10" />
              <img src="https://i.postimg.cc/3whN6qqq/rd104.png" alt="Logo" className="h-32 sm:h-24 w-auto object-contain" referrerPolicy="no-referrer" />
              <button
                onClick={() => setActivePage('home')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/15 transition-all active:scale-95 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-4 no-scrollbar">
              <div className="pt-1 pb-3">
                <h2 className="text-3xl font-bold tracking-tight">Fale Conosco</h2>
                <p className="text-white/50 text-sm mt-2 leading-relaxed">Sua participação é fundamental para a Difusora 104.3. Mande sua sugestão ou pedido musical.</p>
              </div>
              <div className="space-y-2.5">
                <a href="mailto:contato@difusora104.com.br" className="flex items-center gap-4 p-4 bg-white/8 rounded-2xl border border-white/10 hover:bg-white/12 transition-all active:scale-[0.98] min-h-[64px]">
                  <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center shrink-0"><Mail size={18} className="text-red-400" /></div>
                  <div><p className="text-[9px] font-bold text-white/35 uppercase tracking-widest">E-mail</p><p className="text-sm font-medium mt-0.5">contato@difusora104.com.br</p></div>
                </a>
                <a href="tel:+5527999999999" className="flex items-center gap-4 p-4 bg-white/8 rounded-2xl border border-white/10 hover:bg-white/12 transition-all active:scale-[0.98] min-h-[64px]">
                  <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center shrink-0"><Phone size={18} className="text-red-400" /></div>
                  <div><p className="text-[9px] font-bold text-white/35 uppercase tracking-widest">Telefone</p><p className="text-sm font-medium mt-0.5">+55 (27) 99999-9999</p></div>
                </a>
                <div className="flex items-center gap-4 p-4 bg-white/8 rounded-2xl border border-white/10 min-h-[64px]">
                  <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center shrink-0"><MapPin size={18} className="text-red-400" /></div>
                  <div><p className="text-[9px] font-bold text-white/35 uppercase tracking-widest">Localização</p><p className="text-sm font-medium mt-0.5">Colatina, ES — Brasil</p></div>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-white/35">Nome Completo</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-red-500/40 outline-none transition-all text-white placeholder:text-white/20 text-sm min-h-[50px]" placeholder="Seu nome..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-white/35">E-mail</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-red-500/40 outline-none transition-all text-white placeholder:text-white/20 text-sm min-h-[50px]" placeholder="seu@email.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-white/35">Mensagem</label>
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-red-500/40 outline-none transition-all h-28 resize-none text-white placeholder:text-white/20 text-sm" placeholder="Sugestão, pedido musical..." />
                </div>
                <button className="w-full rounded-xl py-4 font-bold tracking-widest uppercase flex items-center justify-center gap-2 text-sm text-white transition-all active:scale-[0.98] hover:opacity-90 min-h-[52px]" style={{ background: 'linear-gradient(135deg, #c41e10, #8b1208)' }}>
                  <span>Enviar Mensagem</span>
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}