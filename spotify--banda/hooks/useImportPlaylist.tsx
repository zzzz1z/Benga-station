import { createClient } from '@/utils/supabase/client';
import { useState, useCallback } from 'react';

export type ImportStatus = 'idle' | 'fetching' | 'matching' | 'progress' | 'done' | 'error';

export interface ImportState {
  status: ImportStatus;
  message: string;
  imported: number;
  total: number;
  failed: number;
  playlistId?: string;
  failedSongs: { title: string; artist: string }[];
}

const initialState: ImportState = {
  status: 'idle',
  message: '',
  imported: 0,
  total: 0,
  failed: 0,
  failedSongs: [],
};

export function useImportPlaylist() {
  const [state, setState] = useState<ImportState>(initialState);

  const importPlaylist = useCallback(async (url: string) => {
    setState({ ...initialState, status: 'fetching', message: 'A iniciar...' });

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/import-playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url }),
      });

      if (!res.ok || !res.body) {
        setState(prev => ({ ...prev, status: 'error', message: 'Erro ao ligar ao servidor.' }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') { reader.cancel(); return; }

          try {
            const event = JSON.parse(payload);

            const isTerminal = event.status === 'done' || event.status === 'error';
            const isStarting = event.status === 'starting';
            const isFailed   = event.status === 'not_found' || event.status === 'db_error' || event.status === 'error';
            const isImported = event.status === 'imported';

            setState(prev => ({
              ...prev,
              status: isTerminal ? event.status
                    : isStarting ? 'matching'
                    : (isImported || isFailed) ? 'progress'
                    : event.status ?? prev.status,

              message: isTerminal && event.status === 'done'
                ? `Importadas ${event.imported ?? prev.imported} músicas!`
                : isTerminal && event.status === 'error'
                ? (event.error ?? 'Erro desconhecido.')
                : isStarting
                ? 'A corresponder músicas...'
                : prev.message,

              total:    event.total    ?? prev.total,
              imported: isTerminal     ? (event.imported ?? prev.imported)
                      : isImported     ? prev.imported + 1
                      : prev.imported,

              failed:   isTerminal     ? (event.failed ?? prev.failed)
                      : isFailed       ? prev.failed + 1
                      : prev.failed,

              failedSongs: isFailed && event.title
                ? [...prev.failedSongs, { title: event.title, artist: event.artist ?? '' }]
                : prev.failedSongs,

              playlistId: event.playlistId ?? prev.playlistId,
            }));
          } catch {}
        }
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, status: 'error', message: err.message ?? 'Erro desconhecido.' }));
    }
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { state, importPlaylist, reset };
}