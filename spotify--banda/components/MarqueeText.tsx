// components/MarqueeText.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

export default function MarqueeText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;
    setShouldScroll(textEl.scrollWidth > container.offsetWidth);
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <span
        ref={textRef}
        style={shouldScroll ? {
          display: 'inline-block',
          animation: 'marquee 8s linear 1.5s infinite',
          paddingRight: '3rem',
        } : { display: 'inline-block' }}
      >
        {text}
      </span>
    </div>
  );
}