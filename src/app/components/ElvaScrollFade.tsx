import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from './ui/utils';

interface ElvaScrollFadeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/** Wraps scrollable regions and shows a bottom fade when more content exists below. */
export function ElvaScrollFade({ children, className, ...props }: ElvaScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 8;
    const notAtBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 8;
    setCanScroll(hasOverflow && notAtBottom);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [update, children]);

  return (
    <div
      ref={ref}
      data-can-scroll={canScroll ? 'true' : 'false'}
      className={cn('elva-scroll-fade', className)}
      {...props}
    >
      {children}
    </div>
  );
}
