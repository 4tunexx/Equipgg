'use client';

import { useState } from 'react';
import { getItemImageSync } from "../../lib/itemImageUtils";

export default function TestCS2ImagesPage() {
  const [testResults, setTestResults] = useState<Array<{name: string, url: string, status: string}>>([]);

  const testItems = [
    'AK-47 | Redline',
    'AWP | Dragon Lore', 
    'Karambit | Doppler',
    'Sport Gloves | Pandora\'s Box',
    'Seal Team 6 Soldier | Chem-Haz Specialist'
  ];

  const testImageUrls = async () => {
    const results = [];
    
    for (const itemName of testItems) {
      const url = getItemImageSync(itemName);
      results.push({
        name: itemName,
        url: url,
        status: 'Generated'
      });
    }
    
    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">CS2 Image URL Test</h1>
        
        <button 
          onClick={testImageUrls}
          className="mb-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Test Image URLs
        </button>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Results:</h2>
            {testResults.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{result.name}</h3>
                <p className="text-sm text-muted-foreground break-all">
                  URL: {result.url}
                </p>
                <p className="text-sm">Status: {result.status}</p>
                
                {/* Test the actual image */}
                <div className="mt-2">
                  <img 
                    src={result.url} 
                    alt={result.name}
                    className="w-32 h-24 object-contain border"
                    onLoad={() => {
                      setTestResults(prev => prev.map((r, i) => 
                        i === index ? {...r, status: 'Loaded Successfully'} : r
                      ));
                    }}
                    onError={() => {
                      setTestResults(prev => prev.map((r, i) => 
                        i === index ? {...r, status: 'Failed to Load'} : r
                      ));
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Expected Behavior:</h2>
          <ul className="space-y-2 text-sm">
            <li>• URLs should be generated for each item</li>
            <li>• Images should load from CSGODatabase or fallback sources</li>
            <li>• Failed images should show placeholder</li>
            <li>• Status should update to "Loaded Successfully" or "Failed to Load"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
