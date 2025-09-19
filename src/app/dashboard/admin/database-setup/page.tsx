'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Database, Play } from 'lucide-react';

export default function DatabaseSetupPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const runDatabaseSetup = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setError(null);
    setCompleted(false);

    try {
      // Step 1: Create tables
      setProgress(20);
      setResults(prev => [...prev, "🏗️ Creating database tables..."]);
      
      const createTablesResponse = await fetch('/api/admin/database/create-tables', {
        method: 'POST',
      });
      
      if (!createTablesResponse.ok) {
        throw new Error('Failed to create tables');
      }
      
      setProgress(40);
      setResults(prev => [...prev, "✅ Database tables created successfully"]);

      // Step 2: Populate with sample data
      setProgress(60);
      setResults(prev => [...prev, "📊 Populating with sample data..."]);
      
      const populateResponse = await fetch('/api/admin/database/populate', {
        method: 'POST',
      });
      
      if (!populateResponse.ok) {
        throw new Error('Failed to populate data');
      }
      
      const data = await populateResponse.json();
      
      setProgress(80);
      setResults(prev => [...prev, `✅ Inserted ${data.achievements} achievements`]);
      setResults(prev => [...prev, `✅ Inserted ${data.items} items`]);
      setResults(prev => [...prev, `✅ Inserted ${data.missions} missions`]);
      setResults(prev => [...prev, `✅ Inserted ${data.perks} perks`]);
      setResults(prev => [...prev, `✅ Inserted ${data.badges} badges`]);

      // Step 3: Verify data
      setProgress(100);
      setResults(prev => [...prev, "🔍 Verifying database setup..."]);
      
      const verifyResponse = await fetch('/api/admin/database/verify');
      const verifyData = await verifyResponse.json();
      
      setResults(prev => [...prev, `📊 Database verification complete:`]);
      setResults(prev => [...prev, `   - Achievements: ${verifyData.achievements}`]);
      setResults(prev => [...prev, `   - Items: ${verifyData.items}`]);
      setResults(prev => [...prev, `   - Missions: ${verifyData.missions}`]);
      setResults(prev => [...prev, `   - Perks: ${verifyData.perks}`]);
      setResults(prev => [...prev, `   - Badges: ${verifyData.badges}`]);
      
      setCompleted(true);
      setResults(prev => [...prev, "🎉 Database setup completed successfully!"]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setResults(prev => [...prev, `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Database Setup</h1>
          <p className="text-muted-foreground">Initialize the database with game content</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            CS2 Gambling Platform Database Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This will create and populate your database with:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              50+ Achievements (betting, economic, progression, social)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              50+ Badges and ranks system
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              110+ CS2 Items (skins, knives, gloves)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              59 Missions (daily and main missions across 4 tiers)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              16 Perks (XP boosts, cosmetics, utilities, betting)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Crate system with rarity distribution
            </li>
          </ul>

          {!completed && (
            <Button 
              onClick={runDatabaseSetup} 
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Database className="h-4 w-4 mr-2 animate-spin" />
                  Setting up database...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Database Setup
                </>
              )}
            </Button>
          )}

          {completed && (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  Database setup completed successfully! You can now access the admin panel to manage your content.
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full" variant="outline">
                <a href="/dashboard/admin/game-data">
                  Go to Game Data Manager
                </a>
              </Button>
            </div>
          )}

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Setup Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Setup Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm font-mono max-h-48 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="text-muted-foreground">
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}