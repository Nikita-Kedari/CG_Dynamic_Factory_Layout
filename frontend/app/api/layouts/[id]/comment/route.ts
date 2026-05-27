import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:4000';

export async function POST(
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
        const res = await fetch(`${BACKEND_URL}/api/layouts/${id}/comment`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                admin_comments: body.admin_comments || body.adminComments || '',
                reviewed_by: body.reviewed_by || body.reviewedBy || 'Admin',
                status: body.status
            })
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
