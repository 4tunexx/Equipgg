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
      <svg className="mr-2 h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M.329 10.333A8.01 8.01 0 0 0 7.99 16C12.414 16 16 12.418 16 8s-3.586-8-8.009-8A8.006 8.006 0 0 0 0 7.468l.003.006 4.304 1.769A2.2 2.2 0 0 1 5.62 8.88l1.96-2.844-.001-.04a3.046 3.046 0 0 1 3.042-3.043 3.046 3.046 0 0 1 3.042 3.043 3.047 3.047 0 0 1-3.111 3.044l-2.804 2a2.223 2.223 0 0 1-3.075 2.11 2.22 2.22 0 0 1-1.312-1.568L.33 10.333Z"/>
        <path d="M4.868 12.683a1.715 1.715 0 0 0 1.318-3.165 1.7 1.7 0 0 0-1.263-.02l1.023.424a1.261 1.261 0 1 1-.97 2.33l-.99-.41a1.7 1.7 0 0 0 .882.84Zm3.726-6.687a2.03 2.03 0 0 0 2.027 2.029 2.03 2.03 0 0 0 2.027-2.029 2.03 2.03 0 0 0-2.027-2.027 2.03 2.03 0 0 0-2.027 2.027m2.03-1.527a1.524 1.524 0 1 1-.002 3.048 1.524 1.524 0 0 1 .002-3.048"/>
      </svg>
      {isLoading ? 'Connecting to Steam...' : `${mode === 'login' ? 'Login' : 'Register'} with Steam`}
    </Button>
  );
}

export default SteamAuthButton;