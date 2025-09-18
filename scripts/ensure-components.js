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

// Helper function for safe execution with error handling
function safeExecute(fn, errorMessage) {
  try {
    return fn();
  } catch (error) {
    log(`${errorMessage}: ${error.message}`, colors.red);
    return null;
  }
}

// Helper function to create directories if they don't exist
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`Created directory: ${dirPath}`, colors.green);
    }
    return true;
  } catch (error) {
    log(`Failed to create directory ${dirPath}: ${error.message}`, colors.red);
    return false;
  }
}

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
  'badge.tsx': `"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
`,
  'scroll-area.tsx': `"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
`,
  'dialog.tsx': `"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
`,
  'switch.tsx': `"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
`,
  'table.tsx': `"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
`,
  'tabs.tsx': `"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
`,
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
    
    try {
      // Make sure the lib directory exists
      const libDir = path.join(ROOT_DIR, 'src', 'lib');
      if (!ensureDirectoryExists(libDir)) {
        throw new Error('Failed to create lib directory');
      }
      
      fs.writeFileSync(utilsPath, utilsContent);
      log(`Created utils.ts file`, colors.green);
    } catch (error) {
      log(`Failed to create utils.ts file: ${error.message}`, colors.red);
      throw error; // Re-throw to allow caller to handle
    }
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
    'card.tsx',
    'tabs.tsx',
    'switch.tsx',
    'table.tsx',
    'dialog.tsx',
    'badge.tsx',
    'scroll-area.tsx'
  ];
  
  let allComponentsExist = true;
  
  // Ensure utils.ts exists for component dependencies
  try {
    ensureUtilsFile();
  } catch (error) {
    log(`Failed to create utils file: ${error.message}`, colors.yellow);
    // Continue even if utils file creation fails
  }
  
  // Ensure UI directory exists
  if (!ensureDirectoryExists(UI_DIR)) {
    log('Failed to ensure UI directory exists, but continuing...', colors.yellow);
  }
  
  for (const component of requiredComponents) {
    try {
      const componentPath = path.join(UI_DIR, component);
      if (!fs.existsSync(componentPath)) {
        log(`Missing UI component: ${component}`, colors.red);
        log(`Creating ${component}...`, colors.yellow);
        
        if (componentTemplates[component]) {
          try {
            fs.writeFileSync(componentPath, componentTemplates[component]);
            log(`Created ${component}`, colors.green);
          } catch (writeError) {
            log(`Failed to write component ${component}: ${writeError.message}`, colors.red);
            allComponentsExist = false;
          }
        } else {
          log(`No template available for ${component}`, colors.red);
          allComponentsExist = false;
        }
      } else {
        log(`Found UI component: ${component}`, colors.green);
      }
    } catch (componentError) {
      log(`Error processing component ${component}: ${componentError.message}`, colors.red);
      allComponentsExist = false;
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

// Execute the script with error handling
try {
  main();
} catch (error) {
  log(`\n❌ Script failed with error: ${error.message}`, colors.red);
  
  // Print stack trace for debugging
  console.error(error);
  
  // Exit with non-zero code to indicate failure
  process.exit(1);
}
