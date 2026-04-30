import { NextRequest, NextResponse } from 'next/server';

// Catch-all route handler for /api/proxy/fastapi/*
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pathname = request.nextUrl.pathname;

    // Extract path after /api/proxy/fastapi
    // Example: /api/proxy/fastapi/api/v1/chat/message → /api/v1/chat/message
    const fastApiPath = pathname.replace('/api/proxy/fastapi', '');

    // Construct the FastAPI URL
    const fastApiUrl = `http://localhost:8000${fastApiPath}`;

    console.log(`[FastAPI Proxy] POST ${fastApiUrl}`, { bodyKeys: Object.keys(body) });

    // Forward request to FastAPI
    const response = await fetch(fastApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`[FastAPI Proxy] Response status: ${response.status}`);

    // Try to parse as JSON, otherwise return as text
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return new NextResponse(responseText, { status: response.status });
    }
  } catch (error: any) {
    console.error('[FastAPI Proxy Error]', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to proxy request', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;

    // Extract path after /api/proxy/fastapi
    const fastApiPath = pathname.replace('/api/proxy/fastapi', '');

    // Construct the FastAPI URL with query parameters
    const fastApiUrl = `http://localhost:8000${fastApiPath}${search}`;

    console.log(`[FastAPI Proxy] GET ${fastApiUrl}`);

    // Forward request to FastAPI
    const response = await fetch(fastApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return new NextResponse(responseText, { status: response.status });
    }
  } catch (error: any) {
    console.error('[FastAPI Proxy Error]', error.message);
    return NextResponse.json(
      { error: 'Failed to proxy request', message: error.message },
      { status: 500 }
    );
  }
}
