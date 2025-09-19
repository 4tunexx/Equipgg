import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Target, Gift, Trophy } from "lucide-react";

// Temporary feature highlights data - TODO: move to database
const featureHighlightsData = [
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
  }
];

export function FeatureHighlights() {
  return (
    <section>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-headline font-bold">Dominate the Arena</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-2">
          Explore a complete ecosystem of features designed to engage, entertain, and reward the CS2 community.
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
