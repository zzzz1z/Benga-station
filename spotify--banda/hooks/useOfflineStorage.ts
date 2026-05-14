'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// We store audio files in the Documents directory under offline/
// and a JSON index at offline/index.json tracking what's cached.

const OFFLINE_DIR = 'offline';
const INDEX_FILE = 'offline/index.json';

export interface OfflineSong {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  filePath: string; // relative path inside Documents: offline/<videoId>.m4a
  savedAt: number;
  sizeBytes: number;
}

interface OfflineIndex {
  songs: Record<string, OfflineSong>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const readIndex = async (): Promise<OfflineIndex> => {
  try {
    const result = await Filesystem.readFile({
      path: INDEX_FILE,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(result.data as string);
  } catch {
    return { songs: {} };
  }
};

const writeIndex = async (index: OfflineIndex): Promise<void> => {
  await Filesystem.writeFile({
    path: INDEX_FILE,
    directory: Directory.Documents,
    data: JSON.stringify(index),
    encoding: Encoding.UTF8,
    recursive: true,
  });
};

const ensureDir = async () => {
  try {
    await Filesystem.mkdir({
      path: OFFLINE_DIR,
      directory: Directory.Documents,
      recursive: true,
    });
  } catch {
    // already exists — fine
  }
};

// ── hook ─────────────────────────────────────────────────────────────────────

export const useOfflineStorage = () => {
  const [offlineSongs, setOfflineSongs] = useState<Record<string, OfflineSong>>({});
  const [downloading, setDownloading] = useState<Record<string, number>>({}); // videoId → 0-100 progress
  const [isNative, setIsNative] = useState(false);

  // Detect if running in Capacitor (native) or browser
  useEffect(() => {
    const native = typeof (window as any).Capacitor !== 'undefined' &&
      (window as any).Capacitor.isNativePlatform();
    setIsNative(native);
    if (native) {
      loadIndex();
    }
  }, []);

  const loadIndex = async () => {
    const index = await readIndex();
    setOfflineSongs(index.songs);
  };

  const isOffline = useCallback((videoId: string): boolean => {
    return !!offlineSongs[videoId];
  }, [offlineSongs]);

  const isDownloading = useCallback((videoId: string): boolean => {
    return downloading[videoId] !== undefined;
  }, [downloading]);

  const getProgress = useCallback((videoId: string): number => {
    return downloading[videoId] ?? 0;
  }, [downloading]);

  // Returns a local file:// URI for playback, or null if not cached
  const getLocalUri = useCallback(async (videoId: string): Promise<string | null> => {
    if (!isNative || !offlineSongs[videoId]) return null;
    try {
      const result = await Filesystem.getUri({
        path: offlineSongs[videoId].filePath,
        directory: Directory.Documents,
      });
      return result.uri;
    } catch {
      return null;
    }
  }, [isNative, offlineSongs]);

  const saveForOffline = useCallback(async (
    videoId: string,
    title: string,
    author: string,
    thumbnail: string,
  ): Promise<void> => {
    if (!isNative) {
      console.warn('[useOfflineStorage] Not running in Capacitor — offline save skipped');
      return;
    }
    if (offlineSongs[videoId] || downloading[videoId] !== undefined) return;

    setDownloading(prev => ({ ...prev, [videoId]: 0 }));

    try {
      await ensureDir();

      // Fetch the stream as a blob
      const response = await fetch(`/api/youtube/stream?videoId=${videoId}`);
      if (!response.ok) throw new Error(`Stream fetch failed: ${response.status}`);

      // Read with progress tracking
      const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
      const reader = response.body!.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value as Uint8Array<ArrayBuffer>);
        received += value.length;
        if (contentLength > 0) {
           const progress = Math.round((received / contentLength) * 100);
          setDownloading(prev => ({ ...prev, [videoId]: progress }));
        }
}

      // Convert to base64 for Capacitor Filesystem
      const blob = new Blob(chunks, { type: 'audio/mp4' });
      const base64 = await blobToBase64(blob);
      const filePath = `${OFFLINE_DIR}/${videoId}.m4a`;

      await Filesystem.writeFile({
        path: filePath,
        directory: Directory.Documents,
        data: base64,
        recursive: true,
      });

      const song: OfflineSong = {
        videoId,
        title,
        author,
        thumbnail,
        filePath,
        savedAt: Date.now(),
        sizeBytes: received,
      };

      const index = await readIndex();
      index.songs[videoId] = song;
      await writeIndex(index);

      setOfflineSongs(prev => ({ ...prev, [videoId]: song }));
    } catch (err: any) {
      console.error('[useOfflineStorage] save failed:', err.message);
    } finally {
      setDownloading(prev => {
        const next = { ...prev };
        delete next[videoId];
        return next;
      });
    }
  }, [isNative, offlineSongs, downloading]);

  const removeOffline = useCallback(async (videoId: string): Promise<void> => {
    if (!isNative || !offlineSongs[videoId]) return;
    try {
      await Filesystem.deleteFile({
        path: offlineSongs[videoId].filePath,
        directory: Directory.Documents,
      });
      const index = await readIndex();
      delete index.songs[videoId];
      await writeIndex(index);
      setOfflineSongs(prev => {
        const next = { ...prev };
        delete next[videoId];
        return next;
      });
    } catch (err: any) {
      console.error('[useOfflineStorage] remove failed:', err.message);
    }
  }, [isNative, offlineSongs]);

  const getAllOfflineSongs = useCallback((): OfflineSong[] => {
    return Object.values(offlineSongs).sort((a, b) => b.savedAt - a.savedAt);
  }, [offlineSongs]);

  const getTotalSize = useCallback((): number => {
    return Object.values(offlineSongs).reduce((sum, s) => sum + s.sizeBytes, 0);
  }, [offlineSongs]);

  return {
    isNative,
    isOffline,
    isDownloading,
    getProgress,
    getLocalUri,
    saveForOffline,
    removeOffline,
    getAllOfflineSongs,
    getTotalSize,
    offlineSongs,
  };
};

// ── utils ─────────────────────────────────────────────────────────────────────

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data URL prefix — Capacitor wants raw base64
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });