/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// Chromatic pitch-class names used for key picker and audio preload lists.
export const CHROMATIC = [
  // Twelve-tone chromatic order starting at C for UI consistency.
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

// Diatonic mode names aligned by index with backend mode numbers 1–7.
export const MODE_NAMES = [
  // Mode 1
  'Ionian',
  // Mode 2
  'Dorian',
  // Mode 3
  'Phrygian',
  // Mode 4
  'Lydian',
  // Mode 5
  'Mixolydian',
  // Mode 6
  'Aeolian',
  // Mode 7
  'Locrian',
];

// Private map from UI note label to on-disk sample filename under Samples/.
const NOTE_TO_FILE = {
  // Natural C maps to single spelling file.
  'C':  'C.m4a',
  // Sharp key shares enharmonic filename with Db in repo naming.
  'C#': 'C#-Db.m4a',
  'D':  'D.m4a',
  'D#': 'D#-Eb.m4a',
  'E':  'E.m4a',
  'F':  'F.m4a',
  'F#': 'F#-Gb.m4a',
  'G':  'G.m4a',
  'G#': 'G#-Ab.m4a',
  'A':  'A.m4a',
  'A#': 'A#-Bb.m4a',
  'B':  'B.m4a',
};

/**
 * Get the audio URL for a given note name.
 * Currently serves from the local Samples/ directory via Vite dev server.
 * When connecting to the Java backend, swap this to point to the backend API.
 */
export function getAudioUrl(noteName) {
  // Look up filename; undefined if note not in map.
  const filename = NOTE_TO_FILE[noteName];
  // Guard: unknown note should not produce a broken URL string.
  if (!filename) return null;
  // Vite dev server serves /Samples via middleware; encodeURIComponent handles spaces.
  return `/Samples/${encodeURIComponent(filename)}`;
}

/**
 * Get all available root keys (the full chromatic scale).
 */
export function getAllKeys() {
  // Return shallow copy so callers cannot mutate exported CHROMATIC constant.
  return [...CHROMATIC];
}
