'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useAuth } from "./auth-provider";
import { Separator } from "./ui/separator";

interface AuthModalProps {
  children: React.ReactNode;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({ children, defaultTab = 'login' }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log('Starting login process...');
      const result = await signIn(loginEmail, loginPassword);
      console.log('Login successful:', result);
      
      setOpen(false);
      
      // Wait a bit longer to ensure the session cookie is set
      console.log('Waiting for session to be established...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use router navigation instead of window.location for better state management
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUp(registerEmail, registerPassword, registerUsername);
      setOpen(false);
      // Add a small delay to ensure auth state is updated before navigation
      setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSteamAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Redirect to Steam OAuth
      window.location.href = '/api/auth/steam';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate with Steam');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterUsername('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to EquipGG</DialogTitle>
          <DialogDescription>
            Sign in to your account or create a new one to get started.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <div className="space-y-4">
              {/* Steam Login Button */}
              <Button 
                onClick={handleSteamAuth} 
                disabled={loading}
                className="w-full bg-[#1b2838] hover:bg-[#2a475e] text-white"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Login with Steam
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
              
              {/* Email Login Form */}
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="auth-login-email" className="text-sm font-medium">Email</label>
                  <Input 
                    id="auth-login-email"
                    name="auth-login-email"
                    placeholder="Email" 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="auth-login-password" className="text-sm font-medium">Password</label>
                  <Input 
                    id="auth-login-password"
                    name="auth-login-password"
                    placeholder="Password" 
                    type="password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    disabled={loading}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <div className="space-y-4">
              {/* Steam Register Button */}
              <Button 
                onClick={handleSteamAuth} 
                disabled={loading}
                className="w-full bg-[#1b2838] hover:bg-[#2a475e] text-white"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Register with Steam
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or create account with email</span>
                </div>
              </div>
              
              {/* Email Register Form */}
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="auth-register-username" className="text-sm font-medium">Username</label>
                  <Input 
                    id="auth-register-username"
                    name="auth-register-username"
                    placeholder="Username" 
                    value={registerUsername} 
                    onChange={(e) => setRegisterUsername(e.target.value)} 
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="auth-register-email" className="text-sm font-medium">Email</label>
                  <Input 
                    id="auth-register-email"
                    name="auth-register-email"
                    placeholder="Email" 
                    type="email" 
                    value={registerEmail} 
                    onChange={(e) => setRegisterEmail(e.target.value)} 
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="auth-register-password" className="text-sm font-medium">Password</label>
                  <Input 
                    id="auth-register-password"
                    name="auth-register-password"
                    placeholder="Password" 
                    type="password" 
                    value={registerPassword} 
                    onChange={(e) => setRegisterPassword(e.target.value)} 
                    disabled={loading}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}