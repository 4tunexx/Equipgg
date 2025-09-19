
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "../ui/button";
import { AuthModal } from "../auth-modal";
import { Gamepad2, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSiteSettings } from "../../hooks/use-site-settings";

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [logoKey, setLogoKey] = useState(0);
  const { siteSettings } = useSiteSettings();

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Listen for logo updates
  useEffect(() => {
    const handleLogoUpdate = () => {
      // Force re-render when logo changes
      setLogoKey(prev => prev + 1);
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 50);
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, []);

  return (
    <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white overflow-hidden">
      <div className={`absolute top-0 left-0 container flex h-14 items-center z-20 transition-all duration-1000 ease-out transform ${
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0'
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
                key={`corner-logo-${logoKey}-${siteSettings.logo_url}`} // Force re-render when logo changes
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
      <Image
        src="/sadsad.png"
        alt="CS2 themed background"
        fill
        className="absolute inset-0 z-0 brightness-[0.4] object-cover transition-all duration-1000 ease-out transform hover:scale-105"
        data-ai-hint="CS2 abstract background"
        priority
      />
      <div className="relative z-10 p-4 flex flex-col lg:flex-row items-center w-full max-w-6xl mx-auto gap-8">
        <div className='flex-1 text-center lg:text-left order-2 lg:order-1'>
          <h1 
            className={`text-2xl sm:text-4xl lg:text-6xl xl:text-7xl font-headline font-bold tracking-tighter mb-4 text-shadow-lg transition-all duration-1000 ease-out transform ${
              isVisible 
                ? 'translate-x-0 opacity-100' 
                : '-translate-x-full opacity-0'
            }`}
            style={{ transitionDelay: '0.2s' }}
          >
            Level Up Your Game
          </h1>
          <p 
            className={`max-w-lg mx-auto lg:mx-0 text-sm sm:text-lg lg:text-xl text-foreground/80 mb-6 lg:mb-8 transition-all duration-1000 ease-out transform ${
              isVisible 
                ? 'translate-x-0 opacity-100' 
                : '-translate-x-full opacity-0'
            }`}
            style={{ transitionDelay: '0.4s' }}
          >
            The ultimate CS2 virtual betting and gaming platform. Bet, craft, and conquer the leaderboards.
          </p>
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 transition-all duration-1000 ease-out transform ${
              isVisible 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-full opacity-0'
            }`}
            style={{ transitionDelay: '0.6s' }}
          >
            <AuthModal defaultTab="register">
              <Button
                size="lg"
                className="w-full sm:w-40 justify-center bg-primary font-bold text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
              >
                <UserPlus className="mr-2" />
                REGISTER
              </Button>
            </AuthModal>
            <AuthModal defaultTab="login">
              <Button 
                size="lg" 
                variant="secondary" 
                className="w-full sm:w-40 justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10"
              >
                <LogIn className="mr-2" />
                LOGIN
              </Button>
            </AuthModal>
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center relative order-1 lg:order-2 mb-8 lg:mb-0">
          {/* Layered Logo Animation */}
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-2xl h-40 sm:h-64 lg:h-96 flex items-center justify-center group cursor-pointer hover:scale-105 transition-transform duration-300">
            {/* Main Logo (1.png) - Drops from top - Background layer */}
            <Image
              src="/1.png"
              alt="Main Logo"
              width={600}
              height={200}
              className={`absolute w-auto h-auto max-w-full max-h-32 sm:max-h-60 lg:max-h-80 object-contain transition-all duration-300 group-hover:animate-logo-shake group-hover:scale-105 group-active:scale-95 group-hover:brightness-110 ${
                isVisible ? 'animate-drop-from-top' : 'opacity-0'
              }`}
              style={{ 
                width: 'auto', 
                height: 'auto',
                zIndex: 1,
                animationDelay: '0.1s',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              key={`main-logo-${logoKey}`}
              data-ai-hint="main logo layer"
            />
            
            {/* Overlay Logo (2.png) - Slides from underneath - Top layer */}
            <Image
              src="/2.png"
              alt="Overlay Logo"
              width={380}
              height={120}
              className={`absolute w-auto h-auto max-w-full max-h-24 sm:max-h-40 lg:max-h-52 object-contain transition-all duration-300 group-hover:animate-logo-shake group-hover:scale-105 group-active:scale-95 group-hover:brightness-110 ${
                isVisible ? 'animate-slide-from-under' : 'opacity-0'
              }`}
              style={{ 
                width: 'auto', 
                height: 'auto',
                zIndex: 2,
                animationDelay: '0.3s',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              key={`overlay-logo-${logoKey}`}
              data-ai-hint="overlay logo layer"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
