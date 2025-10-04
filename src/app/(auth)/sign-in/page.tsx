'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Inline UI components to avoid import issues
const Button = ({ 
  className = '', 
  children, 
  type = 'button', 
  disabled = false,
  onClick,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${className}`}
      type={type}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({
  className = '',
  type = 'text',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

const Label = ({
  className = '',
  htmlFor,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & {
  children: React.ReactNode;
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

const Card = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
}) => {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
}) => {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  children: React.ReactNode;
}) => {
  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardDescription = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  children: React.ReactNode;
}) => {
  return (
    <p
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

const CardContent = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
}) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
}) => {
  return (
    <div
      className={`flex items-center p-6 pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

function SignInForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/dashboard';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Starting authentication...');
      
      // Call the authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Authentication successful, redirecting to:', redirectTo);
        // Use the redirect parameter or default to dashboard
        window.location.href = redirectTo;
      } else {
        console.error('Authentication failed:', data.error || data.message);
        // Handle error (you might want to show an error message to the user)
        alert(`Login failed: ${data.error || data.message || 'Unknown error'}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleSteamLogin = () => {
    console.log('Starting Steam authentication...');
    
    // Open Steam auth in a popup window
    const steamAuthUrl = redirectTo !== '/dashboard' 
      ? `/api/auth/steam/popup?redirect=${encodeURIComponent(redirectTo)}`
      : '/api/auth/steam/popup';
    
    const popup = window.open(
      steamAuthUrl,
      'steamAuth',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );
    
    if (!popup) {
      // Fallback to redirect if popup is blocked
      console.warn('Popup blocked, falling back to redirect');
      const steamUrl = redirectTo !== '/dashboard' 
        ? `/api/auth/steam?redirect=${encodeURIComponent(redirectTo)}`
        : '/api/auth/steam';
      window.location.href = steamUrl;
      return;
    }
    
    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message from popup:', event.data);
      if (event.data.type === 'steam_auth_complete') {
        console.log('Steam auth complete message received:', event.data);
        
        if (event.data.success) {
          console.log('Steam authentication successful, redirecting to:', event.data.redirect || redirectTo);
          // Add a small delay to ensure cookies are properly set
          setTimeout(() => {
            // Redirect to the intended page (use redirect from popup if available)
            window.location.href = event.data.redirect || redirectTo;
          }, 500);
        } else {
          console.log('Steam authentication failed:', event.data.error);
          alert(`Steam authentication failed: ${event.data.error || 'Unknown error'}`);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Also check if popup closes
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
        console.log('Steam popup closed');
      }
    }, 1000);
    
    // Cleanup after 5 minutes
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkPopup);
    }, 300000);
  };
  
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to sign in to your account
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {/* Steam Login Option */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <Button 
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSteamLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169-.234-.45-.348-.75-.348-.3 0-.581.114-.75.348L12 14.208 7.932 8.16c-.169-.234-.45-.348-.75-.348-.3 0-.581.114-.75.348-.234.328-.167.783.158 1.026L12 15.48l5.41-6.294c.325-.243.392-.698.158-1.026z"/>
              </svg>
              Continue with Steam
            </Button>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="container flex h-screen w-screen flex-col items-center justify-center"><div>Loading...</div></div>}>
      <SignInForm />
    </Suspense>
  );
}