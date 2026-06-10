import { useEffect, useState } from 'react';
import { NativeAudio } from '@capgo/capacitor-native-audio';
import { IS_NATIVE } from '@/utils/audioBackend';

type LogEntry = { t: string; msg: string; color: string };

export default function DebugOverlay() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const push = (msg: string, color = '#1D9E75') =>
    setLogs(p => [{ t: new Date().toLocaleTimeString(), msg, color }, ...p].slice(0, 40));

  useEffect(() => {
    if (!IS_NATIVE) return;
    push('overlay mounted', '#888');

    // Watch every currentTime event
    const timeSub = NativeAudio.addListener('currentTime', (d: any) => {
      const hasDur = d.duration != null && d.duration > 0;
      push(
        `currentTime id=${d.assetId} t=${d.currentTime?.toFixed(1)} dur=${d.duration ?? 'MISSING'}`,
        hasDur ? '#1D9E75' : '#D85A30'
      );
    });

    // Watch playbackState events
    const stateSub = NativeAudio.addListener('playbackState', (d: any) => {
      push(`playbackState id=${d.assetId} state=${d.state}`, '#7F77DD');
    });

    // Patch getDuration — log every call result
    const origGet = NativeAudio.getDuration.bind(NativeAudio);
    (NativeAudio as any).getDuration = async (opts: any) => {
      const result = await origGet(opts);
      push(`getDuration(${opts.assetId}) → ${result.duration}`,
        result.duration > 0 ? '#1D9E75' : '#BA7517');
      return result;
    };

    return () => {
      timeSub.then(s => s.remove());
      stateSub.then(s => s.remove());
      (NativeAudio as any).getDuration = origGet;
    };
  }, []);

  if (!IS_NATIVE) return null;

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      maxHeight: '220px', overflowY: 'auto',
      background: 'rgba(0,0,0,0.82)', padding: '8px', zIndex: 9999
    }}>
      {logs.map((l, i) => (
        <div key={i} style={{ fontSize: 10, color: l.color, lineHeight: '1.5' }}>
          <span style={{ color: '#555', marginRight: 6 }}>{l.t}</span>{l.msg}
        </div>
      ))}
    </div>
  );
}