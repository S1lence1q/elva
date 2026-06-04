import React from 'react';
import { cn } from './ui/utils';

export type ElvaPanelVariant = 'glass' | 'elevated' | 'chrome' | 'frosted' | 'chip' | 'soft';

const variantClass: Record<ElvaPanelVariant, string> = {
  glass: 'elva-glass',
  elevated: 'elva-glass-elevated',
  chrome: 'elva-glass-chrome',
  frosted: 'elva-glass-frosted',
  chip: 'elva-chip-active',
  soft: 'elva-glass-soft',
};

export interface ElvaPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ElvaPanelVariant;
  insetLine?: boolean;
  as?: 'div' | 'section' | 'article';
}

export function ElvaPanel({
  variant = 'glass',
  insetLine = false,
  as: Tag = 'div',
  className,
  children,
  ...props
}: ElvaPanelProps) {
  return (
    <Tag
      className={cn(
        'relative',
        variantClass[variant],
        insetLine && 'elva-inset-line',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
