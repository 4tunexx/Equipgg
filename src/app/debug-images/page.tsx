'use client';

import React, { useState } from 'react';

export default function DebugImagesPage() {
  const [testResults, setTestResults] = useState<Array<{url: string, status: string, error?: string}>>([]);
  const [testing, setTesting] = useState(false);

  const testUrls = [
    // CSGODatabase URLs with correct case (verified working patterns)
    'https://www.csgodatabase.com/images/skins/webp/AK-47_Redline.webp',
    'https://www.csgodatabase.com/images/skins/webp/AWP_Dragon_Lore.webp',
    'https://www.csgodatabase.com/images/knives/webp/Karambit_Fade.webp',
    'https://www.csgodatabase.com/images/skins/webp/M4A4_Howl.webp',
    
    // Test some other known working items
    'https://www.csgodatabase.com/images/skins/webp/Glock-18_Fade.webp',
    'https://www.csgodatabase.com/images/skins/webp/USP-S_Kill_Confirmed.webp',
    'https://www.csgodatabase.com/images/knives/webp/Butterfly_Knife_Fade.webp',
    'https://www.csgodatabase.com/images/skins/webp/Desert_Eagle_Blaze.webp',
    'https://www.csgodatabase.com/images/agents/webp/Special_Agent_Ava_FBI.webp',
  ];

  const testImageUrl = async (url: string) => {
    return new Promise<{url: string, status: string, error?: string}>((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        resolve({ url, status: 'timeout', error: 'Request timed out after 10 seconds' });
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve({ url, status: 'success' });
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve({ url, status: 'error', error: 'Failed to load image' });
      };

      img.src = url;
    });
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);

    const results = [];
    for (const url of testUrls) {
      const result = await testImageUrl(url);
      results.push(result);
      setTestResults([...results]);
    }

    setTesting(false);
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Image URL Debug Test</h1>
      <p className="text-gray-600">Testing actual image URLs to see which ones work</p>
      
      <button 
        onClick={runTests}
        disabled={testing}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Run Image Tests'}
      </button>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>
          {testResults.map((result, index) => (
            <div key={index} className={`border p-4 rounded-lg ${
              result.status === 'success' ? 'bg-green-50 border-green-200' :
              result.status === 'error' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  result.status === 'success' ? 'bg-green-200 text-green-800' :
                  result.status === 'error' ? 'bg-red-200 text-red-800' :
                  'bg-yellow-200 text-yellow-800'
                }`}>
                  {result.status.toUpperCase()}
                </span>
                <span className="text-sm font-mono break-all">{result.url}</span>
              </div>
              {result.error && (
                <p className="text-sm text-red-600">{result.error}</p>
              )}
              {result.status === 'success' && (
                <img 
                  src={result.url} 
                  alt="Test image"
                  className="w-32 h-24 object-contain border mt-2"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-lg mb-2">Working CSGODatabase URL Patterns:</h2>
        <div className="space-y-2 text-sm font-mono">
          <p>✅ https://www.csgodatabase.com/images/skins/webp/AK-47_Redline.webp</p>
          <p>✅ https://www.csgodatabase.com/images/skins/webp/AWP_Dragon_Lore.webp</p>
          <p>✅ https://www.csgodatabase.com/images/knives/webp/Karambit_Fade.webp</p>
          <p>✅ https://www.csgodatabase.com/images/skins/webp/M4A4_Howl.webp</p>
          <p>✅ https://www.csgodatabase.com/images/skins/webp/Desert_Eagle_Blaze.webp</p>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          <strong>Pattern:</strong> Exact case + underscores for spaces + keep hyphens (AK-47, Glock-18, USP-S)
        </p>
      </div>
    </div>
  );
}
