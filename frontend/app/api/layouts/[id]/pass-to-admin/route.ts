import { NextResponse } from 'next/server';
import { updateLayout } from '@/lib/store';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const updated = updateLayout(id, { status: 'pending' });
        if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to pass layout to admin' }, { status: 500 });
    }
}
