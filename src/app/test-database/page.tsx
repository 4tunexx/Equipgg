'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  results: {
    databaseType: string;
    connection: string;
    timestamp: string;
    tests: {
      findOne: boolean;
      findMany: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      rawQuery: boolean;
    };
  };
  transactionSupported: boolean;
  environment: {
    nodeEnv: string;
    databaseType: string;
    hasDatabaseUrl: boolean;
  };
}

export default function TestDatabasePage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState({
    action: 'findOne',
    table: 'users',
    where: '{"id": "test"}',
    data: '{"email": "test@example.com"}'
  });

  const runDatabaseTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-database');
      const data = await response.json();
      
      if (response.ok) {
        setTestResult(data);
      } else {
        setError(data.error || 'Test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runCustomQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        action: customQuery.action,
        table: customQuery.table,
        where: customQuery.action !== 'create' ? JSON.parse(customQuery.where) : undefined,
        data: customQuery.action === 'create' || customQuery.action === 'update' ? JSON.parse(customQuery.data) : undefined
      };

      const response = await fetch('/api/test-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResult(prev => ({
          ...prev!,
          customQueryResult: data
        }));
      } else {
        setError(data.error || 'Custom query failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDatabaseTest();
  }, []);

  const getTestStatus = (test: boolean) => {
    return test ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Pass
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Fail
      </Badge>
    );
  };

  const allTestsPassed = testResult?.results.tests ? 
    Object.values(testResult.results.tests).every(test => test === true) : false;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-500" />
            Database Connection Test
            <Badge variant="secondary" className="ml-auto">
              {testResult?.results.databaseType || 'Unknown'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                Test the database abstraction layer and verify connection to your configured database.
              </p>
              {testResult && (
                <div className="mt-2 text-sm">
                  <p>Environment: {testResult.environment.nodeEnv}</p>
                  <p>Database Type: {testResult.environment.databaseType}</p>
                  <p>Has Database URL: {testResult.environment.hasDatabaseUrl ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
            <Button onClick={runDatabaseTest} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Test Results
              {allTestsPassed ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  All Tests Passed
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Some Tests Failed
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Find One</Label>
                {getTestStatus(testResult.results.tests.findOne)}
              </div>
              <div className="space-y-2">
                <Label>Find Many</Label>
                {getTestStatus(testResult.results.tests.findMany)}
              </div>
              <div className="space-y-2">
                <Label>Create</Label>
                {getTestStatus(testResult.results.tests.create)}
              </div>
              <div className="space-y-2">
                <Label>Update</Label>
                {getTestStatus(testResult.results.tests.update)}
              </div>
              <div className="space-y-2">
                <Label>Delete</Label>
                {getTestStatus(testResult.results.tests.delete)}
              </div>
              <div className="space-y-2">
                <Label>Raw Query</Label>
                {getTestStatus(testResult.results.tests.rawQuery)}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Connection Details</h4>
              <p className="text-sm text-muted-foreground">
                Database Type: {testResult.results.databaseType}
              </p>
              <p className="text-sm text-muted-foreground">
                Connection Status: {testResult.results.connection}
              </p>
              <p className="text-sm text-muted-foreground">
                Transaction Support: {testResult.transactionSupported ? 'Yes' : 'No'}
              </p>
              <p className="text-sm text-muted-foreground">
                Tested At: {new Date(testResult.results.timestamp).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Custom Query Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Query Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Operations</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Queries</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="action">Action</Label>
                  <Select value={customQuery.action} onValueChange={(value) => setCustomQuery(prev => ({ ...prev, action: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="findOne">Find One</SelectItem>
                      <SelectItem value="findMany">Find Many</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="table">Table</Label>
                  <Input
                    id="table"
                    value={customQuery.table}
                    onChange={(e) => setCustomQuery(prev => ({ ...prev, table: e.target.value }))}
                    placeholder="users"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="where">Where Clause (JSON)</Label>
                <Textarea
                  id="where"
                  value={customQuery.where}
                  onChange={(e) => setCustomQuery(prev => ({ ...prev, where: e.target.value }))}
                  placeholder='{"id": "test"}'
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="data">Data (JSON)</Label>
                <Textarea
                  id="data"
                  value={customQuery.data}
                  onChange={(e) => setCustomQuery(prev => ({ ...prev, data: e.target.value }))}
                  placeholder='{"email": "test@example.com"}'
                  rows={3}
                />
              </div>
              
              <Button onClick={runCustomQuery} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Query...
                  </>
                ) : (
                  'Run Custom Query'
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Raw SQL Queries</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  For advanced testing, you can use the POST endpoint directly with raw SQL:
                </p>
                <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
                  <div>POST /api/test-database</div>
                  <div>{'{'}</div>
                  <div>  "action": "raw",</div>
                  <div>  "data": {'{'}</div>
                  <div>    "sql": "SELECT * FROM users LIMIT 5",</div>
                  <div>    "params": []</div>
                  <div>  {'}'}</div>
                  <div>{'}'}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Database Information */}
      <Card>
        <CardHeader>
          <CardTitle>Database Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Local Development (SQLite)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Uses sql.js for in-memory SQLite</li>
                <li>• No external database required</li>
                <li>• Perfect for development and testing</li>
                <li>• Data persists in .data/equipgg.sqlite</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Production (PostgreSQL)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Uses Prisma with PostgreSQL</li>
                <li>• Supports Neon, Supabase, or self-hosted</li>
                <li>• Full ACID compliance</li>
                <li>• Scalable and production-ready</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Switching Databases</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              To switch between databases, simply change the DATABASE_TYPE environment variable:
            </p>
            <div className="mt-2 bg-black text-green-400 p-2 rounded font-mono text-xs">
              DATABASE_TYPE=sqlite # For local development<br/>
              DATABASE_TYPE=postgresql # For production
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
