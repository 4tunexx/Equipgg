'use client';

import { useState } from 'react';

export default function TestLoginPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...');
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'admin@equipgg.net', 
          password: 'admin123' 
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Login successful! User: ${data.user.email}, Role: ${data.user.role}`);
        
        // Test redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setResult(`❌ Login failed: ${data.message}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Test Login</h1>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? 'Testing...' : 'Test Admin Login'}
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded border">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Email: admin@equipgg.net</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  );
}