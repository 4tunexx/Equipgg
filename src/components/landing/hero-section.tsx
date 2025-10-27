'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSiteSettings } from "../../hooks/use-site-settings";
import { useHeroPanelData } from "../../hooks/use-hero-panel-data";
import dynamic from 'next/dynamic';
import { AuthModal } from "../auth-modal";
import { Button } from "../ui/button";
import { LogIn, UserPlus, Gamepad2 } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="absolute inset-0 bg-background z-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-foreground/60">Loading...</p>
    </div>
  </div>
);

const HeroContent = dynamic(() => import('./hero-content').then(mod => ({ default: mod.HeroContent })), {
  loading: LoadingSpinner,
  ssr: false
});

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [logoKey, setLogoKey] = useState(0);
  const { siteSettings } = useSiteSettings();
  const { heroPanelData, loading } = useHeroPanelData();

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) setIsVisible(true);
    }, 100);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server

    let mounted = true;
    const handleLogoUpdate = () => {
      if (!mounted) return;
      setLogoKey(prev => prev + 1);
      setIsVisible(false);
      setTimeout(() => {
        if (mounted) setIsVisible(true);
      }, 50);
    };
    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, []);

  // Wait for both siteSettings and heroPanelData to load before showing content
  const isDataLoaded = !loading && siteSettings !== null;

  // Use admin settings with proper fallbacks - ALWAYS provide default values
  const effectiveTitle = isDataLoaded ? (heroPanelData?.title || siteSettings?.site_name || 'Welcome to EquipGG') : 'Welcome to EquipGG';
  const effectiveDescription = isDataLoaded ? (heroPanelData?.content || siteSettings?.description || 'The ultimate destination for CS2 gambling') : 'The ultimate destination for CS2 gambling';
  const effectiveButtonText = isDataLoaded ? (heroPanelData?.button_text || 'Get Started') : 'Get Started';
  
  // Small logo (header/navbar) - uses logo.png
  const effectiveLogo = isDataLoaded ? (siteSettings?.logo_url || '/logo.png') : '/logo.png';
  
  // Big logos (hero section) - ALWAYS use 1.png and 2.png as fallbacks
  const effectiveLogoLayer1 = (heroPanelData?.logo_layer1 && heroPanelData.logo_layer1.trim() !== '') ? heroPanelData.logo_layer1 : '/1.png';
  const effectiveLogoLayer2 = (heroPanelData?.logo_layer2 && heroPanelData.logo_layer2.trim() !== '') ? heroPanelData.logo_layer2 : '/2.png';
  
  // Determine if we should use single logo or layered logos for big display
  // Use single logo if no layer data is available or if both layers point to the same image
  const useSingleLogo = !heroPanelData?.logo_layer1 && !heroPanelData?.logo_layer2;

  return (
    <section className="relative min-h-screen flex items-center justify-center text-center text-white overflow-hidden">
      {/* Loading State */}
      {!isDataLoaded && (
        <div className="absolute inset-0 bg-background z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground/60">Loading...</p>
          </div>
        </div>
      )}
      {/* Corner Logo (desktop only) */}
      <div className={`absolute top-4 left-4 hidden lg:flex items-center z-30 transition-all duration-1000 ease-out transform ${
        isVisible && isDataLoaded ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}>
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {effectiveLogo ? (
              <Image
                src={effectiveLogo}
                alt="Site Logo"
                width={256}
                height={256}
                className="h-12 object-contain"
                style={{ width: 'auto', height: '3rem' }}
                key={`corner-logo-${logoKey}-${effectiveLogo}`}
                quality={100}
                priority
                unoptimized={true}
              />
            ) : (
              <Gamepad2 className="h-12 w-12 text-primary" />
            )}
            {!effectiveLogo && (
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
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left order-1 lg:order-1 min-w-0 w-full">
            
{/* Mobile Logo ABOVE headline */}
<div className="lg:hidden flex justify-center items-center mb-4 w-full px-4">
  <div className="relative h-40 w-full max-w-[280px] mx-auto">
    {/* Always show layered logos (1.png and 2.png) on mobile */}
    <>
      {/* Character Logo (1.png) */}
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
          isVisible
            ? 'animate-[dropFromTop_1s_ease-out_forwards]'
            : 'opacity-0 -translate-y-full'
        }`}
        style={{ width: '200px', height: '150px' }}
      >
        <Image
          src={effectiveLogoLayer1}
          alt="Equip.gg Character Logo"
          width={400}
          height={300}
          className="object-contain"
          style={{ width: '100%', height: '100%' }}
          key={`logo1-mobile-${logoKey}`}
          priority
          quality={100}
          unoptimized={true}
        />
      </div>

      {/* Text Logo (2.png) */}
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 delay-500 ${
          isVisible
            ? 'animate-[slideFromUnder_1s_ease-out_0.5s_forwards]'
            : 'opacity-0 translate-y-full'
        }`}
        style={{ width: '210px', height: '95px' }}
      >
        <Image
          src={effectiveLogoLayer2}
          alt="Equip.gg Text Layer"
          width={420}
          height={190}
          className="object-contain"
          style={{ width: '100%', height: '100%' }}
          key={`logo2-mobile-${logoKey}`}
          priority
          quality={100}
          unoptimized={true}
        />
      </div>
    </>
  </div>
</div>
            {/* Headline */}
            <h1 
              className={`text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-headline font-bold tracking-tighter mb-6 text-shadow-lg transition-all duration-1000 ease-out transform ${
                isVisible && isDataLoaded ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
              }`}
              style={{ transitionDelay: '0.2s' }}
            >
              {effectiveTitle}
            </h1>

            {/* Subtext */}
            <p 
              className={`max-w-lg mx-auto lg:mx-0 text-base sm:text-lg lg:text-xl text-foreground/80 mb-8 lg:mb-8 transition-all duration-1000 ease-out transform ${
                isVisible && isDataLoaded ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
              }`}
              style={{ transitionDelay: '0.4s' }}
            >
              {effectiveDescription}
            </p>

            {/* Auth Buttons */}
            <div 
              className={`flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 transition-all duration-1000 ease-out transform ${
                isVisible && isDataLoaded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
              style={{ transitionDelay: '0.6s' }}
            >
              <AuthModal defaultTab="register">
                <Button
                  size="lg"
                  className="w-full sm:w-40 justify-center bg-primary font-bold text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  {effectiveButtonText}
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

          {/* Big Logos - Right side, separate from content and centered */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:items-center order-2">
            <div className="relative w-80 h-48">
              {useSingleLogo ? (
                <div className={`flex items-center justify-center transition-all duration-1000 group cursor-pointer ${
                  isVisible ? 'animate-[dropFromTop_1s_ease-out_forwards]' : 'opacity-0 transform -translate-y-full'
                }`}>
                  <Image 
                    src={effectiveLogo} 
                    alt="Site Logo" 
                    width={800}
                    height={560}
                    className="max-w-full max-h-full object-contain transition-all duration-300 hover:scale-110 hover:animate-[logoShake_0.5s_ease-in-out] active:scale-95"
                    style={{ width: 'auto', height: 'auto' }}
                    key={`logo-big-${logoKey}`}
                    priority
                    quality={100}
                    unoptimized={true}
                  />
                </div>
              ) : (
                <>
                  {/* Logo Layer 1 (1.png) - Base layer */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 group cursor-pointer ${
                    isVisible ? 'animate-[dropFromTop_1s_ease-out_forwards]' : 'opacity-0 transform -translate-y-full'
                  }`}>
                    <div className="translate-y-1 -translate-x-1">
                      <Image 
                        src={effectiveLogoLayer1} 
                        alt="Equip.gg Logo" 
                        width={840}
                        height={600}
                        className="max-w-full max-h-full object-contain transition-all duration-300 hover:scale-110 hover:animate-[logoShake_0.5s_ease-in-out] active:scale-95"
                        style={{ width: 'auto', height: 'auto' }}
                        key={`logo1-big-${logoKey}`}
                        priority
                        quality={100}
                        unoptimized={true}
                      />
                    </div>
                  </div>
                  {/* Logo Layer 2 (2.png) - Overlapping layer */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 delay-500 group cursor-pointer ${
                    isVisible ? 'animate-[slideFromUnderDesktop_1s_ease-out_0.5s_forwards]' : 'opacity-0 transform translate-y-full'
                  }`}>
                    <div className="-translate-y-2 -translate-x-1 relative z-10">
                      <Image 
                        src={effectiveLogoLayer2} 
                        alt="Equip.gg Logo Layer" 
                        width={900}
                        height={640}
                        className="max-w-full max-h-full object-contain transition-all duration-300 hover:scale-110 hover:animate-[logoShake_0.5s_ease-in-out] active:scale-95"
                        style={{ width: 'auto', height: 'auto' }}
                        key={`logo2-big-${logoKey}`}
                        priority
                        quality={100}
                        unoptimized={true}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
