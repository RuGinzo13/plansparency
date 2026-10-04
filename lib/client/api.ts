// ── Upload helper ──
// Sends the PDF as FormData directly to /api/ingest (Node.js route).
// onProgress(pct) fires with 0..100 as the upload progresses.
export async function uploadFile(
  f: File,
  onProgress?: (pct: number) => void,
  abortSignal?: AbortSignal,
): Promise<string> {
  // 3-minute hard timeout; also respects the caller's AbortSignal
  const localCtrl = new AbortController();
  const timeoutId = setTimeout(() => localCtrl.abort(), 180_000);

  // Combine caller signal + our timeout signal
  let signal: AbortSignal;
  if (!abortSignal) {
    signal = localCtrl.signal;
  } else if ((AbortSignal as any).any) {
    signal = (AbortSignal as any).any([abortSignal, localCtrl.signal]);
  } else {
    // AbortSignal.any unavailable: forward caller abort into localCtrl so both are respected
    if (abortSignal.aborted) {
      localCtrl.abort(abortSignal.reason);
    } else {
      abortSignal.addEventListener('abort', () => localCtrl.abort(abortSignal.reason), { once: true });
    }
    signal = localCtrl.signal;
  }

  // Fake progress animation (fetch doesn't expose upload progress)
  let fakeProgress = 0;
  let progressTimer: ReturnType<typeof setInterval> | null = null;
  if (onProgress) {
    onProgress(0);
    progressTimer = setInterval(() => {
      // Asymptotically approach 80 % so it never reaches 100 before we're done
      fakeProgress = fakeProgress + (80 - fakeProgress) * 0.12;
      onProgress(Math.round(fakeProgress));
    }, 350);
  }

  const clearProgress = () => {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    clearTimeout(timeoutId);
  };

  try {
    const formData = new FormData();
    formData.append('file', f, f.name || 'upload.pdf');

    const res = await fetch('/api/ingest', {
      method: 'POST',
      body: formData,
      signal,
    });

    clearProgress();
    if (onProgress) onProgress(90); // ingest received; Anthropic upload in progress

    if (!res.ok) {
      let data: any = {};
      try { data = await res.json(); } catch {}
      const err: any = new Error(data?.error || `Upload failed: HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    if (!data?.fileId) throw new Error('No fileId returned from upload');
    if (onProgress) onProgress(100);
    return data.fileId as string;

  } catch (e: any) {
    clearProgress();
    if (e.name === 'AbortError') {
      const te: any = new Error(
        'Upload timed out. Please check your internet connection and try again.'
      );
      te.status = 504;
      throw te;
    }
    throw e;
  }
}

// pdf: base64-encoded PDF string (small-file fallback only); null for follow-up questions
// fileIds: one or more Anthropic Files API file_ids; accepts string (legacy) or string[]
// onChunk: called with each streamed text token as it arrives
export async function callClaude(
  msgs: any[],
  pdf: string | null,
  lang: string,
  planData: any,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  fileIds?: string | string[] | null,
  source: 'button' | 'typed' = 'typed'
): Promise<string> {
  const ids: string[] = Array.isArray(fileIds) ? fileIds : (fileIds ? [fileIds] : []);
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: msgs,
      pdf: pdf ?? undefined,
      fileIds: ids.length > 0 ? ids : undefined,
      lang,
      planData,
      source,
    }),
    signal,
  });

  if (!response.ok) {
    // Error responses are JSON — parse for the error message
    let data: any = {};
    try { data = await response.json(); } catch {}
    const msg = data?.error || `HTTP ${response.status}`;
    const err: any = new Error(msg);
    err.status = response.status;
    throw err;
  }

  // Success — stream plain-text token chunks from the route
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Chat API returned a response with no body stream');
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(chunk);
  }

  return full;
}
