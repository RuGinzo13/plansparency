// ── Client-side session-end signaling ────────────────────────────────────────
// Tells the server (/api/session/end) to delete uploaded Anthropic files when
// a session ends: End Session button, a new upload replacing an old one, tab
// close, or 30 minutes of inactivity.

export function endSessionFiles(fileIds: string[], opts?: { beacon?: boolean }): void {
  if (!fileIds.length) return;
  const body = JSON.stringify({ fileIds });

  if (opts?.beacon) {
    try {
      navigator.sendBeacon('/api/session/end', body);
    } catch {
      // Best effort only — nothing more we can do during unload.
    }
    return;
  }

  fetch('/api/session/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Best effort only — never block the UI on a delete failure. The 2-hour
    // expiry backstop (FILE_EXPIRY_SECONDS) covers this file regardless.
  });
}

export const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
