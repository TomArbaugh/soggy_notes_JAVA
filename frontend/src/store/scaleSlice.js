/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// Redux Toolkit slice factory for scales, arpeggios, and related guess flows.
import { createSlice } from '@reduxjs/toolkit';
// Fetches all seven modes for a key from Java ScaleServer in one request.
import { fetchScalesForKey } from '../services/scaleApi';
// Sequential note playback for scales and arpeggios in browser audio.
import { playNote, stopCurrent } from '../services/audioService';
// Reports scale/arpeggio guess correctness to the same Java Guess session as harmonies.
import { recordServerGuess } from './guessStatsSlice';

// Chooses forward or reverse note array for scale listening/guessing from cached API row.
function pickScaleNotes(entry, reverse) {
  if (!entry) return [];
  const forward = entry.notes || [];
  const rev = entry.notesReverse;
  if (reverse && rev && rev.length) return rev;
  return forward;
}

/** Forward = scaleArpegio; reverse = reversScaleArpegio from Java (reversed scale + arpegio logic). */
function pickArpeggioNotes(entry, reverse) {
  if (!entry) return [];
  const forward = entry.arpeggioNotes || [];
  const rev = entry.arpeggioNotesReverse;
  if (reverse && Array.isArray(rev) && rev.length > 0) return rev;
  return forward;
}

/** Maps GET /api/scales JSON to Redux mode → entry object (shared by load and guide-tone refetch). */
function buildScalesMapFromApi(data) {
  const scalesMap = {};
  (data.scales || []).forEach((s) => {
    scalesMap[s.mode] = {
      notes: s.notes || [],
      notesReverse: s.notesReverse || s.notes || [],
      arpeggioNotes: s.arpeggioNotes || [],
      arpeggioNotesReverse: Array.isArray(s.arpeggioNotesReverse) ? s.arpeggioNotesReverse : [],
    };
  });
  return scalesMap;
}

