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

  // Check for skip flag on mount (client only)
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('equipgg_skip_steam_verification') === 'true') {
      setSkip(true);
    }
  }, []);

  // Check for verification success from URL params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('steam_verified') === 'success') {
      toast({
        title: "🎉 Steam Verification Successful!",
        description: "Your account is now fully activated and ready to use.",
      });
      window.history.replaceState({}, '', '/dashboard');
      refreshUser();
    } else if (urlParams.get('error') === 'steam_already_linked') {
      toast({
        title: "Steam Account Already Linked",
        description: "This Steam account is already linked to another EquipGG account.",
        variant: "destructive"
      });
      window.history.replaceState({}, '', '/dashboard');
    } else if (urlParams.get('error') === 'steam_verification_failed') {
      toast({
        title: "Steam Verification Failed",
        description: "There was an error linking your Steam account. Please try again.",
        variant: "destructive"
      });
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [toast, refreshUser]);

  // If user is Steam verified, or provider is steam, or skip is set, show dashboard
  if (user?.steam_verified || user?.provider === 'steam' || skip) {
    return <>{children}</>;
  }

  // If user needs Steam verification, show the verification gate
  const handleSteamVerification = () => {
    setIsVerifying(true);
    
    // Open Steam auth in a popup window using the new popup endpoint
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
    
    // Listen for the popup to close or complete
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        setIsVerifying(false);
        // Refresh user data to check if verification was successful
        refreshUser();
      }
    }, 1000);
    
    // Also listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'steam_auth_complete') {
        clearInterval(checkPopup);
        popup.close();
        setIsVerifying(false);
        
        if (event.data.success) {
          toast({
            title: "🎉 Steam Verification Successful!",
            description: "Your account is now fully activated and ready to use.",
          });
          refreshUser();
        } else {
          toast({
            title: "Steam Verification Failed",
            description: event.data.error || "There was an error linking your Steam account.",
            variant: "destructive"
          });
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Cleanup
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkPopup);
    }, 300000); // 5 minutes timeout
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
                window.location.reload();
              }}
            >
              Skip for now
            </Button>
            
            {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true') && (
              <button
                onClick={async () => {
                  try {
                    console.log('Dev bypass clicked - starting verification...');
                    console.log('User ID:', user?.id);
                    
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
                    
                    console.log('Steam verification API response:', response.status);
                    
                    if (response.ok) {
                      const result = await response.json();
                      console.log('Steam verification result:', result);
                      
                      toast({
                        title: "✅ Development Bypass",
                        description: "Steam verification bypassed for development.",
                      });
                      
                      // Force refresh user data
                      console.log('Refreshing user data...');
                      await refreshUser();
                      
                      // Small delay then reload the page to ensure state updates
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      const errorData = await response.json();
                      console.error('Steam verification API error:', errorData);
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
                className="w-full px-4 py-2 text-xs border rounded-md hover:bg-gray-50 bg-yellow-50 border-yellow-300"
              >
                🚀 [DEV] Bypass Steam Verification
              </button>
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