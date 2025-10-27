"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CheckCircle2, XCircle, Loader2, Home } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [reward, setReward] = useState(0);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          setReward(data.reward || 10);
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Email verification failed. The link may have expired.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <CardTitle>Verifying Email...</CardTitle>
              <CardDescription>Please wait while we confirm your email address</CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-green-600">Email Verified!</CardTitle>
              <CardDescription>Your email has been successfully confirmed</CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-red-600">Verification Failed</CardTitle>
              <CardDescription>We couldn't verify your email</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'verifying' && (
            <p className="text-center text-muted-foreground">
              This should only take a moment...
            </p>
          )}

          {status === 'success' && (
            <>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
                  🎉 Congratulations!
                </p>
                <p className="text-green-700 dark:text-green-300">
                  You've earned <strong>{reward} coins</strong> as a reward!
                </p>
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                {message}
              </p>
              
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to dashboard in 3 seconds...
              </p>

              <Link href="/dashboard" className="block">
                <Button className="w-full" size="lg">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard Now
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm text-center">
                  {message}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Possible reasons:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>The verification link has expired (24 hours)</li>
                  <li>The link has already been used</li>
                  <li>The link is invalid or corrupted</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Link href="/dashboard/profile" className="block">
                  <Button className="w-full" variant="default">
                    Request New Verification Email
                  </Button>
                </Link>
                
                <Link href="/dashboard" className="block">
                  <Button className="w-full" variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
