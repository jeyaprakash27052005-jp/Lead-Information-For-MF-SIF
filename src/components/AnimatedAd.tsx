import React from 'react';
import { AdBanner } from '../types';
import { adImageClass } from '../utils/adAnimations';

type Props = {
  ad: Pick<AdBanner, 'imageUrl' | 'title' | 'animation' | 'animationSpeed'>;
  /** Changing this value restarts the animation (e.g. the slide became visible, or "Replay" was pressed) */
  playKey?: string | number;
  className?: string;
  imgClassName?: string;
};

/** The ad picture with the animation the admin chose. Clipped so zoom / pan never spills out of the box. */
export const AnimatedAd: React.FC<Props> = ({ ad, playKey, className = '', imgClassName = '' }) => (
  <div className={`overflow-hidden ${className}`}>
    <img
      key={playKey}
      src={ad.imageUrl}
      alt={ad.title}
      className={`w-full h-full object-cover object-center ${adImageClass(ad)} ${imgClassName}`}
    />
  </div>
);