// Central slice for key selection, scale data cache, playback, and both guess games.
const scaleSlice = createSlice({
  name: 'scale',
  initialState: {
    selectedKey: 'C', // Default tonic until user picks another key in the picker UI.
    activeTab: 'listening', // Scales sub-tab: start on listen rather than guess view.
    arpeggioSubTab: 'listening', // Arpeggios sub-tab: parallel default to listening mode.

    scales: {}, // Map mode number -> { notes, notesReverse, arpeggioNotes, ... } from API.
    scalesLoaded: false, // Flips true after first successful fetch for current key selection.
    scalesLoading: false, // True while fetch in flight to disable controls and show loading text.

    scalesReverse: false, // Checkbox: play scale notesReverse arrays when true from backend.
    arpeggiosReverse: false, // Checkbox: play arpeggio reverse arrays when true from backend.

    activeNote: null, // Pitch class string currently sounding during sequential playback thunk.
    isPlaying: false, // Global gate so user cannot start overlapping audio sequences accidentally.
    currentScaleNotes: [], // Last scale note order used for piano highlight and scale guess replay.
    currentArpeggioNotes: [], // Last arpeggio note order for piano highlight and arpeggio guess replay.

    listeningMode: null, // Which scale mode button is visually "playing" in listening tab UI.
    listeningArpeggioMode: null, // Which arpeggio mode button is visually playing in its tab.

    guessTargetMode: null, // Hidden correct mode number 1–7 for current scale guess round instance.
    guessStarted: false, // True after user starts a scale guess round until they reset by new key.
    guessResult: null, // 'yes' | 'no' | null: last scale guess correctness for YES/NO banner display.
    guessWrongAttempts: [], // Unique list of wrong mode numbers clicked to style disabled wrong tiles.
    guessSolved: false, // Becomes true after correct scale guess; gates further submissions same round.

    guessArpeggioTargetMode: null, // Hidden correct mode for arpeggio guess round parallel to above.
    guessArpeggioStarted: false, // Whether arpeggio guess flow has begun this session since last reset.
    guessArpeggioResult: null, // Last arpeggio guess yes/no banner payload analogous to guessResult.
    guessArpeggioWrongAttempts: [], // Wrong arpeggio mode guesses for strike-through styling in grid UI.
    guessArpeggioSolved: false, // Whether user found correct arpeggio mode for current hidden target.

    guideToneUndoScales: null, // Deep copy of scales before last guide-tone refetch; null when nothing to undo.
  },
  reducers: {
    setSelectedKey(state, action) {
      state.selectedKey = action.payload; // Persist newly chosen tonic from key picker or game select.
      state.scales = {}; // Invalidate cached mode map because notes are key-specific from backend.
      state.scalesLoaded = false; // Force reload path on next loadScalesForKey completion transition.
      state.guessTargetMode = null; // Clear hidden scale target so old round cannot leak across keys.
      state.guessStarted = false; // Reset scale guess flow UI to initial not-started state on key change.
      state.guessResult = null; // Clear YES/NO banner text until next guess interaction occurs again.
      state.guessWrongAttempts = []; // Drop remembered wrong tiles because question context changed key.
      state.guessSolved = false; // Re-enable guessing interactions for fresh key context after change event.
      state.currentScaleNotes = []; // Clear piano highlight set tied to previous key's scale sequences.
      state.listeningMode = null; // Stop any active listening button highlight state from prior key data.
      state.scalesReverse = false; // Reset checkbox to forward order default when tonic changes globally.
      state.arpeggiosReverse = false; // Reset arpeggio reverse checkbox default on tonic change as well.
      state.listeningArpeggioMode = null; // Clear arpeggio listening active indicator on key change reset.
      state.arpeggioSubTab = 'listening'; // Return user to arpeggio listen tab for predictable UX flow.
      state.currentArpeggioNotes = []; // Clear arpeggio highlight notes tied to previous key's cache map.
      state.guessArpeggioTargetMode = null; // Clear hidden arpeggio target across key change boundary line.
      state.guessArpeggioStarted = false; // Reset arpeggio guess started flag parallel to scale guess reset.
      state.guessArpeggioResult = null; // Clear arpeggio YES/NO banner until next arpeggio guess attempt path.
      state.guessArpeggioWrongAttempts = []; // Clear wrong arpeggio attempt memory when key context changes now.
      state.guessArpeggioSolved = false; // Allow new arpeggio rounds after key change clears solved lock state.
      state.guideToneUndoScales = null; // Drop guide-tone undo snapshot when tonic changes path here now.
    },
    setScales(state, action) {
      state.scales = action.payload; // Replace entire mode map with freshly fetched API-derived object.
      state.scalesLoaded = true; // Mark data ready so listening and guess tabs enable interactions now.
      state.scalesLoading = false; // Clear loading spinner flag after successful network completion path.
    },
    setScalesLoading(state, action) {
      state.scalesLoading = action.payload; // Toggle boolean from thunks before/after fetch attempts occur.
    },
    setActiveTab(state, action) {
      state.activeTab = action.payload; // Switch scales area between 'listening' and 'guessing' sub-views here.
      state.activeNote = null; // Clear transient highlight when leaving playback-heavy sub-tab area state.
      state.listeningMode = null; // Remove listening button animation when navigating away from listen tab path.
    },
    setArpeggioSubTab(state, action) {
      state.arpeggioSubTab = action.payload; // Switch arpeggios between listen and guess sub-tab route strings.
      state.activeNote = null; // Clear any active key highlight when changing arpeggio sub-tab navigation target.
      state.listeningArpeggioMode = null; // Stop arpeggio listening indicator when sub-tab context changes away now.
    },
    setScalesReverse(state, action) {
      state.scalesReverse = action.payload; // Persist checkbox boolean controlling pickScaleNotes branch behavior.
    },
    setArpeggiosReverse(state, action) {
      state.arpeggiosReverse = action.payload; // Persist arpeggio reverse checkbox controlling pickArpeggioNotes path.
    },
    setActiveNote(state, action) {
      state.activeNote = action.payload; // Update which piano key is teal-highlighted during playback loop steps.
    },
    clearActiveNote(state) {
      state.activeNote = null; // Remove highlight after sequence completes or user stops playback early case.
    },
    setPlaying(state, action) {
      state.isPlaying = action.payload; // Global boolean disables competing play actions while audio runs here.
    },
    setScaleNotes(state, action) {
      state.currentScaleNotes = action.payload; // Store ordered note names for piano in-scale outline drawing path.
    },
    setArpeggioNotes(state, action) {
      state.currentArpeggioNotes = action.payload; // Store arpeggio tones for piano highlight during arpeggio flows.
    },
    setListeningMode(state, action) {
      state.listeningMode = action.payload; // Track which scale mode tile shows playing animation bar widget UI.
    },
    setListeningArpeggioMode(state, action) {
      state.listeningArpeggioMode = action.payload; // Track which arpeggio mode tile is active during playback now.
    },
    beginGuessRound(state, action) {
      const { mode, notes } = action.payload; // Destructure hidden target mode and audible note list from thunk dispatch payload object fields here now.
      state.guessTargetMode = mode; // Save secret answer index for later comparison against user button clicks path.
      state.currentScaleNotes = notes; // Save same note list for replay thunk without re-randomizing hidden target mode value again here now.
      state.guessStarted = true; // Flip UI into post-start state showing replay and guess grid components sections now.
      state.guessResult = null; // Clear previous YES/NO banner until first guess click sets new result string value path now.
      state.guessWrongAttempts = []; // Reset wrong list at each new round start so strike-through memory clears now here path.
      state.guessSolved = false; // Ensure user can guess again after starting fresh random round instance creation path now.
    },
    beginArpeggioGuessRound(state, action) {
      const { mode, notes } = action.payload; // Destructure arpeggio round payload from startArpeggioGuessRound thunk dispatch call site path now here.
      state.guessArpeggioTargetMode = mode; // Store hidden arpeggio answer mode number for submitArpeggioGuess comparisons later path now here.
      state.currentArpeggioNotes = notes; // Store arpeggio playback sequence for replayArpeggioGuess without changing secret target mode number path now here.
      state.guessArpeggioStarted = true; // Show arpeggio replay and guess UI similar to scale guess started flag behavior path now here.
      state.guessArpeggioResult = null; // Clear old YES/NO banner until user submits first arpeggio guess attempt path now here.
      state.guessArpeggioWrongAttempts = []; // Reset wrong arpeggio guesses list for fresh round strike-through memory path now here.
      state.guessArpeggioSolved = false; // Unlock arpeggio guess buttons until user answers correctly this round path now here.
    },
    recordGuess(state, action) {
      const guessedMode = action.payload; // Numeric mode button index user clicked in scale guess grid UI path now here.
      if (guessedMode === state.guessTargetMode) {
        state.guessResult = 'yes'; // Show affirmative banner and mark solved to disable further guesses this round path now here.
        state.guessSolved = true; // Lock grid after correct answer reveals final instructional copy string path now here.
      } else {
        state.guessResult = 'no'; // Brief negative feedback banner after each incorrect attempt click path now here.
        if (!state.guessWrongAttempts.includes(guessedMode)) {
          state.guessWrongAttempts.push(guessedMode); // Remember distinct wrong tiles for permanent wrong styling path now here.
        }
      }
    },
    recordArpeggioGuess(state, action) {
      const guessedMode = action.payload; // Mode number clicked in arpeggio guess grid for comparison to hidden target path now here.
      if (guessedMode === state.guessArpeggioTargetMode) {
        state.guessArpeggioResult = 'yes'; // Positive banner for correct arpeggio identification same round path now here.
        state.guessArpeggioSolved = true; // Lock arpeggio guess grid after success until new round starts path now here.
      } else {
        state.guessArpeggioResult = 'no'; // Negative banner for incorrect arpeggio attempt feedback display path now here.
        if (!state.guessArpeggioWrongAttempts.includes(guessedMode)) {
          state.guessArpeggioWrongAttempts.push(guessedMode); // Track wrong arpeggio tiles for strike-through styling path now here.
        }
      }
    },
    snapshotGuideToneUndo(state) {
      if (state.guideToneUndoScales != null) return; // Keep first snapshot until user undoes or changes key path here now.
      state.guideToneUndoScales = JSON.parse(JSON.stringify(state.scales)); // Clone for one-level undo path here now.
    },
    restoreGuideToneScales(state) {
      if (!state.guideToneUndoScales) return; // No-op when nothing stored path here now.
      state.scales = JSON.parse(JSON.stringify(state.guideToneUndoScales)); // Restore pre–guide-tone fetch cache path here now.
      state.guideToneUndoScales = null; // Consume undo snapshot path here now.
    },
  },
});

