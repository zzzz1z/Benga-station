'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Image from 'next/image';
import { Song, Playlist } from '@/types';
import LikedButton from '@/components/LikedButton';
import OfflineButton from '@/components/OfflineButton';
import usePlayer from '@/hooks/usePlayer';
import useLoadImage from '@/hooks/useLoadImage';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import { AiFillDelete } from 'react-icons/ai';
import { BsPlayFill } from 'react-icons/bs';
import { SiYoutube } from 'react-icons/si';
import { MdAudiotrack, MdPlaylistAdd, MdCheck } from 'react-icons/md';
import { IoChevronDown } from 'react-icons/io5';

const supabase = createClient();

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name?: string; email?: string };
}

const getSongPlayerId = (song: Song): string =>
  song.source === 'youtube' && song.youtube_video_id
    ? `yt_${song.youtube_video_id}`
    : String(song.id);

const GAMER_CUT = 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)';
const COVER_CUT = 'polygon(12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%, 0% 12%)';

// ── Add to Playlist dropdown ──────────────────────────────────────────────────

const AddToPlaylistDropdown = ({ song }: { song: Song }) => {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchPlaylists = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('Playlists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setPlaylists(data as Playlist[]);
  };

  const checkExisting = async () => {
    if (!user || playlists.length === 0) return;
    const { data } = await supabase
      .from('playlist_songs')
      .select('playlist_id')
      .eq('song_id', song.id);
    if (data) setAdded(new Set(data.map((r: any) => r.playlist_id)));
  };

  useEffect(() => {
    if (open) {
      fetchPlaylists().then(checkExisting);
    }
  }, [open]);

  useEffect(() => {
    if (playlists.length > 0) checkExisting();
  }, [playlists]);

  const togglePlaylist = async (playlistId: string) => {
    setLoading(true);
    try {
      if (added.has(playlistId)) {
        await supabase
          .from('playlist_songs')
          .delete()
          .eq('playlist_id', playlistId)
          .eq('song_id', song.id);
        setAdded(prev => { const n = new Set(prev); n.delete(playlistId); return n; });
        toast.success('Removido da playlist');
      } else {
        await supabase
          .from('playlist_songs')
          .insert({ playlist_id: playlistId, song_id: song.id });
        setAdded(prev => new Set([...prev, playlistId]));
        toast.success('Adicionado à playlist!');
      }
    } catch {
      toast.error('Erro ao atualizar playlist');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-x-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest
          text-neutral-300 border border-white/10 hover:border-red-500/50 hover:text-white transition-all"
        style={{ clipPath: GAMER_CUT }}
      >
        <MdPlaylistAdd size={16} />
        Playlist
        <IoChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-2 z-50 min-w-[200px] bg-neutral-800 border border-white/10 shadow-2xl overflow-hidden"
            style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
            {playlists.length === 0 ? (
              <p className="text-neutral-500 text-xs px-4 py-3">Sem playlists</p>
            ) : (
              playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => togglePlaylist(pl.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left
                    hover:bg-white/5 transition group"
                >
                  <span className="text-xs text-neutral-200 group-hover:text-white truncate max-w-[150px] transition">
                    {pl.title}
                  </span>
                  {added.has(pl.id) && (
                    <MdCheck size={14} className="text-red-500 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const SongDetails = () => {
  const { id } = useParams();
  const { user } = useUser();
  const player = usePlayer();

  const [song, setSong] = useState<Song | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const imageUrl = useLoadImage(song as Song);

  const fetchSong = async () => {
    const res = await fetch(`/api/songs/${id}`);
    const json = await res.json();
    if (json.song) setSong(json.song);
    setLoading(false);
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/songs/${id}/comments`);
    const json = await res.json();
    if (json.comments) setComments(json.comments);
  };

  useEffect(() => {
    if (!id) return;
    fetchSong();
    fetchComments();
  }, [id]);

  const handlePlay = () => {
    if (!song) return;
    player.setQueue([song], getSongPlayerId(song));
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/songs/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    if (res.ok) { setNewComment(''); await fetchComments(); }
    else toast.error('Erro ao comentar');
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await fetch(`/api/songs/${id}/comments?commentId=${commentId}`, { method: 'DELETE' });
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
    else toast.error('Erro ao apagar comentário');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-neutral-900">
        <p className="text-red-500 animate-pulse font-black uppercase tracking-widest text-sm">Carregando...</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex justify-center items-center h-full bg-neutral-900">
        <p className="text-neutral-400">Música não encontrada</p>
      </div>
    );
  }

  const isYoutube = song.source === 'youtube';

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden pt-[30px] overflow-y-auto">
      <Header>
        <div className="mt-20 relative">

          {/* Glow behind cover */}
          <div
            className="absolute top-0 left-0 w-48 h-48 blur-3xl opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.9), transparent 70%)' }}
          />

          <div className="flex flex-col md:flex-row items-center md:items-end gap-x-8 gap-y-4">

            {/* Cover */}
            <div className="relative h-48 w-48 md:h-56 md:w-56 flex-shrink-0">
              <div
                className="relative w-full h-full bg-red-500 p-[2px]"
                style={{ clipPath: COVER_CUT, filter: 'drop-shadow(0 0 14px rgba(239,68,68,0.45))' }}
              >
                <div className="relative w-full h-full bg-neutral-900 overflow-hidden" style={{ clipPath: COVER_CUT }}>
                  <Image
                    fill priority
                    sizes="224px"
                    alt={song.title}
                    src={imageUrl ?? '/images/likedit.png'}
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-y-2 text-center md:text-left">
              {/* Source badge */}
              <div className="flex items-center justify-center md:justify-start gap-x-2">
                <span
                  className="flex items-center gap-x-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
                  style={{
                    background: isYoutube ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                    border: isYoutube ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    color: isYoutube ? '#f87171' : '#a3a3a3',
                    clipPath: GAMER_CUT,
                  }}
                >
                  {isYoutube ? <SiYoutube size={10} /> : <MdAudiotrack size={10} />}
                  {isYoutube ? 'YouTube' : 'Upload'}
                </span>
              </div>

              <p className="text-neutral-500 text-xs uppercase tracking-widest font-mono">Música</p>
              <h1
                className="text-white text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none"
                style={{ textShadow: '0 0 20px rgba(239,68,68,0.2)' }}
              >
                {song.title}
              </h1>
              <p className="text-neutral-400 font-medium">{song.author}</p>
            </div>
          </div>
        </div>
      </Header>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 px-6 mt-6 mb-8">
        {/* Play */}
        <button
          onClick={handlePlay}
          className="flex items-center gap-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-500
            text-white text-xs font-black uppercase tracking-widest transition-all
            shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95"
          style={{ clipPath: GAMER_CUT }}
        >
          <BsPlayFill size={16} />
          Reproduzir
        </button>

        {/* Like */}
        <LikedButton songId={song.id} initialLiked={true} />

        {/* Offline */}
        <OfflineButton song={song} size={20} />

        {/* Add to playlist */}
        <AddToPlaylistDropdown song={song} />
      </div>

      {/* Divider */}
      <div className="mx-6 h-px mb-8"
        style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.4), transparent)' }} />

      {/* Comments */}
      <div className="px-6 pb-16">
        <div className="flex items-center gap-x-3 mb-5">
          <h2 className="text-white font-black text-lg uppercase tracking-widest">Comentários</h2>
          {comments.length > 0 && (
            <span className="text-[10px] font-mono text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5"
              style={{ clipPath: GAMER_CUT }}>
              {comments.length}
            </span>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-x-2 mb-6">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Adiciona um comentário..."
              className="flex-1 bg-neutral-800 border border-white/5 text-white text-xs px-4 py-2.5
                outline-none placeholder:text-neutral-600 focus:border-red-500/40 transition font-mono"
              style={{ clipPath: GAMER_CUT }}
            />
            <button
              onClick={handleComment}
              disabled={submitting || !newComment.trim()}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 transition text-white
                text-xs font-black uppercase tracking-widest px-4 py-2.5 flex-shrink-0"
              style={{ clipPath: GAMER_CUT }}
            >
              {submitting ? '...' : 'Enviar'}
            </button>
          </div>
        ) : (
          <p className="text-neutral-500 text-xs mb-6 font-mono">Faz login para comentar.</p>
        )}

        <div className="flex flex-col gap-y-2">
          {comments.length === 0 ? (
            <p className="text-neutral-600 text-xs font-mono uppercase tracking-widest py-4">
              ── Sem comentários ainda ──
            </p>
          ) : (
            comments.map(comment => (
              <div
                key={comment.id}
                className="flex items-start justify-between gap-x-3 bg-neutral-800/60
                  border border-white/5 px-4 py-3 hover:border-red-900/30 transition"
              >
                <div className="flex flex-col gap-y-1 min-w-0">
                  <div className="flex items-center gap-x-2">
                    <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">
                      {comment.profiles?.full_name ?? comment.profiles?.email ?? 'Utilizador'}
                    </span>
                    <span className="text-neutral-700 text-[9px] font-mono">
                      {new Date(comment.created_at).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  <p className="text-neutral-200 text-sm break-words leading-relaxed">{comment.content}</p>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-neutral-700 hover:text-red-500 transition flex-shrink-0 mt-0.5"
                  >
                    <AiFillDelete size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SongDetails;