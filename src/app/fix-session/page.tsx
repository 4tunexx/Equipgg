'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FixSessionPage() {
  const [currentToken, setCurrentToken] = useState<string>('Loading...');
  const [status, setStatus] = useState<string>('');
  const router = useRouter();
  const newToken = '7ea049d4-8a66-407d-bdc3-ad6e13e60f01';

  useEffect(() => {
    // Get current session cookie from server
    const fetchCurrentToken = async () => {
      try {
        const response = await fetch('/api/fix-session');
        const result = await response.json();
        setCurrentToken(result.currentToken || 'No session cookie found');
      } catch {
        setCurrentToken('Error loading current token');
      }
    };
    
    fetchCurrentToken();
  }, []);

  const fixSession = async () => {
    try {
      setStatus('Updating session...');
      
      // Use server-side API to set the session cookie
      const response = await fetch('/api/fix-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newToken }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setStatus('✅ Session cookie updated successfully!');
        setCurrentToken(newToken);
        
        // Test the API endpoint
        const statsResponse = await fetch('/api/user/stats');
        if (statsResponse.ok) {
          setStatus('✅ Session working! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('⚠️ Cookie updated but API still returns error. Please try logging in manually.');
        }
      } else {
        setStatus(`❌ Failed to update cookie: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Fix Browser Session</h1>
        <p className="mb-8 text-gray-300">
          This page will fix your browser session cookie to resolve the mini profile balance issue.
        </p>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Current Session Token:</h3>
            <div className="bg-gray-700 p-3 rounded font-mono text-sm break-all">
              {currentToken}
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">New Session Token:</h3>
            <div className="bg-gray-700 p-3 rounded font-mono text-sm break-all">
              {newToken}
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <button 
              onClick={fixSession}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🔄 Fix Session Cookie
            </button>
            {status && (
              <div className="mt-4 p-3 rounded" style={{
                backgroundColor: status.includes('✅') ? '#065f46' : status.includes('❌') ? '#7f1d1d' : '#1f2937',
                color: status.includes('✅') ? '#10b981' : status.includes('❌') ? '#ef4444' : '#d1d5db'
              }}>
                {status}
              </div>
            )}
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">After fixing:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Click the &quot;Fix Session Cookie&quot; button above</li>
              <li>Wait for the success message</li>
              <li>You'll be automatically redirected to the dashboard</li>
              <li>Your balance should show: <strong className="text-green-400">3,961 coins, 100 gems, 533 XP</strong></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}