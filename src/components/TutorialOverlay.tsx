import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

export interface TutorialStep {
  title: string;
  description: string;
}

const steps: TutorialStep[] = [
  {
    title: "Welcome to EquipGG!",
    description: "This quick tutorial will guide you through the main features. Complete it to earn 10 coins!",
  },
  {
    title: "Profile & Balance",
    description: "Check your profile, balance, and achievements here.",
  },
  {
    title: "Betting & Games",
    description: "Explore games, place bets, and join events from the main menu.",
  },
  {
    title: "Inventory & Crates",
    description: "Open crates, manage your inventory, and view your items.",
  },
  {
    title: "Good Luck!",
    description: "You’re ready to start. Enjoy and have fun!",
  },
];

export function TutorialOverlay({
  open,
  onComplete,
  onSkip,
  onStepChange,
  highlightStep,
}: {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onStepChange?: (step: number) => void;
  highlightStep?: number | null;
}) {
  const [step, setStep] = useState(0);

  React.useEffect(() => {
    if (onStepChange) onStepChange(step);
  }, [step, onStepChange]);

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <Dialog open={open}>
      {open && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />}
      <DialogContent className="z-50 max-w-md mx-auto text-center">
        <DialogTitle asChild>
          <h2 className="text-2xl font-bold mb-2">{steps[step].title}</h2>
        </DialogTitle>
        <p className="mb-6">{steps[step].description}</p>
        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={onSkip}>
            Skip Tutorial
          </Button>
          <Button onClick={handleNext}>
            {step === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Step {step + 1} of {steps.length}
        </div>
      </DialogContent>
    </Dialog>
  );
}
