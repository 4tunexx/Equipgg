import Image from 'next/image';
import { Gamepad2, Github, Twitter } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useEffect, useState } from 'react';

export function Footer() {
  const year = new Date().getFullYear();
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
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          {siteSettings?.logo_url ? (
            <Image
              src={siteSettings.logo_url}
              alt="Site Logo"
              width={32}
              height={32}
              className="h-8 w-auto object-contain"
              key={`footer-logo-${logoKey}-${siteSettings.logo_url}`} // Force re-render when logo changes
              quality={100}
              priority
              unoptimized={process.env.NODE_ENV === 'development'}
            />
          ) : (
            <Gamepad2 className="h-8 w-8 text-primary" />
          )}
          <p className="text-center text-sm leading-loose md:text-left">
            Built for the ultimate gaming experience. &copy; {year} EquipGG. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Twitter className="h-5 w-5" />
          </a>
          <a href="#" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
