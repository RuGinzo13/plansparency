// ── Voice-over hook (OPEN-ITEMS #68, ElevenLabs) ─────────────────────────────
// The videos are silent with captions for now. When a voice is plugged in, this returns the audio
// for the whole video and, if known, the second each scene starts at. The player then follows the
// audio instead of the reading-speed scene durations. Every word comes from lib/videos/scripts.ts.

import type { Video } from './types';

export interface Narration {
  url: string;
  // Start time in seconds of each scene, same order as video.scenes.
  timings?: number[];
}

export async function getNarration(_video: Video, _lang: 'en' | 'es'): Promise<Narration | null> {
  return null;
}
