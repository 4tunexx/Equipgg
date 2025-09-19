'use client';

import React from 'react';
import ItemImage from "../../components/ItemImage";

export default function TestWorkingImagesPage() {
  const testItems = [
    { name: 'AK-47 | Redline', type: 'skins' as const },
    { name: 'AWP | Dragon Lore', type: 'skins' as const },
    { name: 'Karambit | Fade', type: 'knives' as const },
    { name: 'M4A4 | Howl', type: 'skins' as const },
    { name: 'Sport Gloves | Pandora\'s Box', type: 'gloves' as const },
    { name: 'Seal Team 6 Soldier | Chem-Haz Specialist', type: 'agents' as const },
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Working CS2 Images Test</h1>
      <p className="text-gray-600">Testing the ItemImage component with real CS2 items</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {testItems.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 text-center">
            <h3 className="font-semibold text-sm mb-2">{item.name}</h3>
            <div className="flex justify-center">
              <ItemImage
                itemName={item.name}
                itemType={item.type}
                width={150}
                height={112}
                className="border rounded"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{item.type}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold text-lg mb-2">Direct URL Test</h2>
        <p className="text-sm text-gray-600 mb-4">Testing direct CSGODatabase URLs:</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs font-mono mb-2">AK-47 Redline</p>
            <img 
              src="https://www.csgodatabase.com/images/skins/webp/ak47_redline.webp" 
              alt="AK-47 Redline"
              className="w-24 h-18 object-contain border mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-24 h-18 bg-gray-200 flex items-center justify-center text-xs text-gray-500 mx-auto">
              Failed
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs font-mono mb-2">AWP Dragon Lore</p>
            <img 
              src="https://www.csgodatabase.com/images/skins/webp/awp_dragon_lore.webp" 
              alt="AWP Dragon Lore"
              className="w-24 h-18 object-contain border mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-24 h-18 bg-gray-200 flex items-center justify-center text-xs text-gray-500 mx-auto">
              Failed
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs font-mono mb-2">Karambit Fade</p>
            <img 
              src="https://www.csgodatabase.com/images/knives/webp/karambit_fade.webp" 
              alt="Karambit Fade"
              className="w-24 h-18 object-contain border mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-24 h-18 bg-gray-200 flex items-center justify-center text-xs text-gray-500 mx-auto">
              Failed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
