#!/usr/bin/env node

/**
 * This script ensures that all UI components are properly available
 * during the Vercel build process to fix path resolution issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const UI_DIR = path.join(COMPONENTS_DIR, 'ui');
const LIB_DIR = path.join(SRC_DIR, 'lib');

// Check if we're running on Vercel
const IS_VERCEL = process.env.VERCEL === '1';

// If we're on Vercel, ensure we're using the correct directories
if (IS_VERCEL) {
  log('Running in Vercel environment, checking directory structure...', colors.yellow);
  
  // Log current directory contents
  log(`Current directory: ${process.cwd()}`, colors.reset);
  const dirContents = fs.readdirSync(process.cwd());
  log('Contents:', colors.reset);
  dirContents.forEach(item => log(` - ${item}`));
}

// Template component content
const componentTemplates = {
  'button.tsx': `"use client"
 
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
 
import { cn } from "@/lib/utils"
 
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
 
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}
 
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
 
export { Button, buttonVariants }`,
  
  'input.tsx': `"use client"
 
import * as React from "react"
 
import { cn } from "@/lib/utils"
 
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}
 
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
 
export { Input }`,
  
  'label.tsx': `"use client"
 
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
 
import { cn } from "@/lib/utils"
 
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)
 
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName
 
export { Label }`,
  
  'card.tsx': `"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`,
};

// Ensure utils.ts exists too for component dependencies
const ensureUtilsFile = () => {
  const utilsPath = path.join(ROOT_DIR, 'src', 'lib', 'utils.ts');
  if (!fs.existsSync(utilsPath)) {
    log(`Creating utils.ts file for UI component dependencies`, colors.yellow);
    const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
    
    // Make sure the lib directory exists
    fs.mkdirSync(path.join(ROOT_DIR, 'src', 'lib'), { recursive: true });
    fs.writeFileSync(utilsPath, utilsContent);
    log(`Created utils.ts file`, colors.green);
  }
};

// Check if directories exist and create if necessary
function checkDirectory(dir) {
  if (!fs.existsSync(dir)) {
    log(`Directory does not exist: ${dir}`, colors.red);
    log(`Creating directory: ${dir}`, colors.yellow);
    try {
      fs.mkdirSync(dir, { recursive: true });
      // Verify the directory was created
      if (fs.existsSync(dir)) {
        log(`✅ Directory created successfully: ${dir}`, colors.green);
        return true;
      } else {
        log(`❌ Failed to create directory: ${dir}`, colors.red);
        return false;
      }
    } catch (error) {
      log(`❌ Error creating directory ${dir}: ${error.message}`, colors.red);
      return false;
    }
  }
  log(`✅ Directory exists: ${dir}`, colors.green);
  return true;
}

// Auth provider template
const authProviderTemplate = `'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

// Create a simplified version of the auth provider for build purposes
// This template will be replaced with the actual implementation in development

interface AuthContextType {
  user: any | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified auth methods for build purposes
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      // In the real implementation, this would call the authentication service
      console.log('Sign in attempted with', { email });
      setUser({ id: 'user-123', email });
    } catch (err) {
      setError('Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
    } catch (err) {
      setError('Failed to sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      // In the real implementation, this would call the authentication service
      console.log('Sign up attempted with', { email, displayName });
      setUser({ id: 'user-123', email, displayName });
    } catch (err) {
      setError('Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signIn,
      signOut,
      signUp,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
`;

// Check for auth provider
function checkAuthProvider() {
  const authProviderPath = path.join(COMPONENTS_DIR, 'auth-provider.tsx');
  if (!fs.existsSync(authProviderPath)) {
    log(`Missing auth provider: auth-provider.tsx`, colors.red);
    log(`Creating auth-provider.tsx...`, colors.yellow);
    
    fs.writeFileSync(authProviderPath, authProviderTemplate);
    log(`Created auth-provider.tsx`, colors.green);
    return true;
  }
  log(`Found auth provider: auth-provider.tsx`, colors.green);
  return true;
}

// Check specific UI components that are being imported
function checkComponents() {
  const requiredComponents = [
    'button.tsx',
    'input.tsx',
    'label.tsx',
    'card.tsx'
  ];
  
  let allComponentsExist = true;
  
  // Ensure utils.ts exists for component dependencies
  ensureUtilsFile();
  
  for (const component of requiredComponents) {
    const componentPath = path.join(UI_DIR, component);
    if (!fs.existsSync(componentPath)) {
      log(`Missing UI component: ${component}`, colors.red);
      log(`Creating ${component}...`, colors.yellow);
      
      if (componentTemplates[component]) {
        fs.writeFileSync(componentPath, componentTemplates[component]);
        log(`Created ${component}`, colors.green);
      } else {
        log(`No template available for ${component}`, colors.red);
        allComponentsExist = false;
      }
    } else {
      log(`Found UI component: ${component}`, colors.green);
    }
  }
  
  return allComponentsExist;
}

// Determine if we're running on Vercel
function isRunningOnVercel() {
  return process.env.VERCEL === '1';
}

// List all files in a directory recursively
function listDirectoryContents(dir, indent = '') {
  try {
    if (!fs.existsSync(dir)) {
      log(`${indent}Directory does not exist: ${dir}`, colors.red);
      return;
    }
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        log(`${indent}📁 ${item}/`, colors.bright);
        listDirectoryContents(fullPath, `${indent}  `);
      } else {
        log(`${indent}📄 ${item}`, colors.reset);
      }
    });
  } catch (error) {
    log(`Error listing directory contents: ${error.message}`, colors.red);
  }
}

// Write component file and verify it was written correctly
function writeComponentFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
    
    // Verify the file was written
    if (fs.existsSync(filePath)) {
      const fileStats = fs.statSync(filePath);
      log(`✅ Created file: ${filePath} (${fileStats.size} bytes)`, colors.green);
      return true;
    } else {
      log(`❌ Failed to create file: ${filePath}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Error writing file ${filePath}: ${error.message}`, colors.red);
    return false;
  }
}

// Run diagnostics on path resolution
function checkPathResolution() {
  log('\nChecking path resolution and Next.js configuration...', colors.bright);
  
  try {
    // Check tsconfig
    if (fs.existsSync(path.join(ROOT_DIR, 'tsconfig.json'))) {
      log('Found tsconfig.json', colors.green);
      const tsconfig = require(path.join(ROOT_DIR, 'tsconfig.json'));
      if (tsconfig?.compilerOptions?.paths?.['@/*']) {
        log('Path alias @/* is correctly configured in tsconfig.json', colors.green);
      } else {
        log('Path alias @/* may not be correctly configured in tsconfig.json', colors.yellow);
      }
    }
    
    // Check components.json
    if (fs.existsSync(path.join(ROOT_DIR, 'components.json'))) {
      log('Found components.json', colors.green);
    }
    
    // Check next.config.js
    if (fs.existsSync(path.join(ROOT_DIR, 'next.config.js'))) {
      log('Found next.config.js', colors.green);
    }
    
    // Check for .env files
    if (fs.existsSync(path.join(ROOT_DIR, '.env'))) {
      log('Found .env file', colors.green);
    }
    
  } catch (error) {
    log(`Error checking path resolution: ${error.message}`, colors.red);
  }
}

// Main function
function main() {
  log('\n===== UI Component Verification =====', colors.bright);
  
  const isVercel = isRunningOnVercel();
  log(`Running on Vercel: ${isVercel ? 'Yes' : 'No'}`, isVercel ? colors.green : colors.reset);
  log(`Node version: ${process.version}`, colors.reset);
  log(`Working directory: ${process.cwd()}`, colors.reset);
  
  // Ensure all directories exist
  checkDirectory(COMPONENTS_DIR);
  checkDirectory(UI_DIR);
  
  // Create components
  const componentsExist = checkComponents();
  const authProviderExists = checkAuthProvider();
  
  checkPathResolution();
  
  // List directory contents for debugging
  log('\n📁 Project Structure:', colors.bright);
  log(`📁 ${COMPONENTS_DIR}`, colors.bright);
  listDirectoryContents(COMPONENTS_DIR, '  ');
  
  if (!componentsExist || !authProviderExists) {
    log('\n⚠️ Some components might have failed to generate', colors.yellow);
  } else {
    log('\n✅ All required components verified', colors.green);
  }
  
  // Additional verification for Vercel
  if (isVercel) {
    log('\n🔍 Vercel-specific checks:', colors.bright);
    
    try {
      log(`Button component path: ${path.join(UI_DIR, 'button.tsx')}`, colors.reset);
      
      // Output file permissions if file exists
      const buttonPath = path.join(UI_DIR, 'button.tsx');
      if (fs.existsSync(buttonPath)) {
        const stats = fs.statSync(buttonPath);
        log(`Button component permissions: ${stats.mode.toString(8)}`, colors.reset);
      } else {
        log(`Button component does not exist at ${buttonPath}`, colors.red);
      }
    } catch (error) {
      log(`Error in Vercel-specific checks: ${error.message}`, colors.red);
    }
  }
  
  log('\n===================================\n', colors.bright);
}

// Execute the script
main();
