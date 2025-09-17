import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  // Only allow specific domains for security
  const allowedDomains = [
    'img-cdn.hltv.org',
    'picsum.photos',
    'steamcdn-a.akamaihd.net',
    'avatars.steamstatic.com'
  ];

  try {
    const url = new URL(imageUrl);
    if (!allowedDomains.includes(url.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*',
        'Referer': 'https://www.hltv.org/'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Return a default team logo on error
    try {
      const defaultResponse = await fetch(`${request.nextUrl.origin}/default-team-logo.svg`);
      if (defaultResponse.ok) {
        const defaultBuffer = await defaultResponse.arrayBuffer();
        return new NextResponse(defaultBuffer, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    } catch (fallbackError) {
      console.error('Fallback image error:', fallbackError);
    }

    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}