'use client';

import ItemImage from '@/components/ItemImage';

export default function TestImagesPage() {
  const testItems = [
    { name: 'AK-47 | Redline', type: 'skins' as const },
    { name: 'AWP | Dragon Lore', type: 'skins' as const },
    { name: 'Karambit | Doppler', type: 'knives' as const },
    { name: 'Sport Gloves | Pandora\'s Box', type: 'gloves' as const },
    { name: 'Seal Team 6 Soldier | Chem-Haz Specialist', type: 'agents' as const },
    { name: 'Non-existent Item', type: 'skins' as const }, // This should show placeholder
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">CS2 Image Integration Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testItems.map((item, index) => (
            <div key={index} className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">{item.name}</h3>
              <div className="flex justify-center">
                <ItemImage
                  itemName={item.name}
                  itemType={item.type}
                  width={200}
                  height={150}
                  className="border rounded"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Type: {item.type}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>AK-47 | Redline</strong> - Should show real CS2 skin image</li>
            <li>✅ <strong>AWP | Dragon Lore</strong> - Should show real CS2 skin image</li>
            <li>✅ <strong>Karambit | Doppler</strong> - Should show real CS2 knife image</li>
            <li>✅ <strong>Sport Gloves | Pandora's Box</strong> - Should show real CS2 gloves image</li>
            <li>✅ <strong>Seal Team 6 Soldier</strong> - Should show real CS2 agent image</li>
            <li>⚠️ <strong>Non-existent Item</strong> - Should show placeholder image</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">Expected Behavior:</h3>
          <ul className="text-sm space-y-1">
            <li>• Real CS2 items should load images from CSGODatabase</li>
            <li>• Non-existent items should show placeholder</li>
            <li>• Images should load with smooth transitions</li>
            <li>• No broken image icons should appear</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
