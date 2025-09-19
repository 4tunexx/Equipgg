
'use client';

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Clock, Percent, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface FlashSale {
    id: string;
    name: string;
    description: string;
    discount_percentage: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export function FlashSaleBanner() {
    const [sale, setSale] = useState<FlashSale | null>(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveSale = async () => {
            try {
                const response = await fetch('/api/landing/flash-sales');
                if (response.ok) {
                    const sales = await response.json();
                    const activeSale = sales.find((s: FlashSale) => s.is_active && new Date(s.end_date) > new Date());
                    setSale(activeSale || null);
                }
            } catch (error) {
                console.error('Failed to fetch flash sale:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveSale();
    }, []);

    useEffect(() => {
        if (!sale) return;

        const calculateTimeLeft = (): TimeLeft | object => {
            const difference = +new Date(sale.end_date) - +new Date();
            let timeLeft: TimeLeft | object = {};

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return timeLeft;
        }

        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            if (Object.keys(newTimeLeft).length) {
                const { days, hours, minutes, seconds } = newTimeLeft as TimeLeft;
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeLeft('Sale Ended');
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);

    }, [sale]);

    if (loading) {
        return null; // Don't show anything while loading
    }

    if (!sale) {
        return null; // Don't show banner if no active sale
    }

    return (
        <Alert className="border-primary/50 bg-primary/10 text-primary-foreground animate-pulse">
            <Percent className="h-5 w-5 text-primary" />
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
                <div className="flex-1">
                    <AlertTitle className="font-bold text-lg text-primary">{sale.name} - {sale.discount_percentage}% OFF!</AlertTitle>
                    <AlertDescription>
                        {sale.description || "Limited time offer! Grab your favorite items and perks at a discounted price."}
                    </AlertDescription>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-mono text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Ends in: {timeLeft}</span>
                    </div>
                     <Link href="/dashboard/shop">
                        <Button size="sm">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Go to Shop
                        </Button>
                    </Link>
                </div>
            </div>
        </Alert>
    )
}
