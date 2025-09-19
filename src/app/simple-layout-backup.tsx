import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EquipGG - CS2 Virtual Betting & Gaming',
  description: 'The Ultimate CS2 Virtual Betting & Gaming Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body className="font-body antialiased bg-background text-foreground">
        <div style={{padding: '20px', color: 'white'}}>
          <h1>EquipGG - Development Server Test</h1>
          <p>If you see this, the server is working!</p>
          {children}
        </div>
      </body>
    </html>
  );
}