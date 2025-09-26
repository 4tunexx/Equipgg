import type { Metadata } from 'next';
import './globals.css';
import { cn } from "../lib/utils";

import { Toaster } from "../components/ui/toaster";
import { AuthProvider } from "../components/auth-provider";
import { SocketProvider } from "../contexts/socket-context";

import React from "react";

export const metadata: Metadata = {
  title: 'EquipGG - CS2 Virtual Betting & Gaming',
  description: 'The Ultimate CS2 Virtual Betting & Gaming Platform',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased bg-background text-foreground')}>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
