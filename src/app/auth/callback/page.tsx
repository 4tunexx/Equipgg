"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "../../../hooks/use-toast";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase and many providers use 'type' or 'action' or 'mode' in query
    const type = searchParams.get("type") || searchParams.get("action") || searchParams.get("mode");
    const error = searchParams.get("error") || searchParams.get("error_description");

    if (type === "email_confirmed" || type === "signup" || type === "confirm") {
      toast({
        title: "Email confirmed!",
        description: "Your email has been confirmed. You can now log in.",
      });
    } else if (type === "recovery" || type === "reset" || type === "password_reset") {
      toast({
        title: "Password reset!",
        description: "Your password has been reset. You can now log in.",
      });
    } else if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }

    // Redirect to sign-in after 3 seconds
    const timeout = setTimeout(() => {
      router.replace("/sign-in");
    }, 3000);
    return () => clearTimeout(timeout);
  }, [searchParams, toast, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
