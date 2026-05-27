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
}

const initialState: ImportState = {
  status: 'idle',
  message: '',
  imported: 0,
  total: 0,
  failed: 0,
};

export  function useImportPlaylist() {
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

          // Sentinel — server signals clean end
          if (payload === '[DONE]') {
            reader.cancel();
            return;
          }

          try {
            const event = JSON.parse(payload);
            setState(prev => ({
              ...prev,
              status: event.status ?? prev.status,
              message: event.message ?? prev.message,
              imported: event.imported ?? prev.imported,
              total: event.total ?? prev.total,
              failed: event.failed ?? prev.failed,
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