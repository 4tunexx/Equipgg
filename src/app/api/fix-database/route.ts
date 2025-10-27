import { NextRequest, NextResponse } from 'next/server'
import { runDatabaseFixes } from '../../../lib/database-fix'

export async function GET(request: NextRequest) {
  try {
    await runDatabaseFixes()
    return NextResponse.json({ success: true, message: 'Database structure verified and fixed' })
  } catch (error) {
    console.error('Error fixing database:', error)
    return NextResponse.json({ error: 'Failed to fix database structure' }, { status: 500 })
  }
}