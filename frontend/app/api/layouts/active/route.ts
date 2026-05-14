
import { NextResponse } from 'next/server';
import { getActiveLayout, activateLayout } from '@/lib/store';

export async function GET() {
    const activeLayout = getActiveLayout();
    return NextResponse.json(activeLayout);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { id } = body;

    if (!id) {
        return NextResponse.json({ error: 'Layout ID required' }, { status: 400 });
    }

    const active = activateLayout(id);
    if (!active) {
        return NextResponse.json({ error: 'Layout not found' }, { status: 404 });
    }

    return NextResponse.json(active);
}
