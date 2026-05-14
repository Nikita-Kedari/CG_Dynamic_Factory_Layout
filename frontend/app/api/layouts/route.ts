
import { NextResponse } from 'next/server';
import { getLayouts, addLayout } from '@/lib/store';
import { parseCSV } from '@/lib/csv-handler';
import { Configuration } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function GET() {
    const layouts = getLayouts();
    return NextResponse.json(layouts);
}

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file = data.get('file') as File;
        const name = data.get('name') as string || 'New Layout';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const text = await file.text();
        const factory = parseCSV(text);

        const newLayout: Configuration = {
            id: randomUUID(),
            factory,
            name,
            version: `v${Date.now()}`,
            isActive: false,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addLayout(newLayout);
        return NextResponse.json(newLayout);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}
