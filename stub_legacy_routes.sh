#!/bin/bash

# List of files to replace with stubs
files=(
  "src/app/api/landing/panels/toggle-visibility/route.ts"
  "src/app/api/landing/panels/move/route.ts"
  "src/app/api/landing/sliders/route.ts"
  "src/app/api/landing/featured-items/route.ts"
  "src/app/api/landing/flash-sales/route.ts"
  "src/app/api/landing/site-settings/route.ts"
  "src/app/api/user/upgrade-vip/route.ts"
  "src/app/api/user/perks/route.ts"
  "src/app/api/user/keys/route.ts"
  "src/app/api/matches/test/route.ts"
  "src/app/api/matches/route.ts"
  "src/app/api/voting/cast/route.ts"
  "src/app/api/voting/results/route.ts"
  "src/app/api/crates/give/route.ts"
  "src/app/api/trade-up/route.ts"
  "src/app/api/create-test-users/route.ts"
  "src/app/api/betting/user-bets/route.ts"
  "src/app/api/payments/stripe/route.ts"
  "src/app/api/xp/award/route.ts"
  "src/app/api/events/login/route.ts"
  "src/app/api/create-users/route.ts"
  "src/app/api/games/history/route.ts"
  "src/app/api/games/play/route.ts"
  "src/app/api/test-db-users/route.ts"
  "src/app/api/messages/route.ts"
  "src/app/api/site-settings/route.ts"
  "src/app/api/coinflip/join/route.ts"
  "src/app/api/coinflip/lobbies/route.ts"
  "src/app/api/missions/progress/route.ts"
  "src/app/api/missions/route.ts"
  "src/app/api/missions/summary/route.ts"
  "src/app/api/admin/seed-featured-items/route.ts"
  "src/app/api/admin/shop/route.ts"
  "src/app/api/admin/users/reward/route.ts"
)

# Create stub content
stub_content='import { NextRequest, NextResponse } from "next/server";

// Legacy database route - disabled during Supabase migration
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: "This feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "This feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ 
    error: "This feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: "This feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}'

# Replace each file with stub
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Stubbing $file"
    echo "$stub_content" > "$file"
  fi
done

echo "All legacy database routes have been stubbed!"