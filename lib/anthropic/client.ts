// ── Anthropic API constants ──────────────────────────────────────────────────
// Single source of truth for the model, API version, beta flags, and endpoints
// shared by /api/chat (edge) and /api/ingest (node). Constants only — safe to
// import from both runtimes. A model or beta bump is now a one-line edit here.

export const ANTHROPIC_API_VERSION = '2023-06-01';

// Default chat model.
export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

// Beta flags. chat needs PDF document support + files-api; ingest needs files-api.
export const ANTHROPIC_BETA_CHAT = 'pdfs-2024-09-25,files-api-2025-04-14';
export const ANTHROPIC_BETA_FILES = 'files-api-2025-04-14';

// Endpoints.
export const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_FILES_URL = 'https://api.anthropic.com/v1/files';

// Backstop only. Files are deleted when the session ends; this guarantees
// deletion within 2 hours even if the browser never tells us. Anthropic
// allows 3,600 to 7,776,000.
export const FILE_EXPIRY_SECONDS = 7200;

export const FILE_ID_PATTERN = /^file_[A-Za-z0-9_-]{8,}$/;
