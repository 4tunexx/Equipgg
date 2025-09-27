
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "../ui/button";
import { AuthModal } from "../auth-modal";
import { Gamepad2, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSiteSettings } from "../../hooks/use-site-settings";

interface LandingPanel {
  id: string;
  type: string;
  title: string;
  content: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  icon?: string;
  stats?: any;
  author?: string;
  is_active: boolean;
  display_order: number;
}

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [logoKey, setLogoKey] = useState(0);
  const [heroPanel, setHeroPanel] = useState<LandingPanel | null>(null);
  const { siteSettings } = useSiteSettings();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleLogoUpdate = () => {
      setLogoKey(prev => prev + 1);
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 50);
    };
    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, []);

  // Fetch hero panel data from admin-managed content
  useEffect(() => {
    const fetchHeroPanel = async () => {
      try {
        const response = await fetch('/api/landing/panels');
        if (response.ok) {
          const data = await response.json();
          const heroPanelData = data.panels?.find((panel: LandingPanel) => panel.type === 'hero');
          if (heroPanelData) {
            setHeroPanel(heroPanelData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch hero panel:', error);
      }
    };

    fetchHeroPanel();
  }, []);

  return (
    <section className="relative min-h-[100vh] md:h-[80vh] flex items-center justify-center text-center text-white overflow-hidden">
      {/* Corner Logo (desktop only) */}
      <div className={`absolute top-0 left-0 container hidden lg:flex h-14 items-center z-30 transition-all duration-1000 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {siteSettings?.logo_url ? (
              <Image
                src={siteSettings.logo_url}
                alt="Site Logo"
                width={48}
                height={48}
                className="h-12 w-auto object-contain"
                key={`corner-logo-${logoKey}-${siteSettings.logo_url}`}
                quality={100}
                priority
                unoptimized={process.env.NODE_ENV === 'development'}
              />
            ) : (
              <Gamepad2 className="h-12 w-12 text-primary" />
            )}
            {!siteSettings?.logo_url && (
              <span className="font-bold text-white">EquipGG</span>
            )}
          </Link>
        </div>
      </div>

      {/* Background */}
      <Image
        src="/sadsad.png"
        alt="CS2 themed background"
        fill
        className="absolute inset-0 z-0 brightness-[0.4] object-cover transition-all duration-1000 ease-out transform hover:scale-105"
        priority
      />

      <div className="relative z-10 p-4 w-full max-w-6xl mx-auto pt-20 lg:pt-4">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 w-full">
          
          {/* Main content with mobile logo + text */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left order-1 lg:order-1 min-w-0">
            
{/* Mobile Logo ABOVE headline */}
<div className="lg:hidden flex justify-center items-center mb-4 w-full">
  <div className="relative h-40 w-full max-w-[220px] flex justify-center items-center">
    {/* Character Logo */}
    <div
      className={`absolute flex justify-center items-center transition-all duration-1000 ${
        isVisible
          ? 'animate-[dropFromTop_1s_ease-out_forwards]'
          : 'opacity-0 -translate-y-full'
      }`}
    >
      <Image
        src="/1.png"
        alt="Equip.gg Character Logo"
        width={200}
        height={150}
        className="object-contain mx-auto"
        key={`logo1-mobile-${logoKey}`}
        priority
      />
    </div>

    {/* Text Logo */}
    <div
      className={`absolute flex justify-center items-center transition-all duration-1000 delay-500 ${
        isVisible
          ? 'animate-[slideFromUnder_1s_ease-out_0.5s_forwards]'
          : 'opacity-0 translate-y-full'
      }`}
    >
      <Image
        src="/2.png"
        alt="Equip.gg Text Layer"
        width={210}
        height={95}
        className="object-contain mx-auto"
        key={`logo2-mobile-${logoKey}`}
        priority
      />
    </div>
  </div>
</div>
            {/* Headline */}
            <h1 
              className={`text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-headline font-bold tracking-tighter mb-6 text-shadow-lg transition-all duration-1000 ease-out transform ${
                isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
              }`}
              style={{ transitionDelay: '0.2s' }}
            >
              {heroPanel?.title || 'Level Up Your Game'}
            </h1>

            {/* Subtext */}
            <p 
              className={`max-w-lg mx-auto lg:mx-0 text-base sm:text-lg lg:text-xl text-foreground/80 mb-8 lg:mb-8 transition-all duration-1000 ease-out transform ${
                isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
              }`}
              style={{ transitionDelay: '0.4s' }}
            >
              {heroPanel?.content || 'The ultimate CS2 virtual betting and gaming platform. Bet, craft, and conquer the leaderboards.'}
            </p>

            {/* Auth Buttons */}
            <div 
              className={`flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 transition-all duration-1000 ease-out transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
              style={{ transitionDelay: '0.6s' }}
            >
              <AuthModal defaultTab="register">
                <Button
                  size="lg"
                  className="w-full sm:w-40 justify-center bg-primary font-bold text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  {heroPanel?.button_text || 'REGISTER'}
                </Button>
              </AuthModal>
              <AuthModal defaultTab="login">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full sm:w-40 justify-center transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  LOGIN
                </Button>
              </AuthModal>
            </div>
          </div>

          {/* Desktop Logo */}
          <div className="hidden lg:flex flex-1 justify-end items-center relative order-2 mb-8 lg:mb-0 w-full max-w-lg lg:max-w-none lg:pr-8">
            <div className="relative h-80 w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 group cursor-pointer ${
                isVisible ? 'animate-[dropFromTop_1s_ease-out_forwards]' : 'opacity-0 transform -translate-y-full'
              }`}>
                <div className="translate-y-4 translate-x-4">
                <Image 
                  src="/1.png" 
                  alt="Equip.gg Logo" 
                  width={400}
                  height={300}
                  className="w-auto h-auto object-contain transition-all duration-300 hover:scale-110 hover:animate-[logoShake_0.5s_ease-in-out] active:scale-95"
                  style={{ width: 'auto', height: 'auto' }}
                  key={`logo1-desktop-${logoKey}`}
                  priority
                />
                </div>
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 delay-500 group cursor-pointer ${
                isVisible ? 'animate-[slideFromUnderDesktop_1s_ease-out_0.5s_forwards]' : 'opacity-0 transform translate-y-full'
              }`}>
                <div className="translate-y-8 translate-x-6">
                <Image 
                  src="/2.png" 
                  alt="Equip.gg Logo Layer" 
                  width={400}
                  height={300}
                  className="w-auto h-auto object-contain transition-all duration-300 hover:scale-110 hover:animate-[logoShake_0.5s_ease-in-out] active:scale-95"
                  style={{ width: 'auto', height: 'auto' }}
                  key={`logo2-desktop-${logoKey}`}
                  priority
                />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
