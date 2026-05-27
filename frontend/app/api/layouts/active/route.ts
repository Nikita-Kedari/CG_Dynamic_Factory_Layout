
import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:4000';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (authHeader) {
        headers['authorization'] = authHeader;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/layouts/active`, {
            headers,
            cache: 'no-store'
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) {
        headers['authorization'] = authHeader;
    }

    try {
        const body = await request.json();
        const res = await fetch(`${BACKEND_URL}/api/layouts/active`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
