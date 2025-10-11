import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '../../../../lib/auth-utils';
import { secureDb } from '../../../../lib/secure-db';

interface PageTogglesMap { [page: string]: boolean }

const SETTING_KEY = 'page_toggles';

async function getStoredToggles(): Promise<PageTogglesMap> {
  const existing = await secureDb.findOne<any>('site_settings', { setting_key: SETTING_KEY });
  if (!existing?.setting_value) return {};
  try {
    return JSON.parse(existing.setting_value) as PageTogglesMap;
  } catch {
    return {};
  }
}

async function saveToggles(toggles: PageTogglesMap) {
  console.log('saveToggles called with:', toggles);
  const existing = await secureDb.findOne<any>('site_settings', { setting_key: SETTING_KEY });
  const payload = { setting_value: JSON.stringify(toggles), setting_type: 'json' } as any;
  console.log('Existing record:', existing);
  console.log('Payload to save:', payload);
  
  if (existing) {
    const result = await secureDb.update('site_settings', { setting_key: SETTING_KEY }, payload);
    console.log('Update result:', result);
  } else {
    const result = await secureDb.create('site_settings', { setting_key: SETTING_KEY, ...payload });
    console.log('Create result:', result);
  }
}

// Potentially toggleable dashboard sub-pages (excluding admin itself & root dashboard)
// Expanded list of dashboard sub-pages (directory names) excluding 'admin' root
const POSSIBLE_PAGES = [
  'shop', 'profile', 'trading', 'support', 'inventory', 'missions', 'leaderboard', 'gems', 'gem-economy', 'payments', 'crates', 'arcade', 'betting', 'chat', 'community', 'moderator'
];

export async function GET(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return createUnauthorizedResponse();
  if (session.role !== 'admin') return createForbiddenResponse('Admin access required');
  const toggles = await getStoredToggles();
  return NextResponse.json({ toggles, possiblePages: POSSIBLE_PAGES });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return createUnauthorizedResponse();
  if (session.role !== 'admin') return createForbiddenResponse('Admin access required');
  try {
    const body = await request.json();
    console.log('PUT /api/admin/page-toggles received:', body);
    
    // Support single or bulk updates
    if ('updates' in body) {
      const { updates } = body as { updates: { page: string; enabled: boolean }[] };
      if (!Array.isArray(updates) || updates.length === 0) {
        return NextResponse.json({ error: 'updates array required' }, { status: 400 });
      }
      const toggles = await getStoredToggles();
      console.log('Current stored toggles:', toggles);
      
      for (const u of updates) {
        if (u && POSSIBLE_PAGES.includes(u.page) && typeof u.enabled === 'boolean') {
          toggles[u.page] = u.enabled;
        }
      }
      console.log('New toggles to save:', toggles);
      await saveToggles(toggles);
      
      // Verify it was saved
      const verified = await getStoredToggles();
      console.log('Verified saved toggles:', verified);
      
      return NextResponse.json({ success: true, toggles: verified });
    } else {
      const { page, enabled } = body as { page?: string; enabled?: boolean };
      if (!page || typeof enabled !== 'boolean') {
        return NextResponse.json({ error: 'Missing page or enabled' }, { status: 400 });
      }
      if (!POSSIBLE_PAGES.includes(page)) {
        return NextResponse.json({ error: 'Invalid page' }, { status: 400 });
      }
      const toggles = await getStoredToggles();
      toggles[page] = enabled;
      await saveToggles(toggles);
      return NextResponse.json({ success: true, toggles });
    }
  } catch (e) {
    console.error('Error in PUT /api/admin/page-toggles:', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
