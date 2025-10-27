'use client';

import { Button } from "./ui/button";
import { useState, useEffect } from 'react';

function SteamAuthButton({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSteamAuth = async () => {
    setIsLoading(true);
    
    // Get the current environment
    const isLocal = process.env.NODE_ENV === 'development' && !window.location.hostname.includes('.app.github.dev');
    const isCodespaces = window.location.hostname.includes('.app.github.dev');
    
    // Get the base URL based on environment
    let baseUrl;
    if (isCodespaces) {
      baseUrl = window.location.origin; // Use the Codespaces URL
    } else if (isLocal) {
      baseUrl = 'http://localhost:3001'; // Always use localhost:3001 for local dev
    } else {
      baseUrl = 'https://www.equipgg.net'; // Production
    }
    
    // Use direct redirect in development or Codespaces
    if (isLocal || isCodespaces) {
      window.location.href = `${baseUrl}/api/auth/steam`;
      return;
    }
    
    // Try popup in production
    const popup = window.open(
      `${baseUrl}/api/auth/steam/popup`,
      'steamAuth',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      // Fallback to redirect if popup blocked
      window.location.href = `${baseUrl}/api/auth/steam`;
      return;
    }

    // Handle popup messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'steam_auth_complete') {
        window.removeEventListener('message', handleMessage);
        if (event.data.success) {
          // On success, redirect if provided or reload
          const redirect = event.data.redirect;
          if (redirect) {
            window.location.href = redirect;
          } else {
            window.location.reload();
          }
        } else {
          // Better error handling
          console.error('Steam auth failed:', event.data.error);
          setIsLoading(false);
          
          // Show error to user
          const errorDiv = document.createElement('div');
          errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
          errorDiv.role = 'alert';
          errorDiv.innerHTML = `
            <strong class="font-bold">Error: </strong>
            <span class="block sm:inline">${event.data.error || 'Steam authentication failed'}</span>
          `;
          document.body.appendChild(errorDiv);
          setTimeout(() => errorDiv.remove(), 5000);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup closes
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
        setIsLoading(false);
      }
    }, 1000);

    // Cleanup after 5 minutes
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkPopup);
      setIsLoading(false);
    }, 300000);
  };

  // Don't render anything during SSR
  if (!isClient) {
    return null;
  }

  return (
    <Button
      onClick={handleSteamAuth}
      disabled={isLoading}
      className="w-full bg-[#1b2838] hover:bg-[#2a475e] text-white"
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169-.234-.45-.348-.75-.348-.3 0-.581.114-.75.348L12 14.208 7.932 8.16c-.169-.234-.45-.348-.75-.348-.3 0-.581.114-.75.348-.234.328-.167.783.158 1.026L12 15.48l5.41-6.294c.325-.243.392-.698.158-1.026z"/>
      </svg>
      {isLoading ? 'Connecting to Steam...' : `${mode === 'login' ? 'Login' : 'Register'} with Steam`}
    </Button>
  );
}

export default SteamAuthButton;