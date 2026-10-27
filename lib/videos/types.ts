// ── Explainer videos are data: scenes with a picture kind, props and a caption ──
// Built from plan data by lib/videos/build.ts, drawn by components/plansparency/video/.

export type VideoId = 'welcome' | 'match' | 'vesting' | 'taxes' | 'limits' | 'access' | 'leave' | 'tdf';

export type SceneKind =
  | 'title' | 'jar' | 'paycheck' | 'employer' | 'coins' | 'bars' | 'steps'
  | 'tax' | 'choices' | 'calendar' | 'mix' | 'callout' | 'end';

// What the end card button does. The app decides how (see components/plansparency/video/VideoContext.tsx).
export type NextAction =
  | 'welcomeStep2' | 'calculator' | 'scrollVesting' | 'scrollLeave'
  | 'openLoans' | 'openHardship' | 'investments';

export interface Scene {
  kind: SceneKind;
  props: Record<string, unknown>;
  caption: string;
}

export interface Video {
  id: VideoId;
  title: string;
  scenes: Scene[];
  next: { label: string; action: NextAction };
}

// Who and what the video can name. Anything missing here hides the scenes that need it.
export interface VideoContextInfo {
  employerName?: string;
  planName?: string;
  recordkeeperName?: string;
  hasTeam?: boolean;
}
