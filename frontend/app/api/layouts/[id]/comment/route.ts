import { NextResponse } from 'next/server';
import { updateLayout } from '@/lib/store';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const adminComments = body.adminComments;
        const reviewedBy = body.reviewedBy || 'Admin';
        
        if (typeof adminComments !== 'string') {
            return NextResponse.json({ error: 'Comment must be a string' }, { status: 400 });
        }
        
        const updated = updateLayout(id, { 
            adminComments,
            reviewedBy,
            reviewedAt: new Date().toISOString()
        });
        
        if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }
}
