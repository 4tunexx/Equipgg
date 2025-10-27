
import { PrestigeActivityFeed } from "../components/prestige-activity-feed";
import { Footer } from "../components/footer";
import { FeaturedItemsCarousel } from "../components/landing/featured-items-carousel";
import { LeaderboardPreview } from "../components/landing/leaderboard-preview";
import { LiveStats } from "../components/landing/live-stats";
import { UpcomingMatches } from "../components/landing/upcoming-matches";
import { HeroSection } from "../components/landing/hero-section";
import { FeatureHighlights } from "../components/landing/feature-highlights";
import { FlashSaleBanner } from "../components/flash-sale-banner";
import { Particles } from "../components/particles";
import { DashboardRedirect } from "../components/landing/dashboard-redirect";

export default function Home() {

  return (
    <div className="flex flex-col bg-background text-foreground relative">
      <DashboardRedirect />
      <Particles />
      <PrestigeActivityFeed />
      <main className="flex-1">
        <HeroSection />
        <div className='container mx-auto py-8'>
          <FlashSaleBanner />
        </div>
        <LiveStats />
        <div className="container mx-auto space-y-20 px-4 py-16 sm:space-y-32">
          <FeatureHighlights />
          <FeaturedItemsCarousel />
          <UpcomingMatches />
          <LeaderboardPreview />
        </div>
      </main>
      <Footer />
    </div>
  );
}
