
'use client';

import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function MaintenancePage() {
    const [progress, setProgress] = useState(13)

    useEffect(() => {
        const timer = setInterval(() => {
        setProgress(prev => (prev >= 100 ? 0 : prev + Math.floor(Math.random() * 20) + 10))
        }, 800)
        return () => {
            clearInterval(timer)
        }
    }, [])
    
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="text-center space-y-6">
             <Image
                src="/logo.png"
                alt="EquipGG Logo"
                width={256}
                height={256}
                className="object-contain mx-auto animate-pulse"
                data-ai-hint="esports mascot logo"
            />
            <h1 className="text-4xl font-headline font-bold">Under Maintenance</h1>
            <p className="text-lg text-muted-foreground max-w-md">Sorry but we need to fix something! Come back later!</p>
            <div className="w-full max-w-sm mx-auto">
                <Progress value={progress} className="w-full h-3" />
            </div>
        </div>
    </div>
  );
}
