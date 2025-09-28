'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TeamLogoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
}

export function TeamLogo({ 
  src, 
  alt, 
  width = 32, 
  height = 32, 
  className = '',
  fallbackSrc = '/default-team-logo.svg'
}: TeamLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // Use proxy for external images (especially HLTV)
  const getProxiedSrc = (originalSrc: string) => {
    if (!originalSrc || typeof originalSrc !== 'string') {
      return fallbackSrc;
    }
    if (originalSrc.includes('hltv.org') || originalSrc.includes('img-cdn.hltv.org')) {
      return `/api/proxy/image?url=${encodeURIComponent(originalSrc)}`;
    }
    return originalSrc;
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
    } else if (!fallbackError) {
      setFallbackError(true);
    }
  };

  // If both images fail, show a placeholder
  if (imageError && fallbackError) {
    return (
      <div 
        className={`bg-secondary rounded-full flex items-center justify-center text-muted-foreground text-xs font-semibold ${className}`}
        style={{ width, height }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  const finalSrc = imageError ? fallbackSrc : getProxiedSrc(src);

  return (
    <Image
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleImageError}
      unoptimized={src.includes('hltv.org')} // Disable optimization for external images
    />
  );
}
