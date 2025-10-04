import { useState, useEffect } from 'react';

interface HeroPanelData {
  id: string;
  title: string;
  content: string;
  image_url: string;
  logo_layer1: string;
  logo_layer2: string;
  button_text: string;
  button_url: string;
  is_active: boolean;
  display_order: number;
}

export function useHeroPanelData() {
  const [heroPanelData, setHeroPanelData] = useState<HeroPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroPanelData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/landing/panels');
        
        if (!response.ok) {
          throw new Error('Failed to fetch hero panel data');
        }
        
        const data = await response.json();
        const heroPanel = data.panels?.find((panel: any) => panel.type === 'hero');
        
        if (heroPanel) {
          setHeroPanelData(heroPanel);
        } else {
          // Set default values if no hero panel is found
          setHeroPanelData({
            id: '',
            title: 'Welcome to EquipGG',
            content: 'The ultimate destination for CS2 gambling and gaming excitement.',
            image_url: '/bg2.png',
            logo_layer1: '/1.png',
            logo_layer2: '/2.png',
            button_text: 'Get Started',
            button_url: '/auth',
            is_active: true,
            display_order: 1
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching hero panel data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set default values on error
        setHeroPanelData({
          id: '',
          title: 'Welcome to EquipGG',
          content: 'The ultimate destination for CS2 gambling and gaming excitement.',
          image_url: '/bg2.png',
          logo_layer1: '/1.png',
          logo_layer2: '/2.png',
          button_text: 'Get Started',
          button_url: '/auth',
          is_active: true,
          display_order: 1
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHeroPanelData();
  }, []);

  return {
    heroPanelData,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      // Re-fetch data
      const fetchHeroPanelData = async () => {
        try {
          const response = await fetch('/api/landing/panels');
          if (!response.ok) throw new Error('Failed to fetch hero panel data');
          const data = await response.json();
          const heroPanel = data.panels?.find((panel: any) => panel.type === 'hero');
          if (heroPanel) {
            setHeroPanelData(heroPanel);
          }
          setError(null);
        } catch (err) {
          console.error('Error refreshing hero panel data:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };
      fetchHeroPanelData();
    }
  };
}