'use client';

import { useState, useEffect } from 'react';

interface SiteSettings {
  logo_url: string;
  message_of_the_day: string;
  betting_enabled: boolean;
  shop_enabled: boolean;
  arcade_enabled: boolean;
  forums_enabled: boolean;
  maintenance_mode: boolean;
}

export function useSiteSettings() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/site-settings');
        
        if (response.ok) {
          const data = await response.json();
          setSiteSettings(data.siteSettings || {
            logo_url: '/logo.svg',
            message_of_the_day: 'Welcome to EquipGG.net!',
            betting_enabled: true,
            shop_enabled: true,
            arcade_enabled: true,
            forums_enabled: true,
            maintenance_mode: false
          });
        } else {
          // Fallback to default settings
          setSiteSettings({
            logo_url: '/logo.svg',
            message_of_the_day: 'Welcome to EquipGG.net!',
            betting_enabled: true,
            shop_enabled: true,
            arcade_enabled: true,
            forums_enabled: true,
            maintenance_mode: false
          });
        }
      } catch (error) {
        console.error('Failed to fetch site settings:', error);
        // Fallback to default settings
        setSiteSettings({
          logo_url: '/logo.svg',
          message_of_the_day: 'Welcome to EquipGG.net!',
          betting_enabled: true,
          shop_enabled: true,
          arcade_enabled: true,
          forums_enabled: true,
          maintenance_mode: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSiteSettings();
  }, []);

  return { siteSettings, loading };
}
