'use client';

import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from './auth-provider';
import { useToast } from '../hooks/use-toast';

interface SteamVerificationGateProps {
  children: React.ReactNode;
}


export function SteamVerificationGate({ children }: SteamVerificationGateProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [skip, setSkip] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [hasHandledUrlParams, setHasHandledUrlParams] = useState(false);

  // Initialize skip flag and handle URL parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check for skip flag
    if (localStorage.getItem('equipgg_skip_steam_verification') === 'true') {
      setSkip(true);
      setCheckingVerification(false);
      return;
    }

    // Handle URL parameters once
    if (!hasHandledUrlParams) {
      const urlParams = new URLSearchParams(window.location.search);
      const steamVerified = urlParams.get('steam_verified');
      const error = urlParams.get('error');
      
      if (steamVerified === 'success') {
        toast({
          title: "🎉 Steam Verification Successful!",
          description: "Your account is now fully activated and ready to use.",
        });
        window.history.replaceState({}, '', '/dashboard');
        refreshUser();
      } else if (error === 'steam_already_linked') {
        toast({
          title: "Steam Account Already Linked",
          description: "This Steam account is already linked to another EquipGG account.",
          variant: "destructive"
        });
        window.history.replaceState({}, '', '/dashboard');
      } else if (error === 'steam_verification_failed') {
        toast({
          title: "Steam Verification Failed",
          description: "There was an error linking your Steam account. Please try again.",
          variant: "destructive"
        });
        window.history.replaceState({}, '', '/dashboard');
      }
      
      setHasHandledUrlParams(true);
    }
  }, [hasHandledUrlParams, toast, refreshUser]);

  // Check verification status when user data is available
  useEffect(() => {
    if (!user || skip) {
      setCheckingVerification(false);
      return;
    }

    // Check locally first for better UX
    if (user.steam_verified || user.provider === 'steam') {
      setNeedsVerification(false);
      setCheckingVerification(false);
      return;
    }

    // If user exists but isn't Steam verified, check if verification is required
    const checkVerificationStatus = async () => {
      try {
        const res = await fetch(`/api/steam-verification/check?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setNeedsVerification(data.needsVerification);
        } else {
          // Fallback: require verification for non-Steam users
          setNeedsVerification(true);
        }
      } catch (error) {
        console.error('Error checking Steam verification status:', error);
        // Fallback: require verification for non-Steam users
        setNeedsVerification(true);
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerificationStatus();
  }, [user, skip]);

  // Early returns for when verification gate should not be shown
  if (skip || checkingVerification) {
    return checkingVerification ? (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking verification status...</p>
        </div>
      </div>
    ) : <>{children}</>;
  }

  // Show dashboard if user doesn't need verification
  if (!needsVerification || user?.steam_verified || user?.provider === 'steam') {
    return <>{children}</>;
  }
  // If user needs Steam verification, show the verification gate
  const handleSteamVerification = async () => {
    if (isVerifying) return; // Prevent multiple clicks
    
    setIsVerifying(true);
    
    try {
      // Use popup authentication for better UX
      const steamAuthUrl = `/api/auth/steam/popup?verify_user=${user?.id}`;
      const popup = window.open(
        steamAuthUrl,
        'steamAuth',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        // Fallback to redirect if popup is blocked
        console.warn('Popup blocked, falling back to redirect');
        window.location.href = `/api/auth/steam?verify_user=${user?.id}`;
        return;
      }
      
      // Handle popup completion
      const handlePopupCompletion = () => {
        return new Promise<boolean>((resolve) => {
          // Listen for popup messages
          const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'steam_auth_complete') {
              window.removeEventListener('message', handleMessage);
              popup.close();
              resolve(event.data.success);
              
              if (event.data.success) {
                toast({
                  title: "🎉 Steam Verification Successful!",
                  description: "Your account is now fully activated and ready to use.",
                });
              } else {
                toast({
                  title: "Steam Verification Failed",
                  description: event.data.error || "There was an error linking your Steam account.",
                  variant: "destructive"
                });
              }
            }
          };
          
          // Monitor popup closure
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', handleMessage);
              resolve(false); // Assume failed if closed without message
            }
          }, 1000);
          
          window.addEventListener('message', handleMessage);
          
          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            if (!popup.closed) popup.close();
            resolve(false);
          }, 300000);
        });
      };
      
      const success = await handlePopupCompletion();
      
      if (success) {
        // Refresh user data and redirect
        await refreshUser();
        window.location.replace('/dashboard');
      }
      
    } catch (error) {
      console.error('Steam verification error:', error);
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Overlay the normal dashboard but grayed out */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        {children}
      </div>
      
      {/* Verification modal overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Steam Verification Required</CardTitle>
            <CardDescription className="text-base">
              To ensure account security and prevent multiple accounts, all users must verify their identity through Steam.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Prevent Multiple Accounts</p>
                  <p className="text-sm text-muted-foreground">Links your Steam ID to prevent duplicate accounts</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Enhanced Security</p>
                  <p className="text-sm text-muted-foreground">Protects against fraud and ensures fair play</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Steam Profile Integration</p>
                  <p className="text-sm text-muted-foreground">Your Steam avatar and username will be synced</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Important</p>
                  <p className="text-sm text-amber-700">
                    Once verified, you can login with either your email or Steam. Your accounts will be permanently linked.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSteamVerification}
              disabled={isVerifying}
              className="w-full bg-[#1b2838] hover:bg-[#2a475e] text-white"
              size="lg"
            >
              {isVerifying ? 'Redirecting to Steam...' : 'Verify with Steam'}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                localStorage.setItem('equipgg_skip_steam_verification', 'true');
                setSkip(true);
              }}
            >
              Skip for now
            </Button>
            
            {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true') && (
              <Button
                variant="outline"
                className="w-full mt-2 bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
                onClick={async () => {
                  try {
                    if (!user?.id) {
                      toast({
                        title: "Error",
                        description: "No user ID found. Please refresh and try again.",
                        variant: "destructive"
                      });
                      return;
                    }

                    const response = await fetch('/api/steam-verification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: user.id, force: true })
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "✅ Development Bypass",
                        description: "Steam verification bypassed for development.",
                      });
                      
                      await refreshUser();
                      setNeedsVerification(false);
                    } else {
                      const errorData = await response.json();
                      toast({
                        title: "Dev Bypass Failed",
                        description: errorData.error || 'Unknown error occurred',
                        variant: "destructive"
                      });
                    }
                  } catch (error) {
                    console.error('Dev bypass error:', error);
                    toast({
                      title: "Dev Bypass Error",
                      description: error instanceof Error ? error.message : 'Unknown error',
                      variant: "destructive"
                    });
                  }
                }}
              >
                🚀 [DEV] Bypass Steam Verification
              </Button>
            )}
            
            <p className="text-xs text-center text-muted-foreground">
              By verifying with Steam, you agree to link your Steam account to your EquipGG account permanently.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}