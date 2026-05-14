import { NextResponse } from 'next/server';
import { removeLayout } from '@/lib/store';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        removeLayout(id);
        return NextResponse.json({ success: true, message: 'Layout removed successfully' });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete layout' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { updateLayout } = await import('@/lib/store');
        const updated = updateLayout(id, body);
        if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update layout' }, { status: 500 });
    }
}
