import { NextResponse } from 'next/server';
import { getLayouts } from '@/lib/store';

export async function GET() {
    try {
        const layouts = getLayouts();
        const count = layouts.filter(l => l.status === 'pending').length;
        return NextResponse.json({ count });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to get pending count' }, { status: 500 });
    }
}
