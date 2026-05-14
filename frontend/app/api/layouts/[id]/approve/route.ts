import { NextResponse } from 'next/server';
import { updateLayout } from '@/lib/store';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const reviewedBy = body.reviewedBy || 'Admin';
        
        const updated = updateLayout(id, { 
            status: 'approved',
            reviewedBy,
            reviewedAt: new Date().toISOString()
        });
        
        if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to approve layout' }, { status: 500 });
    }
}
