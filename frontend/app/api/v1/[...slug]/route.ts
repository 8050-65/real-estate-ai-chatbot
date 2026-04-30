import { NextRequest, NextResponse } from 'next/server';

// Catch-all route handler for /api/v1/*
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;

    // Extract path after /api/v1
    const springBootPath = pathname.replace('/api/v1', '');

    // Construct the Spring Boot URL
    const springBootUrl = `http://localhost:8080/api/v1${springBootPath}${search}`;

    console.log(`[Spring Boot Proxy] POST ${springBootUrl}`, {
      bodyKeys: typeof body === 'object' ? Object.keys(body) : 'non-object'
    });

    // Forward ALL headers including authorization
    const headers: any = new Headers(request.headers);
    headers.set('Content-Type', 'application/json');

    console.log(`[Spring Boot Proxy] Authorization header: ${headers.get('authorization')?.substring(0, 20) || 'MISSING'}...`);

    // Forward request to Spring Boot
    const response = await fetch(springBootUrl, {
      method: 'POST',
      headers: headers as any,
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`[Spring Boot Proxy] Response status: ${response.status}`);

    // Try to parse as JSON, otherwise return as text
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return new NextResponse(responseText, { status: response.status });
    }
  } catch (error: any) {
    console.error('[Spring Boot Proxy Error]', error.message, error.stack);
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

    // Extract path after /api/v1
    const springBootPath = pathname.replace('/api/v1', '');

    // Construct the Spring Boot URL with query parameters
    const springBootUrl = `http://localhost:8080/api/v1${springBootPath}${search}`;

    console.log(`[Spring Boot Proxy] GET ${springBootUrl}`);

    // Forward ALL headers including authorization
    const headers: any = new Headers(request.headers);
    headers.set('Content-Type', 'application/json');

    console.log(`[Spring Boot Proxy] Authorization header: ${headers.get('authorization')?.substring(0, 20) || 'MISSING'}...`);

    // Forward request to Spring Boot
    const response = await fetch(springBootUrl, {
      method: 'GET',
      headers: headers as any,
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
    console.error('[Spring Boot Proxy Error]', error.message);
    return NextResponse.json(
      { error: 'Failed to proxy request', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;

    // Extract path after /api/v1
    const springBootPath = pathname.replace('/api/v1', '');

    // Construct the Spring Boot URL
    const springBootUrl = `http://localhost:8080/api/v1${springBootPath}${search}`;

    console.log(`[Spring Boot Proxy] PUT ${springBootUrl}`, {
      bodyKeys: typeof body === 'object' ? Object.keys(body) : 'non-object'
    });

    // Forward ALL headers including authorization
    const headers: any = new Headers(request.headers);
    headers.set('Content-Type', 'application/json');

    console.log(`[Spring Boot Proxy] Authorization header: ${headers.get('authorization')?.substring(0, 20) || 'MISSING'}...`);

    // Forward request to Spring Boot
    const response = await fetch(springBootUrl, {
      method: 'PUT',
      headers: headers as any,
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`[Spring Boot Proxy] Response status: ${response.status}`);

    // Try to parse as JSON, otherwise return as text
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return new NextResponse(responseText, { status: response.status });
    }
  } catch (error: any) {
    console.error('[Spring Boot Proxy Error]', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to proxy request', message: error.message },
      { status: 500 }
    );
  }
}
