
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Gem, Star } from "lucide-react";

interface MissionSummaryCardProps {
  mainMissionProgress: number;
  totalXpEarned: number;
  totalCoinsEarned: number;
}

export function MissionSummaryCard({ mainMissionProgress, totalXpEarned, totalCoinsEarned }: MissionSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
        <CardDescription>An overview of your mission accomplishments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Main Mission Completion</h3>
                <span className="font-bold text-primary">{Math.round(mainMissionProgress)}%</span>
            </div>
            <Progress value={mainMissionProgress} className="h-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-secondary/50 p-4">
                <div className="flex items-center gap-4">
                    <Star className="w-8 h-8 text-sky-400" />
                    <div>
                        <p className="text-muted-foreground">Total XP Earned</p>
                        <p className="text-2xl font-bold">{totalXpEarned.toLocaleString()}</p>
                    </div>
                </div>
            </Card>
            <Card className="bg-secondary/50 p-4">
                 <div className="flex items-center gap-4">
                    <Gem className="w-8 h-8 text-yellow-400" />
                    <div>
                        <p className="text-muted-foreground">Total Coins Awarded</p>
                        <p className="text-2xl font-bold">{totalCoinsEarned.toLocaleString()}</p>
                    </div>
                </div>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}
