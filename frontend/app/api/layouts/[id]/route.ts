import { NextResponse } from 'next/server';
import { removeLayout, getLayouts } from '@/lib/store';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const layouts = getLayouts();
        const layout = layouts.find(l => l.id === id);
        if (!layout) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(layout);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch layout' }, { status: 500 });
    }
}


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
