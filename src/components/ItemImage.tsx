'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getItemImage, getItemImageSync, preloadImage } from '@/lib/itemImageUtils';

interface ItemImageProps {
  itemName: string;
  itemType?: 'skins' | 'knives' | 'gloves' | 'agents';
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

export default function ItemImage({
  itemName,
  itemType,
  width = 200,
  height = 150,
  className = '',
  priority = false,
  quality = 75,
  onLoad,
  onError,
  fallbackSrc = '/assets/placeholder.svg'
}: ItemImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get initial image URL synchronously for faster initial render
  const initialSrc = getItemImageSync(itemName, itemType);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Check if we're on the client side
        if (typeof window === 'undefined') {
          setImageSrc(fallbackSrc);
          setIsLoading(false);
          return;
        }

        // First, try the synchronous URL
        if (initialSrc !== fallbackSrc) {
          try {
            await preloadImage(initialSrc);
            if (isMounted) {
              setImageSrc(initialSrc);
              setIsLoading(false);
              onLoad?.();
              return;
            }
          } catch (error) {
            console.warn(`Failed to load image: ${initialSrc}`, error);
          }
        }

        // If synchronous URL failed, try the async method
        const asyncSrc = await getItemImage(itemName, itemType);
        if (isMounted) {
          setImageSrc(asyncSrc);
          setIsLoading(false);
          onLoad?.();
        }
      } catch (error) {
        console.error(`Error loading image for item: ${itemName}`, error);
        if (isMounted) {
          setImageSrc(fallbackSrc);
          setIsLoading(false);
          setHasError(true);
          onError?.();
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [itemName, itemType, initialSrc, fallbackSrc, onLoad, onError]);

  const handleImageError = useCallback(() => {
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
      onError?.();
    }
  }, [imageSrc, fallbackSrc, onError]);

  if (hasError && imageSrc === fallbackSrc) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-center">No Image</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      <Image
        src={imageSrc}
        alt={itemName}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        priority={priority}
        quality={quality}
        onError={handleImageError}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        unoptimized={imageSrc.startsWith('https://www.csgodatabase.com')}
      />
    </div>
  );
}

// Hook for preloading multiple item images
export function useItemImagesPreload(itemNames: string[], itemTypes?: ('skins' | 'knives' | 'gloves' | 'agents')[]) {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    if (itemNames.length === 0) return;

    const preloadImages = async () => {
      setIsPreloading(true);
      const urls = itemNames.map((name, index) => 
        getItemImageSync(name, itemTypes?.[index])
      );
      
      try {
        const { preloadImages } = await import('@/lib/itemImageUtils');
        await preloadImages(urls);
        setPreloadedImages(new Set(urls));
      } catch (error) {
        console.error('Error preloading images:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    preloadImages();
  }, [itemNames, itemTypes]);

  return { preloadedImages, isPreloading };
}
