'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Image from 'next/image';
import { Song } from '@/types';
import LikedButton from '@/components/LikedButton';
import usePlayer from '@/hooks/usePlayer';
import useLoadImage from '@/hooks/useLoadImage';
import { AiFillDelete } from 'react-icons/ai';
import { BsPlayFill } from 'react-icons/bs';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';

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

    if (res.ok) {
      setNewComment('');
      await fetchComments();
    } else {
      toast.error('Erro ao comentar');
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await fetch(`/api/songs/${id}/comments?commentId=${commentId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      toast.error('Erro ao apagar comentário');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleComment();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-white">Música não encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden pt-[30px] overflow-y-auto">
      <Header>
        <div className="mt-20">
          <div className="flex flex-col md:flex-row items-center gap-x-5">
            <div className="relative h-32 w-32 lg:h-44 lg:w-44 flex-shrink-0">
              <Image
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={song.title}
                className="object-cover rounded-md"
                src={imageUrl ?? '/images/likedit.png'}
                priority
                unoptimized
              />
            </div>
            <div className="flex flex-col gap-y-2 mt-4 md:mt-0">
              <p className="text-neutral-400 text-sm">Música</p>
              <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-bold">
                {song.title}
              </h1>
              <p className="text-neutral-400">{song.author}</p>
            </div>
          </div>
        </div>
      </Header>

      <div className="flex items-center gap-x-4 px-6 mt-6 mb-6">
        <button
          onClick={handlePlay}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition"
        >
          <BsPlayFill size={24} className="text-white" />
        </button>
        <LikedButton songId={String(song.id)} />
      </div>

      <div className="px-6 pb-10">
        <h2 className="text-white text-xl font-semibold mb-4">Comentários</h2>

        {user ? (
          <div className="flex items-center gap-x-2 mb-6">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Adiciona um comentário..."
              className="flex-1 bg-neutral-800 text-white text-sm rounded-full px-4 py-2 outline-none placeholder:text-neutral-500 focus:ring-1 focus:ring-neutral-600"
            />
            <button
              onClick={handleComment}
              disabled={submitting || !newComment.trim()}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 transition text-white text-sm font-medium px-4 py-2 rounded-full flex-shrink-0"
            >
              {submitting ? '...' : 'Comentar'}
            </button>
          </div>
        ) : (
          <p className="text-neutral-400 text-sm mb-6">Faz login para comentar.</p>
        )}

        <div className="flex flex-col gap-y-4">
          {comments.length === 0 ? (
            <p className="text-neutral-400 text-sm">Sem comentários ainda. Sê o primeiro!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex items-start justify-between gap-x-3 bg-neutral-800 rounded-lg px-4 py-3">
                <div className="flex flex-col gap-y-1 min-w-0">
                  <p className="text-neutral-400 text-xs">
                    {comment.profiles?.full_name ?? comment.profiles?.email ?? 'Utilizador'}
                    <span className="ml-2 text-neutral-600">
                      {new Date(comment.created_at).toLocaleDateString('pt-PT')}
                    </span>
                  </p>
                  <p className="text-white text-sm break-words">{comment.content}</p>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-neutral-500 hover:text-red-500 transition flex-shrink-0"
                  >
                    <AiFillDelete size={16} />
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