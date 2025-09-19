#!/usr/bin/env node

/**
 * This script creates self-contained versions of auth pages to fix
 * dependency issues during build. It inlines necessary components directly.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Define paths
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const AUTH_DIR = path.join(SRC_DIR, 'app', '(auth)');

// Ensure auth directory exists
function ensureAuthDir() {
  if (!fs.existsSync(AUTH_DIR)) {
    log(`Creating auth directory: ${AUTH_DIR}`, colors.yellow);
    try {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
      if (fs.existsSync(AUTH_DIR)) {
        log(`✅ Created auth directory successfully`, colors.green);
        return true;
      }
    } catch (error) {
      log(`❌ Error creating auth directory: ${error.message}`, colors.red);
      return false;
    }
  }
  return true;
}

// Create simplified sign-in page
function createSignInPage() {
  // Ensure the directory exists
  const signInDir = path.join(AUTH_DIR, 'sign-in');
  if (!fs.existsSync(signInDir)) {
    fs.mkdirSync(signInDir, { recursive: true });
  }
  
  // Create page.tsx with inline components
  const signInPagePath = path.join(signInDir, 'page.tsx');
  const signInPageContent = `'use client';

import { useState } from 'react';
import Link from 'next/link';

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
      className={\`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 \${className}\`}
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
      className={\`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 \${className}\`}
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
      className={\`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 \${className}\`}
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
      className={\`rounded-lg border bg-card text-card-foreground shadow-sm \${className}\`}
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
      className={\`flex flex-col space-y-1.5 p-6 \${className}\`}
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
      className={\`text-2xl font-semibold leading-none tracking-tight \${className}\`}
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
      className={\`text-sm text-muted-foreground \${className}\`}
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
    <div className={\`p-6 pt-0 \${className}\`} {...props}>
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
      className={\`flex items-center p-6 pt-0 \${className}\`}
      {...props}
    >
      {children}
    </div>
  );
};

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // This is a placeholder for the actual authentication logic
      console.log('Sign in attempt with:', { email });
      // In a real implementation, you would call your auth service here
      setTimeout(() => {
        setIsLoading(false);
        // Redirect or show success message
      }, 1000);
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
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
        
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}`;
  
  fs.writeFileSync(signInPagePath, signInPageContent);
  log(`✅ Created sign-in page at ${signInPagePath}`, colors.green);
}

// Create simplified sign-up page
function createSignUpPage() {
  // Ensure the directory exists
  const signUpDir = path.join(AUTH_DIR, 'sign-up');
  if (!fs.existsSync(signUpDir)) {
    fs.mkdirSync(signUpDir, { recursive: true });
  }
  
  // Create page.tsx with inline components
  const signUpPagePath = path.join(signUpDir, 'page.tsx');
  const signUpPageContent = `'use client';

import { useState } from 'react';
import Link from 'next/link';

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
      className={\`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 \${className}\`}
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
      className={\`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 \${className}\`}
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
      className={\`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 \${className}\`}
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
      className={\`rounded-lg border bg-card text-card-foreground shadow-sm \${className}\`}
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
      className={\`flex flex-col space-y-1.5 p-6 \${className}\`}
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
      className={\`text-2xl font-semibold leading-none tracking-tight \${className}\`}
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
      className={\`text-sm text-muted-foreground \${className}\`}
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
    <div className={\`p-6 pt-0 \${className}\`} {...props}>
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
      className={\`flex items-center p-6 pt-0 \${className}\`}
      {...props}
    >
      {children}
    </div>
  );
};

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // This is a placeholder for the actual authentication logic
      console.log('Sign up attempt with:', { email, username });
      // In a real implementation, you would call your auth service here
      setTimeout(() => {
        setIsLoading(false);
        // Redirect or show success message
      }, 1000);
    } catch (error) {
      console.error('Sign up error:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your information below to create your account
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
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
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}`;
  
  fs.writeFileSync(signUpPagePath, signUpPageContent);
  log(`✅ Created sign-up page at ${signUpPagePath}`, colors.green);
}

// Main function
function main() {
  log('\n===== Fixing Auth Pages =====', colors.bright);
  
  if (ensureAuthDir()) {
    createSignInPage();
    createSignUpPage();
    log('\n✅ Auth pages fixed successfully!', colors.green);
  } else {
    log('\n❌ Failed to fix auth pages due to directory creation error', colors.red);
  }
  
  log('\n===========================\n', colors.bright);
}

// Execute the script
main();