export const {
  setSelectedKey,
  setScales,
  setScalesLoading,
  setActiveTab,
  setArpeggioSubTab,
  setScalesReverse,
  setArpeggiosReverse,
  setActiveNote,
  clearActiveNote,
  setPlaying,
  setScaleNotes,
  setArpeggioNotes,
  setListeningMode,
  setListeningArpeggioMode,
  beginGuessRound,
  beginArpeggioGuessRound,
  recordGuess,
  recordArpeggioGuess,
  snapshotGuideToneUndo,
  restoreGuideToneScales,
} = scaleSlice.actions;

// Short pause between notes when arpeggiating a scale or arpeggio in the UI.
function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Shared playback thunk for both scale notes and arpeggio note arrays.
const playNoteSequence = (notes) => async (dispatch) => {
  stopCurrent(); // Stop any in-flight one-shot audio before starting this new multi-note sequence path now here.
  dispatch(setPlaying(true)); // Set global playing flag to disable conflicting UI actions while sequence runs path now here.

  for (let i = 0; i < notes.length; i++) {
    dispatch(setActiveNote(notes[i])); // Highlight current scale or arpeggio note on piano component during loop path now here.
    try {
      await playNote(notes[i]); // Await each sample completion for ordered arpeggiated scale playback path now here.
    } catch (err) {
      console.error('Playback error:', err); // Log per-note failures without aborting entire remainder sequence path now here.
    }
    await pause(80); // Brief articulation gap between successive notes for clearer pitch separation perception path now here.
  }

  dispatch(clearActiveNote()); // Clear active highlight after last note in sequence finishes playing path now here.
  dispatch(setPlaying(false)); // Release playing lock so user can start another listen or guess action path now here.
};

