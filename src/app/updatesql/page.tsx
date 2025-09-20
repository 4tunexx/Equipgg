'use client';

import { useState } from 'react';

export default function UpdateSQLPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runMigration = async () => {
    setIsRunning(true);
    setResult('');
    setError('');

    try {
      const response = await fetch('/api/admin/migrate-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'add_steam_columns' }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.message || 'Migration completed successfully!');
      } else {
        setError(data.error || 'Migration failed');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const testDatabase = async () => {
    setIsRunning(true);
    setResult('');
    setError('');

    try {
      const response = await fetch('/api/admin/migrate-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test_steam_columns' }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.message || 'Database test completed!');
      } else {
        setError(data.error || 'Database test failed');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🔧 Database Migration Tool
        </h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Fix Authentication Issue</h2>
          <p className="text-gray-300 mb-6">
            This will add the missing Steam authentication columns to the users table.
            This should fix the "stuck on signing in" issue.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={testDatabase}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isRunning ? '🔍 Testing...' : '🔍 Test Database Schema'}
            </button>
            
            <button
              onClick={runMigration}
              disabled={isRunning}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isRunning ? '⚡ Running Migration...' : '⚡ Run Migration - Fix Authentication'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {(result || error) && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Results:</h3>
            
            {result && (
              <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-4">
                <h4 className="text-green-400 font-medium mb-2">✅ Success:</h4>
                <pre className="text-green-200 whitespace-pre-wrap text-sm">{result}</pre>
              </div>
            )}
            
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">❌ Error:</h4>
                <pre className="text-red-200 whitespace-pre-wrap text-sm">{error}</pre>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">📋 What this does:</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• Adds missing <code className="bg-gray-700 px-2 py-1 rounded">steam_id</code> column to users table</li>
            <li>• Adds <code className="bg-gray-700 px-2 py-1 rounded">steam_verified</code> and <code className="bg-gray-700 px-2 py-1 rounded">account_status</code> columns</li>
            <li>• Adds <code className="bg-gray-700 px-2 py-1 rounded">username</code>, <code className="bg-gray-700 px-2 py-1 rounded">coins</code>, <code className="bg-gray-700 px-2 py-1 rounded">xp</code>, and other required columns</li>
            <li>• Creates database indexes for better performance</li>
            <li>• Sets default values for existing users</li>
          </ul>
          
          <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg">
            <p className="text-yellow-200">
              <strong>⚠️ Important:</strong> Run the test first to see what's missing, then run the migration to fix it.
              After running the migration, try logging in again - it should work!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}