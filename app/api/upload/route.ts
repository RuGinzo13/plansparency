import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest } from 'next/server';

// Token-generation only — no file bytes pass through this route.
// The client uploads directly to Vercel Blob using the returned token.
export async function POST(req: NextRequest): Promise<Response> {
  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname) => ({
        allowedContentTypes: ['application/pdf'],
        maximumSizeInBytes: 25 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {
        // Anthropic Files API upload happens in /api/ingest after the client receives the blob URL.
      },
    });
    return Response.json(response);
  } catch (e: any) {
    return Response.json({ error: e.message ?? 'Token generation failed' }, { status: 400 });
  }
}