// Listening tab: play full scale for chosen mode number using reverse toggle state.
export const playListeningMode = (modeNumber) => async (dispatch, getState) => {
  const { scales, scalesReverse } = getState().scale;
  const entry = scales[modeNumber];
  const notes = pickScaleNotes(entry, scalesReverse);
  if (!notes.length) return;
  dispatch(setScaleNotes(notes));
  dispatch(setListeningMode(modeNumber));
  await dispatch(playNoteSequence(notes));
  dispatch(setListeningMode(null));
};

// Listening tab: play arpeggio pattern for chosen mode using arpeggio reverse toggle.
export const playArpeggioListeningMode = (modeNumber) => async (dispatch, getState) => {
  const { scales, arpeggiosReverse } = getState().scale;
  const entry = scales[modeNumber];
  const notes = pickArpeggioNotes(entry, arpeggiosReverse);
  if (!notes.length) return;
  dispatch(setArpeggioNotes(notes));
  dispatch(setListeningArpeggioMode(modeNumber));
  await dispatch(playNoteSequence(notes));
  dispatch(setListeningArpeggioMode(null));
};

// Load scales from backend and reshape API array into mode-indexed map for O(1) lookup.
export const loadScalesForKey = (key) => async (dispatch) => {
  dispatch(setSelectedKey(key));
  dispatch(setScalesLoading(true));
  try {
    const data = await fetchScalesForKey(key);
    dispatch(setScales(buildScalesMapFromApi(data)));
  } catch (err) {
    console.error('Failed to load scales from backend:', err);
    dispatch(setScalesLoading(false));
  }
};

