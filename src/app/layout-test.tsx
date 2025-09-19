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
      <body className="font-body antialiased bg-background text-foreground">
        <div>
          <h1>Testing Basic Layout</h1>
          {children}
        </div>
      </body>
    </html>
  );
}