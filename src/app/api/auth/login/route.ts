// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Create a server client if we have service role; otherwise use anon
const supabase = SUPABASE_SERVICE
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE)
  : createClient(SUPABASE_URL, SUPABASE_ANON);

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // defensive checks
    if (!SUPABASE_URL || (!SUPABASE_ANON && !SUPABASE_SERVICE)) {
      console.error("Missing Supabase env vars");
      return jsonError("Server misconfiguration: missing supabase env keys", 500);
    }

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return jsonError("Email and password required", 400);
    }

    // run sign-in with timeout (10s)
    const signInPromise = supabase.auth.signInWithPassword({ email, password });

    const data = await Promise.race([
      signInPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login timeout")), 10000)
      )
    ]) as any;

    // supabase returns { data, error } or throws — normalize
    if (!data || data.error || (!data.data?.session && !data.session && !data.user)) {
      // older supabase client returns { data, error }, newer returns {data, error} too
      // handle both shapes
      const errMsg =
        (data && data.error && data.error.message) ||
        (data && data.message) ||
        "Invalid credentials";
      console.error("Login failed:", errMsg);
      return jsonError(errMsg, 401);
    }

    // prefer shape data.data.session or data.session
    const session = (data.data && data.data.session) || data.session || null;
    const user = (data.data && data.data.user) || data.user || null;

    if (!session || !user) {
      console.error("Sign-in returned but missing session or user", { data });
      return jsonError("Authentication failed", 401);
    }

    // success response -> return session & user (server sets cookie)
    const response = NextResponse.json({ ok: true, user, session });

    // set httpOnly cookie for server auth reading (optional name)
    response.cookies.set("equipgg_session", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Login route error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
