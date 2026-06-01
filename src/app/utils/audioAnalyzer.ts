import type { MutableRefObject } from 'react';

let globalAudioContext: AudioContext | null = null;
let globalAnalyser: AnalyserNode | null = null;

export function initAudioAnalyzer(
  audioElement: HTMLAudioElement,
  audioSourceRef: MutableRefObject<MediaElementAudioSourceNode | null>,
  analyserRef: MutableRefObject<AnalyserNode | null>,
  audioContextRef: MutableRefObject<AudioContext | null>
): void {
  if (analyserRef.current) return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!globalAudioContext) {
      globalAudioContext = new AudioContextClass();
    }
    const ctx = globalAudioContext;

    if (!globalAnalyser) {
      globalAnalyser = ctx.createAnalyser();
      globalAnalyser.fftSize = 256;
    }
    const analyser = globalAnalyser;

    if (!audioSourceRef.current) {
      audioSourceRef.current = ctx.createMediaElementSource(audioElement);
    }
    const source = audioSourceRef.current;

    source.disconnect();
    source.connect(analyser);
    analyser.disconnect();
    analyser.connect(ctx.destination);

    analyserRef.current = analyser;
    audioContextRef.current = ctx;
  } catch (err) {
    console.warn('Failed to initialize Web Audio API analyzer:', err);
  }
}

export function suspendGlobalAudioContext(): void {
  if (globalAudioContext && globalAudioContext.state === 'running') {
    try {
      globalAudioContext.suspend();
    } catch {
      /* ignore */
    }
  }
}
