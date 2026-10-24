import { AdAnimation, AdAnimationSpeed, AdBanner, AdTextEffect } from '../types';

export const AD_ANIMATIONS: { value: AdAnimation; label: string; help: string }[] = [
  { value: 'none', label: 'No animation', help: 'The picture stays still' },
  { value: 'zoom-in', label: 'Slow zoom in', help: 'Slowly moves closer' },
  { value: 'zoom-out', label: 'Slow zoom out', help: 'Starts close, pulls back' },
  { value: 'pan-left', label: 'Pan left', help: 'Drifts sideways, back and forth' },
  { value: 'pan-right', label: 'Pan right', help: 'Drifts the other way' },
  { value: 'pan-up', label: 'Pan up', help: 'Drifts upward, back and forth' },
  { value: 'fade-in', label: 'Fade in', help: 'Appears gently' },
  { value: 'slide-left', label: 'Slide in from right', help: 'Slides in and stops' },
  { value: 'slide-right', label: 'Slide in from left', help: 'Slides in and stops' },
  { value: 'slide-up', label: 'Slide up', help: 'Rises into place' },
  { value: 'flip', label: 'Flip in', help: '3D turn into view' },
  { value: 'bounce', label: 'Bounce', help: 'Bobs up and down' },
  { value: 'pulse', label: 'Pulse (heartbeat)', help: 'Grows and shrinks' },
  { value: 'float', label: 'Float', help: 'Floats around softly' },
  { value: 'shake', label: 'Wiggle', help: 'Small rocking motion to catch the eye' },
  { value: 'shimmer', label: 'Shimmer', help: 'Brightness glows in and out' },
];

export const AD_TEXT_EFFECTS: { value: AdTextEffect; label: string }[] = [
  { value: 'rise', label: 'Rise up' },
  { value: 'fade', label: 'Fade in' },
  { value: 'slide', label: 'Slide from left' },
  { value: 'pop', label: 'Pop' },
  { value: 'none', label: 'No text animation' },
];

export const AD_SPEEDS: { value: AdAnimationSpeed; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

export const DEFAULT_AD_ANIMATION: AdAnimation = 'none';
export const DEFAULT_AD_TEXT_EFFECT: AdTextEffect = 'rise';
export const DEFAULT_AD_SPEED: AdAnimationSpeed = 'normal';

const known = <T extends string>(list: { value: T }[], v: unknown, fallback: T): T =>
  list.some((x) => x.value === v) ? (v as T) : fallback;

/** CSS classes for the ad picture (safe against old ads that have no animation saved) */
export const adImageClass = (ad: Pick<AdBanner, 'animation' | 'animationSpeed'>): string => {
  const a = known(AD_ANIMATIONS, ad.animation, DEFAULT_AD_ANIMATION);
  const s = known(AD_SPEEDS, ad.animationSpeed, DEFAULT_AD_SPEED);
  return a === 'none' ? '' : `ad-anim ad-anim-${a} ad-speed-${s}`;
};

export const adTextClass = (ad: Pick<AdBanner, 'textEffect'>): string => {
  const t = known(AD_TEXT_EFFECTS, ad.textEffect, DEFAULT_AD_TEXT_EFFECT);
  return t === 'none' ? '' : `ad-text-${t}`;
};

export const animationLabel = (a?: AdAnimation) => AD_ANIMATIONS.find((x) => x.value === a)?.label || 'No animation';
