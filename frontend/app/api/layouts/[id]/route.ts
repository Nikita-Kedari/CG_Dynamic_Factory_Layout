import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:4000';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (authHeader) {
        headers['authorization'] = authHeader;
    }

    try {
        const { id } = await params;
        const res = await fetch(`${BACKEND_URL}/api/layouts/${id}/view`, {
            headers,
            cache: 'no-store'
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) {
        headers['authorization'] = authHeader;
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const res = await fetch(`${BACKEND_URL}/api/layouts/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return NextResponse.json({ success: true, message: 'Layout removed successfully' });
}
