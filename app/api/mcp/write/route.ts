// app/api/mcp/write/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs'; // Required for filesystem access

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
            error: 'Forbidden in production. Filesystem is read-only or ephemeral.'
        }, { status: 403 });
    }

    try {
        const { path: filePath, content } = await req.json();

        if (!filePath || !content) {
            return NextResponse.json({ error: 'Missing path or content' }, { status: 400 });
        }

        // Sanitize path to prevent directory traversal
        const safePath = path.resolve(process.cwd(), filePath);
        if (!safePath.startsWith(process.cwd())) {
            return NextResponse.json({ error: 'Invalid path outside project root' }, { status: 403 });
        }

        // Ensure directory exists
        const dir = path.dirname(safePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(safePath, content, 'utf-8');

        return NextResponse.json({
            success: true,
            message: `File written to ${filePath}`,
            path: safePath
        });

    } catch (error: any) {
        console.error('Error writing file:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
