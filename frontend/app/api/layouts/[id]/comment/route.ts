import { NextResponse } from 'next/server';
import { updateLayout } from '@/lib/store';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const adminComments = body.admin_comments || body.adminComments;
        const status = body.status;
        const reviewedBy = body.reviewed_by || body.reviewedBy || 'Admin';
        
        const updates: any = { 
            adminComments,
            reviewedBy,
            reviewedAt: new Date().toISOString()
        };

        if (status) updates.status = status;
        
        const updated = updateLayout(id, updates);
        
        if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }
}
