'use client';

import React, { useState, useEffect } from 'react';
import { getItemImageSync } from "../../lib/itemImageUtils";

export default function TestSteamImagesPage() {
  const [imageUrls, setImageUrls] = useState<Array<{name: string, url: string}>>([]);

  useEffect(() => {
    const testItems = [
      'AK-47 | Redline',
      'AWP | Dragon Lore', 
      'Karambit | Fade',
      'M4A4 | Howl',
      'Sport Gloves | Pandora\'s Box'
    ];

    const urls = testItems.map(item => ({
      name: item,
      url: getItemImageSync(item, 'skins')
    }));

    setImageUrls(urls);
  }, []);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Steam Image URL Test</h1>
      <p className="text-gray-600">Testing the actual URLs being generated for Steam images</p>
      
      <div className="space-y-4">
        {imageUrls.map((item, index) => (
          <div key={index} className="border p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-gray-600 break-all">{item.url}</p>
            <div className="mt-2">
              <img 
                src={item.url} 
                alt={item.name}
                className="w-32 h-24 object-contain border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-32 h-24 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                Failed to load
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold text-lg mb-2">Direct Steam URL Test</h2>
        <p className="text-sm text-gray-600 mb-4">Testing direct Steam Community API URLs:</p>
        
        <div className="space-y-2">
          <div>
            <p className="text-sm font-mono">https://steamcommunity-a.akamaihd.net/economy/image/ak47_redline</p>
            <img 
              src="https://steamcommunity-a.akamaihd.net/economy/image/ak47_redline" 
              alt="AK-47 Redline"
              className="w-32 h-24 object-contain border mt-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-32 h-24 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              Failed to load
            </div>
          </div>
          
          <div>
            <p className="text-sm font-mono">https://steamcommunity-a.akamaihd.net/economy/image/awp_dragon_lore</p>
            <img 
              src="https://steamcommunity-a.akamaihd.net/economy/image/awp_dragon_lore" 
              alt="AWP Dragon Lore"
              className="w-32 h-24 object-contain border mt-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-32 h-24 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              Failed to load
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
