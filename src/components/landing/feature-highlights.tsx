'use client';

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Target, Gift, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from 'react';

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

// Default feature highlights data - fallback when no admin content
const defaultFeatureHighlightsData = [
  {
    icon: Target,
    title: "Precision Betting",
    description: "Make informed bets on CS2 matches with real-time odds"
  },
  {
    icon: Gift,
    title: "Crate Opening",
    description: "Unlock rare skins and items from exclusive crates"
  },
  {
    icon: Trophy,
    title: "Competitive Gaming",
    description: "Climb the leaderboards and earn rewards"
  },
  {
    icon: Zap,
    title: "Level Up & Equip",
    description: "Level up your profile, equip items, and unlock exclusive rewards"
  }
];

export function FeatureHighlights() {
  const [featuresPanel, setFeaturesPanel] = useState<LandingPanel | null>(null);
  const [featureHighlightsData, setFeatureHighlightsData] = useState(defaultFeatureHighlightsData);

  // Fetch features panel data from admin-managed content
  useEffect(() => {
    const fetchFeaturesPanel = async () => {
      try {
        const response = await fetch('/api/landing/panels');
        if (response.ok) {
          const data = await response.json();
          const featuresPanelData = data.panels?.find((panel: LandingPanel) => panel.type === 'features');
          if (featuresPanelData) {
            setFeaturesPanel(featuresPanelData);
            
            // Convert admin panel items to feature highlights format
            if (featuresPanelData.items && Array.isArray(featuresPanelData.items)) {
              const adminFeatures = featuresPanelData.items.map((item: any, index: number) => {
                const iconMap: { [key: string]: any } = {
                  'target': Target,
                  'gift': Gift,
                  'trophy': Trophy,
                  'zap': Zap,
                  'gamepad': Gift, // fallback for gamepad icon
                };
                
                return {
                  icon: iconMap[item.icon?.toLowerCase()] || [Target, Gift, Trophy, Zap][index % 4],
                  title: item.title || `Feature ${index + 1}`,
                  description: item.description || item.content || 'Feature description'
                };
              });
              setFeatureHighlightsData(adminFeatures);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch features panel:', error);
      }
    };

    fetchFeaturesPanel();
  }, []);

  return (
    <section>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-headline font-bold">
          {featuresPanel?.title || 'Dominate the Arena'}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-2">
          {featuresPanel?.content || 'Explore a complete ecosystem of features designed to engage, entertain, and reward the CS2 community.'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featureHighlightsData.map((feature, index) => (
          <Card key={index} className="bg-card/50 hover:border-primary/50 hover:bg-card transition-all group">
            <CardHeader className="flex flex-row items-center gap-4">
              <feature.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <CardTitle className="text-xl font-headline">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
