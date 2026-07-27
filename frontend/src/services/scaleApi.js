/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
/**
 * API client for the Java ScaleServer backend.
 *
 * Single endpoint fetches all 7 modes for a given key at once.
 * The response is stored in Redux so listen/guess tabs read from state
 * without further network calls.
 *
 *   GET /api/scales?key=C
 *     → { "key": "C", "scales": [
 *           { "mode": 1, "modeName": "Ionian", "quality": "major",
 *             "notes": [...], "notesReverse": [...],
 *             "arpeggioNotes": [...], "arpeggioNotesReverse": [...] }, // reverse = reversScaleArpegio
 *           ...
 *         ]}
 */

// Shared prefix for all proxied API routes in development (Vite proxy to port 8080).
const API_BASE = '/api';

/**
 * Fetch all 7 scale modes for a given root key from the Java backend.
 * @param {string} key - root note, e.g. "C", "F#"
 * @param {{ guideTransform?: 'destroy' | 'win' | 'only', guideMode?: number }} [opts] - optional; forwarded as query params (only → onlyGuidTones on server).
 * @returns {Promise<{key: string, scales: Array<{mode: number, modeName: string, notes: string[]}>}>}
 */
export async function fetchScalesForKey(key, opts = {}) {
  const params = new URLSearchParams();
  params.set('key', key);
  if (opts.guideTransform) params.set('guideTransform', opts.guideTransform);
  if (opts.guideMode != null && opts.guideMode >= 1 && opts.guideMode <= 7) {
    params.set('guideMode', String(opts.guideMode));
  }
  const url = `${API_BASE}/scales?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  return res.json();
}

// Fetches harmony interval definitions for the given tonic key from Java.
export async function fetchHarmoniesForKey(key) {
  // harmonies endpoint mirrors scales pattern with key query string.
  const url = `${API_BASE}/harmonies?key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * POST to Java ScaleServer: updates Guess for this session and returns counts.
 * @param {{ correct: boolean, sessionId: string | null }} body
 * @returns {Promise<{ wins: number, guesses: number, sessionId: string }>}
 */
export async function postGuessOutcome({ correct, sessionId }) {
  // POST JSON so Java can parse boolean and optional session id from body.
  const res = await fetch(`${API_BASE}/guess-outcome`, {
    // POST is required by ScaleServer for state-changing guess recording.
    method: 'POST',
    // JSON content type lets server read UTF-8 JSON from request body.
    headers: { 'Content-Type': 'application/json' },
    // Body encodes outcome and session continuity for server-side Guess map.
    body: JSON.stringify({
      // Coerce to primitive boolean in case caller passed truthy object.
      correct: Boolean(correct),
      // null means "new session" on server until first response returns an id.
      sessionId: sessionId || null,
    }),
  });
  // Surface failure message including response text for debugging 4xx/5xx bodies.
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`guess-outcome ${res.status}: ${text}`);
  }
  // Successful response is small JSON with updated cumulative stats.
  return res.json();
}

/**
 * POST /api/guess-reset — clears server-side Guess for this session (ScaleServer).
 * @param {{ sessionId: string | null }} body
 * @returns {Promise<{ sessionId: string, wins: number, guesses: number }>}
 */
export async function postGuessReset({ sessionId }) {
  const res = await fetch(`${API_BASE}/guess-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: sessionId || null }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`guess-reset ${res.status}: ${text}`);
  }
  return res.json();
}