// Random integer mode 1–7, store notes, play once for scale guessing round start.
export const startGuessRound = () => async (dispatch, getState) => {
  const { scales, scalesReverse } = getState().scale;
  const modeNumber = Math.floor(Math.random() * 7) + 1;
  const entry = scales[modeNumber];
  const notes = pickScaleNotes(entry, scalesReverse);
  if (!notes.length) return;
  dispatch(beginGuessRound({ mode: modeNumber, notes }));
  await dispatch(playNoteSequence(notes));
};

// Replay current scale guess sequence without changing the hidden target mode.
export const replayGuessScale = () => async (dispatch, getState) => {
  const { currentScaleNotes } = getState().scale;
  if (currentScaleNotes.length) {
    await dispatch(playNoteSequence(currentScaleNotes));
  }
};

// Dispatch local guess result then notify Java Guess server for cumulative stats.
export const submitGuess = (modeNumber) => async (dispatch, getState) => {
  const { guessTargetMode, guessSolved } = getState().scale;
  if (guessSolved) return;
  const correct = modeNumber === guessTargetMode;
  dispatch(recordGuess(modeNumber));
  await dispatch(recordServerGuess(correct));
};

// Same as startGuessRound but uses arpeggio note arrays and arpeggio guess state keys.
export const startArpeggioGuessRound = () => async (dispatch, getState) => {
  const { scales, arpeggiosReverse } = getState().scale;
  const modeNumber = Math.floor(Math.random() * 7) + 1;
  const entry = scales[modeNumber];
  const notes = pickArpeggioNotes(entry, arpeggiosReverse);
  if (!notes.length) return;
  dispatch(beginArpeggioGuessRound({ mode: modeNumber, notes }));
  await dispatch(playNoteSequence(notes));
};

// Replay stored arpeggio notes for current arpeggio guess round.
export const replayArpeggioGuess = () => async (dispatch, getState) => {
  const { currentArpeggioNotes } = getState().scale;
  if (currentArpeggioNotes.length) {
    await dispatch(playNoteSequence(currentArpeggioNotes));
  }
};

// Submit arpeggio mode guess with server reporting identical to scale submitGuess.
export const submitArpeggioGuess = (modeNumber) => async (dispatch, getState) => {
  const { guessArpeggioTargetMode, guessArpeggioSolved } = getState().scale;
  if (guessArpeggioSolved) return;
  const correct = modeNumber === guessArpeggioTargetMode;
  dispatch(recordArpeggioGuess(modeNumber));
  await dispatch(recordServerGuess(correct));
};

/** Refetch scales with guideTransform/guideMode query (Java Scale); first click snapshots for undo. */
export const applyGuideToneTransform =
  ({ transform, mode }) =>
  async (dispatch, getState) => {
    const st = getState().scale;
    const { selectedKey, scalesLoaded, guideToneUndoScales } = st;
    if (!scalesLoaded || !Object.keys(st.scales || {}).length) return;
    if (guideToneUndoScales == null) {
      dispatch(snapshotGuideToneUndo());
    }
    dispatch(setScalesLoading(true));
    try {
      const data = await fetchScalesForKey(selectedKey, {
        guideTransform: transform,
        guideMode: mode,
      });
      dispatch(setScales(buildScalesMapFromApi(data)));
    } catch (err) {
      console.error('Guide-tone scales fetch failed:', err);
      dispatch(setScalesLoading(false));
    }
  };

/** Restore scales from snapshot before last guide-tone refetch. */
export const undoGuideToneTransform = () => (dispatch, getState) => {
  if (getState().scale.guideToneUndoScales == null) return;
  dispatch(restoreGuideToneScales());
};

export default scaleSlice.reducer;
