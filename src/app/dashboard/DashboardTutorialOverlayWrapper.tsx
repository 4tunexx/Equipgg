"use client";

import React, { useEffect, useState } from "react";
import { TutorialOverlay } from "../../components/TutorialOverlay";
import { useAuth } from "../../components/auth-provider";

export function DashboardTutorialOverlayWrapper() {
  const { user, loading } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [highlightStep, setHighlightStep] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const tutorialStatus = localStorage.getItem("equipgg_tutorial_status");
      // Only show if status is not 'skipped' or 'completed'
      if (!tutorialStatus) setShowTutorial(true);
      else setShowTutorial(false);
    } else {
      setShowTutorial(false);
    }
  }, [user, loading]);

  const handleComplete = () => {
    localStorage.setItem("equipgg_tutorial_status", "completed");
    setShowTutorial(false);
    setHighlightStep(null);
    // TODO: Trigger coin reward here
  };
  const handleSkip = () => {
    localStorage.setItem("equipgg_tutorial_status", "skipped");
    setShowTutorial(false);
    setHighlightStep(null);
  };

  // Highlight nav for certain steps
  const handleStepChange = (step: number) => {
    // Example: step 1 = profile, step 2 = betting, etc.
    setHighlightStep(step);
    // You can add more logic here to add/remove highlight classes
  };

  return (
    <TutorialOverlay
      open={showTutorial}
      onComplete={handleComplete}
      onSkip={handleSkip}
      onStepChange={handleStepChange}
      highlightStep={highlightStep}
    />
  );
}
