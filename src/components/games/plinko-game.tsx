
'use client';

import { Card, CardContent } from "../ui/card";



export function PlinkoGame() {
    return (
        <div className="flex items-center justify-center min-h-[600px]">
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Under Maintenance
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        The Plinko game is currently under maintenance. We&apos;re working to fix some issues and will have it back up soon!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Thank you for your patience.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}