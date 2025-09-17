import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2 } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useEffect, useState } from 'react';

export function LandingNav() {
  const { siteSettings } = useSiteSettings();
  const [logoKey, setLogoKey] = useState(0);

  // Listen for logo updates
  useEffect(() => {
    const handleLogoUpdate = () => {
      setLogoKey(prev => prev + 1);
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {siteSettings?.logo_url ? (
              <Image
                src={siteSettings.logo_url}
                alt="Site Logo"
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
                key={`nav-logo-${logoKey}-${siteSettings.logo_url}`} // Force re-render when logo changes
                quality={100}
                priority
                unoptimized={process.env.NODE_ENV === 'development'}
              />
            ) : (
              <Gamepad2 className="h-8 w-8 text-primary" />
            )}
            {!siteSettings?.logo_url && (
              <span className="font-bold">EquipGG</span>
            )}
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
           {/* Buttons are now in HeroSection */}
        </div>
      </div>
    </header>
  );
}
