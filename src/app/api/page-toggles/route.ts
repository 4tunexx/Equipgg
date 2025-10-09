import { NextRequest, NextResponse } from 'next/server';
import { secureDb } from '../../../lib/secure-db';

const SETTING_KEY = 'page_toggles';

export async function GET(_request: NextRequest) {
  try {
    const existing = await secureDb.findOne<any>('site_settings', { setting_key: SETTING_KEY });
    if (!existing?.setting_value) return NextResponse.json({ toggles: {} });
    try {
      const parsed = JSON.parse(existing.setting_value);
      return NextResponse.json({ toggles: parsed || {} });
    } catch {
      return NextResponse.json({ toggles: {} });
    }
  } catch (e) {
    return NextResponse.json({ toggles: {} });
  }
}
