'use client';

import { useState, useEffect } from 'react';

interface SiteSettings {
  logo_url?: string;
  site_name?: string;
  description?: string;
  message_of_the_day?: string;
  betting_enabled?: boolean;
  shop_enabled?: boolean;
  arcade_enabled?: boolean;
  forums_enabled?: boolean;
  maintenance_mode?: boolean;
  // Legacy field support
  siteName?: string;
  siteDescription?: string;
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
          // Handle both new field names and legacy field names from API
          setSiteSettings({
            logo_url: data.logo_url || '/logo.png',
            site_name: data.site_name || data.siteName || 'EquipGG',
            description: data.description || data.siteDescription || 'The Ultimate CS2 Virtual Betting & Gaming Platform',
            message_of_the_day: data.message_of_the_day || 'Welcome to EquipGG.net!',
            betting_enabled: data.betting_enabled ?? data.enableBetting ?? true,
            shop_enabled: data.shop_enabled ?? true,
            arcade_enabled: data.arcade_enabled ?? true,
            forums_enabled: data.forums_enabled ?? true,
            maintenance_mode: data.maintenance_mode ?? data.maintenanceMode ?? false
          });
        } else {
          // Fallback to default settings
          setSiteSettings({
            logo_url: '/logo.png',
            site_name: 'EquipGG',
            description: 'The Ultimate CS2 Virtual Betting & Gaming Platform',
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
          logo_url: '/logo.png',
          site_name: 'EquipGG',
          description: 'The Ultimate CS2 Virtual Betting & Gaming Platform',
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
