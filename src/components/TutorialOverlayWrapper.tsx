"use client";
import React, { useEffect, useState } from "react";
import { TutorialOverlay } from "./TutorialOverlay";

export function TutorialOverlayWrapper() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tutorialStatus = localStorage.getItem("equipgg_tutorial_status");
      if (!tutorialStatus) setShowTutorial(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("equipgg_tutorial_status", "completed");
    setShowTutorial(false);
    // TODO: Trigger coin reward here
  };
  const handleSkip = () => {
    localStorage.setItem("equipgg_tutorial_status", "skipped");
    setShowTutorial(false);
  };

  return (
    <TutorialOverlay open={showTutorial} onComplete={handleComplete} onSkip={handleSkip} />
  );
}
