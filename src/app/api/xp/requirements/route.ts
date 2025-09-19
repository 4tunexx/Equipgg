import { NextRequest, NextResponse } from 'next/server';
import { getXPRequirements } from "../../../../lib/xp-service";
import { defaultXPConfig } from "../../../../lib/xp-config";

// GET /api/xp/requirements - Get XP requirements for levels
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startLevel = parseInt(searchParams.get('start') || '1');
    const endLevel = parseInt(searchParams.get('end') || '20');

    // Validate parameters
    if (startLevel < 1 || endLevel < startLevel || endLevel > 1000) {
      return NextResponse.json({ 
        error: 'Invalid level range. Start must be >= 1, end must be >= start, and end must be <= 1000' 
      }, { status: 400 });
    }

    const requirements = getXPRequirements(startLevel, endLevel, defaultXPConfig);

    return NextResponse.json({
      success: true,
      requirements,
      config: defaultXPConfig
    });

  } catch (error) {
    console.error('Error fetching XP requirements:', error);
    return NextResponse.json({ error: 'Failed to fetch XP requirements' }, { status: 500 });
  }
}
