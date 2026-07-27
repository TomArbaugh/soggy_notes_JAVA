/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// Resolves public URL for each chromatic note sample file.
import { getAudioUrl } from '../constants/musicTheory';

// In-memory cache maps note string -> preconstructed Audio element for faster replay.
const audioCache = {};
// Tracks currently playing one-shot Audio so stopCurrent can interrupt it.
let currentAudio = null;

/**
 * Preload an audio file for a given note so playback is instant.
 */
function preload(noteName) {
  // Skip if already cached to avoid duplicate network/decoding work.
  if (audioCache[noteName]) return;
  // Resolve URL; missing mapping returns null and we bail early.
  const url = getAudioUrl(noteName);
  if (!url) return;
  // Construct detached Audio node; browser may begin buffering immediately.
  const audio = new Audio();
  // Hint aggressive download of media before play() is called.
  audio.preload = 'auto';
  // Assign src triggers load of the sample asset.
  audio.src = url;
  // Store reference for reuse in future playNote calls if desired.
  audioCache[noteName] = audio;
}

/**
 * Preload all 12 chromatic notes.
 */
export function preloadAll(notes) {
  // notes is typically CHROMATIC from constants; forEach invokes preload per label.
  notes.forEach(preload);
}

/**
 * Play a single note and return a Promise that resolves when the note ends.
 * If something is already playing, it is stopped first.
 */
export function playNote(noteName) {
  // Promise API allows async/await sequencing in Redux thunks.
  return new Promise((resolve, reject) => {
    // Ensure exclusive playback: stop any prior clip before starting new one.
    stopCurrent();

    // Resolve URL for requested pitch class name.
    const url = getAudioUrl(noteName);
    // Reject promise if configuration does not define this note.
    if (!url) {
      reject(new Error(`No audio URL for note: ${noteName}`));
      return;
    }

    // Fresh Audio per play avoids odd state from reusing ended elements.
    const audio = new Audio(url);
    // Remember active handle for stopCurrent and ended handler cleanup.
    currentAudio = audio;

    // When playback completes naturally, resolve promise and clear handle.
    audio.addEventListener('ended', () => {
      currentAudio = null;
      resolve();
    });

    // Decode or network errors should reject so caller can log and continue sequence.
    audio.addEventListener('error', (e) => {
      currentAudio = null;
      reject(new Error(`Failed to play ${noteName}: ${e.message}`));
    });

    // play() returns promise in modern browsers; catch forwards to outer reject.
    audio.play().catch(reject);
  });
}

/**
 * Stop whatever is currently playing.
 */
export function stopCurrent() {
  // No-op if nothing is active.
  if (currentAudio) {
    // Pause stops decoding output immediately.
    currentAudio.pause();
    // Reset to start so next play begins at attack of sample.
    currentAudio.currentTime = 0;
    // Drop reference so ended events on stale object are ignored.
    currentAudio = null;
  }
}
