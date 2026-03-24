/**
 * Dashboard — Difusora 104.3
 * Rota: /dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio, Newspaper,
  LogOut, Plus, Edit3, Trash2,
  RefreshCw, X, Check,
  FileText, AlertCircle
} from 'lucide-react';

const SUPABASE_URL = 'https://aosnpsobjcezttdlyxfb.supabase.co';
const SUPABASE_ANON = 'sb_publishable_6xghNR2h4q-yzJjq8uqNZA_Gm0a54SI';
const ADMIN_PASS = 'difusora2025';

const sb = {
  async list() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/noticias?select=*&order=created_at.desc`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });
    if (!r.ok) throw new Error();
    return r.json();
  },
  async insert(d: any) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/noticias`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(d)
    });
    if (!r.ok) throw new Error();
    return r.json();
  },
  async update(id: number, d: any) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/noticias?id=eq.${id}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(d)
    });
    if (!r.ok) throw new Error();
    return r.json();
  },
  async remove(id: number) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/noticias?id=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });
    if (!r.ok) throw new Error();
  }
};

type Tab = 'noticias';

interface News {
  id: number;
  created_at: string;
  titulo: string;
  conteudo: string;
  imagem_url?: string;
  autor?: string;
  destaque?: string;
}

const TAGS = [
  { v: '', label: 'Sem destaque', cls: 'bg-white/8 text-white/40' },
  { v: 'destaque', label: '★ Destaque', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' },
  { v: 'urgente', label: '● Urgente', cls: 'bg-red-500/15 text-red-400 border border-red-500/20' },
  { v: 'trending', label: '↑ Trending', cls: 'bg-sky-500/15 text-sky-400 border border-sky-500/20' },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

function KpiCard({ icon, label, value, mono = false }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3 hover:border-white/14 transition-colors">
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">{icon}</div>
      </div>
      <div>
        <p className={`text-2xl font-black leading-none ${mono ? 'tabular-nums' : ''}`}>{value}</p>
        <p className="text-[11px] text-white/40 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[#111] border border-white/[0.07] rounded-2xl ${className}`}>{children}</div>;
}

function Login({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const tryLogin = () => {
    if (pw === ADMIN_PASS) onAuth();
    else { setErr(true); setTimeout(() => setErr(false), 1400); }
  };
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xs">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#e83020,#8b1208)' }}>
            <Radio size={28} className="text-white" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-xl font-black tracking-tight">Difusora 104.3</h1>
          <p className="text-white/30 text-xs mt-1">Central de Controle</p>
        </div>
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-white/25 mb-2">Senha de acesso</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && tryLogin()}
              className={`w-full px-4 py-3 bg-white/[0.04] border rounded-xl text-sm text-white placeholder:text-white/15 outline-none transition-all ${err ? 'border-red-500/60 bg-red-500/5' : 'border-white/[0.07] focus:border-red-500/40'}`}
              placeholder="••••••••••" />
            {err && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-[11px] mt-1.5 flex items-center gap-1">
              <AlertCircle size={10} /> Senha incorreta
            </motion.p>}
          </div>
          <button onClick={tryLogin} className="w-full py-3 rounded-xl text-sm font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all"
            style={{ background: 'linear-gradient(135deg,#e83020,#8b1208)' }}>
            Entrar
          </button>
        </div>
        <p className="text-center text-white/15 text-[10px] mt-6">Difusora Colatina · Sistema editorial interno</p>
      </motion.div>
    </div>
  );
}

export default function Dashboard() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('noticias');
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<News | null>(null);
  const [form, setForm] = useState({ titulo: '', conteudo: '', imagem_url: '', autor: '', destaque: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadNews = useCallback(async () => {
    setLoading(true);
    try { setNews(await sb.list()); }
    catch { showToast('Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) loadNews(); }, [authed, loadNews]);

  const openNew = () => { setForm({ titulo: '', conteudo: '', imagem_url: '', autor: '', destaque: '' }); setEditItem(null); setModal('new'); };
  const openEdit = (item: News) => {
    setForm({ titulo: item.titulo, conteudo: item.conteudo, imagem_url: item.imagem_url || '', autor: item.autor || '', destaque: item.destaque || '' });
    setEditItem(item); setModal('edit');
  };

  const saveNews = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) { showToast('Título e conteúdo obrigatórios'); return; }
    setSaving(true);
    try {
      const p = { titulo: form.titulo.trim(), conteudo: form.conteudo.trim(), imagem_url: form.imagem_url.trim() || null, autor: form.autor.trim() || null, destaque: form.destaque || null };
      if (editItem) await sb.update(editItem.id, p); else await sb.insert(p);
      setModal(null);
      showToast(editItem ? '✓ Notícia atualizada' : '✓ Notícia publicada');
      loadNews();
    } catch { showToast('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const deleteNews = async (id: number) => {
    if (!confirm('Excluir esta notícia?')) return;
    try { await sb.remove(id); loadNews(); showToast('Notícia excluída'); }
    catch { showToast('Erro ao excluir'); }
  };

  if (!authed) return <Login onAuth={() => setAuthed(true)} />;

  const NAV = [
    { id: 'noticias' as Tab, label: 'Notícias', icon: <Newspaper size={15} /> },
  ];

  const TITLES: Record<Tab, string> = {
    noticias: 'Gestão de Notícias'
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        select option{background:#1a1a1a}
      `}</style>

      {/* SIDEBAR */}
      <aside className="w-52 shrink-0 bg-[#0d0d0d] border-r border-white/[0.06] flex flex-col fixed top-0 bottom-0 left-0 z-30">
        <div className="px-4 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#e83020,#8b1208)' }}>
              <Radio size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black leading-none">Difusora</p>
              <p className="text-[9px] text-white/25 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>104.3 FM · PAINEL</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto pt-3">
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${active ? 'text-white' : 'text-white/35 hover:text-white/65 hover:bg-white/[0.03]'}`}
                style={active ? { background: 'rgba(232,48,32,0.12)', borderLeft: '2px solid #e83020', paddingLeft: '10px' } : {}}>
                <span className={active ? 'text-red-400' : ''}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={() => setAuthed(false)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/25 hover:text-white/50 text-[13px] hover:bg-white/[0.03] transition-all">
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-52 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-black">{TITLES[tab]}</h1>
            <p className="text-[10px] text-white/25 mt-0.5">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {toast && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-full">
                  <Check size={10} /> {toast}
                </motion.div>
              )}
            </AnimatePresence>
            {tab === 'noticias' && (
              <button onClick={openNew}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all"
                style={{ background: 'linear-gradient(135deg,#e83020,#8b1208)' }}>
                <Plus size={14} /> Nova notícia
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* NOTICIAS */}
            {tab === 'noticias' && (
              <motion.div key="no" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  <KpiCard icon={<Newspaper size={14} />} label="Total publicadas" value={String(news.length)} />
                </div>

                <Card>
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">Notícias publicadas</h3>
                      <p className="text-[10px] text-white/25 mt-0.5">{news.length} {news.length === 1 ? 'notícia' : 'notícias'} no banco de dados</p>
                    </div>
                    <button onClick={loadNews} className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/60 transition-all">
                      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-16">
                      <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-red-500 animate-spin" />
                    </div>
                  ) : news.length === 0 ? (
                    <div className="text-center py-16">
                      <Newspaper size={32} className="text-white/[0.06] mx-auto mb-3" />
                      <p className="text-white/25 text-sm font-semibold">Nenhuma notícia publicada</p>
                      <p className="text-white/15 text-xs mt-1">Clique em "Nova notícia" para começar</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {news.map(item => {
                        const tag = TAGS.find(t => t.v === item.destaque);
                        return (
                          <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                            {item.imagem_url ? (
                              <img src={item.imagem_url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/[0.07]"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                                <Newspaper size={14} className="text-white/15" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <p className="text-sm font-bold truncate">{item.titulo}</p>
                                {tag && tag.v && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${tag.cls}`}>{tag.label}</span>}
                              </div>
                              <p className="text-[11px] text-white/35 truncate">{item.conteudo}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {item.autor && <span className="text-[9px] text-white/20">{item.autor}</span>}
                                {item.autor && <span className="text-[9px] text-white/10">·</span>}
                                <span className="text-[9px] text-white/15">{fmtDate(item.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(item)} className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
                                <Edit3 size={12} />
                              </button>
                              <button onClick={() => deleteNews(item.id)} className="p-2 rounded-xl bg-red-950/40 border border-red-900/20 text-red-500/50 hover:text-red-400 transition-all">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#e83020,#8b1208)' }}>
                    <FileText size={12} className="text-white" />
                  </div>
                  <h2 className="font-black text-[15px]">{modal === 'edit' ? 'Editar notícia' : 'Nova notícia'}</h2>
                </div>
                <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-all">
                  <X size={14} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Título *</label>
                  <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.07] focus:border-red-500/40 rounded-xl text-sm text-white placeholder:text-white/15 outline-none transition-all"
                    placeholder="Título da notícia..." />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Conteúdo *</label>
                  <textarea value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.07] focus:border-red-500/40 rounded-xl text-sm text-white placeholder:text-white/15 outline-none resize-none h-28 transition-all"
                    placeholder="Texto completo da notícia..." />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1.5">URL da imagem</label>
                  <input type="url" value={form.imagem_url} onChange={e => setForm(f => ({ ...f, imagem_url: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.07] focus:border-red-500/40 rounded-xl text-sm text-white placeholder:text-white/15 outline-none transition-all"
                    placeholder="https://..." />
                  {form.imagem_url && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/[0.07] h-28">
                      <img src={form.imagem_url} alt="preview" className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Autor / Fonte</label>
                    <input type="text" value={form.autor} onChange={e => setForm(f => ({ ...f, autor: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.07] focus:border-red-500/40 rounded-xl text-sm text-white placeholder:text-white/15 outline-none transition-all"
                      placeholder="Redação Difusora" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Marcar como</label>
                    <select value={form.destaque} onChange={e => setForm(f => ({ ...f, destaque: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.07] focus:border-red-500/40 rounded-xl text-sm text-white outline-none transition-all appearance-none cursor-pointer">
                      {TAGS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2.5">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/30 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                  Cancelar
                </button>
                <button onClick={saveNews} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg,#e83020,#8b1208)' }}>
                  {saving
                    ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <><Check size={14} />{modal === 'edit' ? 'Salvar' : 'Publicar'}</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}