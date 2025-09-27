import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 1MB for avatars)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 1MB.' 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads/avatars directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename with user ID
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `avatar_${session.user_id}_${timestamp}_${randomString}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file - convert Buffer to Uint8Array for writeFile compatibility
    await writeFile(filepath, new Uint8Array(buffer));

    // Update user's avatar_url in database
    const publicUrl = `/uploads/avatars/${filename}`;
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Error updating user avatar URL:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update avatar in database' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: filename 
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload avatar' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove avatar URL from database (reset to null)
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Error removing user avatar URL:', updateError);
      return NextResponse.json({ 
        error: 'Failed to remove avatar from database' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Avatar removed successfully'
    });

  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json({ 
      error: 'Failed to remove avatar' 
    }, { status: 500 });
  }
}