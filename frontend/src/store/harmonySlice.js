/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// Redux Toolkit factory for reducer + actions for the harmony feature area.
import { createSlice } from '@reduxjs/toolkit';
// GET /api/harmonies client used when user changes key.
import { fetchHarmoniesForKey } from '../services/scaleApi';
// Browser audio helpers for interval arpeggiation (root then upper note).
import { playNote, stopCurrent } from '../services/audioService';
// Thunk to POST guess correctness to Java Guess tracker after local evaluation.
import { recordServerGuess } from './guessStatsSlice';

// Stable string id for an interval row in UI and Redux equality checks.
function ivId(iv) {
  // Template literal concatenates quality and degree from backend or normalized rows.
  return `${iv.quality}-${iv.degree}`;
}

/** Shapes intervals for Listen/Guess: no minor 2nd; 4th and 5th collapsed to perfect. */
function normalizeHarmonyIntervals(raw) {
  // Guard: empty or non-array API response yields empty playable list.
  if (!Array.isArray(raw) || !raw.length) return [];

  // Helper returns all raw intervals for a given scale degree (2–7 from Java).
  const forDeg = (d) => raw.filter((iv) => iv.degree === d);
  // Prefer major row's note when merging; else minor; used for collapsed perfect intervals.
  const pickNote = (items) => {
    const major = items.find((iv) => iv.quality === 'major');
    const minor = items.find((iv) => iv.quality === 'minor');
    return (major || minor)?.note;
  };
  // Pick metadata object (name string) preferring major quality for labeling consistency.
  const meta = (items) => items.find((iv) => iv.quality === 'major') || items[0];

  // Accumulator for normalized list returned to UI.
  const out = [];

  // Degree 2: keep both major and minor thirds as separate buttons.
  for (const q of ['major', 'minor']) {
  const d2maj = raw.find((iv) => iv.degree === 2 && iv.quality === q);
  if (d2maj) out.push({ ...d2maj });
  }

  // Degree 3: keep both major and minor thirds as separate buttons.
  for (const q of ['major', 'minor']) {
    const iv = raw.find((iv) => iv.degree === 3 && iv.quality === q);
    if (iv) out.push({ ...iv });
  }

  // Degree 4: collapse major+minor API rows into one perfect fourth entry.
  const d4 = forDeg(4);
  if (d4.length) {
    const m = meta(d4);
    const note = pickNote(d4);
    if (note) {
      out.push({
        degree: 4,
        name: m.name,
        quality: 'perfect',
        note,
      });
    }
  }

  // Degree 5: collapse into one perfect fifth entry for UI and guessing pool.
  const d5 = forDeg(5);
  if (d5.length) {
    const m = meta(d5);
    const note = pickNote(d5);
    if (note) {
      out.push({
        degree: 5,
        name: m.name,
        quality: 'perfect',
        note,
      });
    }
  }

  // Degrees 6 and 7: retain major/minor pairs like the raw API provides.
  for (const deg of [6, 7]) {
    for (const q of ['major', 'minor']) {
      const iv = raw.find((iv) => iv.degree === deg && iv.quality === q);
      if (iv) out.push({ ...iv });
    }
  }

  return out;
}

// Human-readable label for interval buttons including perfect 4th/5th naming rules.
export function harmonyIntervalDisplayName(iv) {
  // Perfect quality is synthetic from normalization, not from Java JSON.
  if (iv.quality === 'perfect') {
    if (iv.degree === 4) return 'Perfect 4th';
    if (iv.degree === 5) return 'Perfect 5th';
  }
  // Otherwise prefix interval name with Major or Minor from quality field.
  const q = iv.quality === 'major' ? 'Major' : 'Minor';
  return `${q} ${iv.name}`;
}

// Slice definition for harmony listening, guessing, and playback flags.
const harmonySlice = createSlice({
  name: 'harmony',
  initialState: {
    intervals: [], // Normalized interval rows after client-side filtering of raw API intervals list data here now.
    root: null, // Tonic pitch class string echoed from API for building two-note playback arrays path now here.
    intervalsLoaded: false, // True after successful loadHarmoniesForKey completes normalization pipeline path now here.
    intervalsLoading: false, // True while awaiting fetchHarmoniesForKey network response lifecycle path now here.

    activeSubTab: 'listening', // Harmony area sub-tab: listen vs guess navigation state string path now here.
    activeNote: null, // Pitch class currently highlighted on piano during interval playback thunk loop path now here.
    isPlaying: false, // Prevents overlapping interval plays while sequence thunk is running active path now here.
    currentNotes: [], // Two-note list [root, upper] for piano highlight and replayHarmonyInterval reuse path now here.

    listeningId: null, // ivId string of button currently showing playing progress animation in listen tab path now here.

    guessTargetId: null, // Hidden ivId string user must click to win current harmony guess round instance path now here.
    guessStarted: false, // Whether user has started a harmony guess round since last reset or key change path now here.
    guessResult: null, // 'yes' | 'no' | null banner state after each harmony guess button click attempt path now here.
    guessWrongAttempts: [], // List of wrong ivId guesses for strike-through styling in harmony guess grid path now here.
    guessSolved: false, // Locks grid after correct harmony guess until new round randomizes new target id path now here.
  },
  reducers: {
    resetHarmony(state) {
      state.intervals = []; // Clear cached intervals when key changes or before refetch to avoid stale UI path now here.
      state.root = null; // Clear tonic until new payload arrives from successful harmony fetch completion path now here.
      state.intervalsLoaded = false; // Force listening buttons disabled until fresh data is normalized and stored path now here.
      state.guessTargetId = null; // Remove old hidden target so unsolved state cannot leak across key change boundary path now here.
      state.guessStarted = false; // Reset guess flow UI to initial prompt state after harmony reset dispatch path now here.
      state.guessResult = null; // Clear YES/NO banner text until next guess interaction after reset path now here.
      state.guessWrongAttempts = []; // Forget wrong interval ids from previous key or previous round memory path now here.
      state.guessSolved = false; // Re-enable guessing after reset clears solved lock for new rounds path now here.
      state.currentNotes = []; // Clear piano highlight note pair tied to previous interval context path now here.
      state.listeningId = null; // Remove listening tab playing indicator during harmony slice reset path now here.
    },
    setIntervals(state, action) {
      const { intervals, root } = action.payload; // Destructure normalized intervals and tonic from loadHarmoniesForKey success path now here.
      state.intervals = intervals; // Store client-filtered list for listen and guess grid rendering components path now here.
      state.root = root; // Store tonic string for instructional copy and two-note playback construction path now here.
      state.intervalsLoaded = true; // Mark harmony data ready for user interaction in harmony tabs path now here.
      state.intervalsLoading = false; // Clear loading flag after successful setIntervals commit path now here.
    },
    setIntervalsLoading(state, action) {
      state.intervalsLoading = action.payload; // Toggle loading boolean from thunks around harmony fetch calls path now here.
    },
    setHarmonySubTab(state, action) {
      state.activeSubTab = action.payload; // Switch between harmony listening and harmony guessing sub-tab routes path now here.
      state.activeNote = null; // Clear transient piano highlight when changing harmony sub-tab navigation path now here.
      state.listeningId = null; // Clear listening animation when leaving harmony listen tab area path now here.
    },
    setHarmonyActiveNote(state, action) {
      state.activeNote = action.payload; // Update which key is lit during playIntervalNotes sequential playback path now here.
    },
    clearHarmonyActiveNote(state) {
      state.activeNote = null; // Remove highlight after interval sequence completes or errors path now here.
    },
    setHarmonyPlaying(state, action) {
      state.isPlaying = action.payload; // Mirror playing flag for disabling buttons during harmony audio thunk path now here.
    },
    setHarmonyNotes(state, action) {
      state.currentNotes = action.payload; // Persist [root, interval] names for piano in-scale outline drawing path now here.
    },
    setListeningId(state, action) {
      state.listeningId = action.payload; // Track which harmony listen tile shows bottom progress animation bar path now here.
    },
    beginHarmonyGuessRound(state, action) {
      const { id, notes } = action.payload; // Destructure hidden interval id and two-note playback list from thunk payload path now here.
      state.guessTargetId = id; // Save secret ivId string compared against submitHarmonyGuess click parameter path now here.
      state.currentNotes = notes; // Save same two notes for replay without changing hidden target id value path now here.
      state.guessStarted = true; // Show replay and guess grid UI after random interval round begins path now here.
      state.guessResult = null; // Clear banner until first guess attempt updates yes/no state path now here.
      state.guessWrongAttempts = []; // Reset wrong ivId memory for fresh harmony guess round instance path now here.
      state.guessSolved = false; // Ensure buttons accept input until user finds correct interval id path now here.
    },
    recordHarmonyGuess(state, action) {
      const guessedId = action.payload; // ivId string from clicked harmony guess option button element path now here.
      if (guessedId === state.guessTargetId) {
        state.guessResult = 'yes'; // Positive banner when clicked id matches hidden target equality check path now here.
        state.guessSolved = true; // Lock further guesses after correct harmony identification this round path now here.
      } else {
        state.guessResult = 'no'; // Negative banner on wrong interval selection attempt path now here.
        if (!state.guessWrongAttempts.includes(guessedId)) {
          state.guessWrongAttempts.push(guessedId); // Remember wrong ivId for strike-through styling in grid path now here.
        }
      }
    },
  },
});

export const {
  resetHarmony,
  setIntervals,
  setIntervalsLoading,
  setHarmonySubTab,
  setHarmonyActiveNote,
  clearHarmonyActiveNote,
  setHarmonyPlaying,
  setHarmonyNotes,
  setListeningId,
  beginHarmonyGuessRound,
  recordHarmonyGuess,
} = harmonySlice.actions;

export { ivId };

// Small delay helper between successive notes in interval playback.
function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Thunk creator: returns async function that plays each note in order with highlight updates.
const playIntervalNotes = (notes) => async (dispatch) => {
  stopCurrent(); // Cancel any stray one-shot audio before starting this new interval sequence path now here.
  dispatch(setHarmonyPlaying(true)); // Flip UI disabled state for harmony buttons while sequence plays path now here.
  dispatch(setHarmonyNotes(notes)); // Push two-note list to Redux so Piano highlights both pitch classes path now here.

  for (let i = 0; i < notes.length; i++) {
    dispatch(setHarmonyActiveNote(notes[i])); // Highlight current note index on piano during this loop iteration path now here.
    try {
      await playNote(notes[i]); // Await sample playback completion before advancing to next note index path now here.
    } catch (err) {
      console.error('Playback error:', err); // Log decode/network failures but continue sequence timing path now here.
    }
    await pause(80); // Short gap between root and upper note so user perceives two distinct attacks path now here.
  }

  dispatch(clearHarmonyActiveNote()); // Remove teal active key after final note finishes sounding path now here.
  dispatch(setHarmonyPlaying(false)); // Re-enable harmony controls after full interval sequence completes path now here.
};

// Async thunk: refetch harmonies when key changes; resets harmony slice first.
export const loadHarmoniesForKey = (key) => async (dispatch) => {
  dispatch(resetHarmony());
  dispatch(setIntervalsLoading(true));
  try {
    const data = await fetchHarmoniesForKey(key);
    const intervals = normalizeHarmonyIntervals(data.intervals);
    dispatch(setIntervals({ intervals, root: data.root }));
  } catch (err) {
    console.error('Failed to load harmonies from backend:', err);
    dispatch(setIntervalsLoading(false));
  }
};

// Play one interval (two notes) for listening tab when user clicks a labeled button.
export const playListeningInterval = (id) => async (dispatch, getState) => {
  const { intervals, root } = getState().harmony;
  const interval = intervals.find((iv) => ivId(iv) === id);
  if (!interval || !root) return;
  const notes = [root, interval.note];
  dispatch(setListeningId(id));
  await dispatch(playIntervalNotes(notes));
  dispatch(setListeningId(null));
};

// Start a new random harmony guess round and audibly play the target interval once.
export const startHarmonyGuessRound = () => async (dispatch, getState) => {
  const { intervals, root } = getState().harmony;
  if (!intervals.length || !root) return;
  const randomIv = intervals[Math.floor(Math.random() * intervals.length)];
  const id = ivId(randomIv);
  const notes = [root, randomIv.note];
  dispatch(beginHarmonyGuessRound({ id, notes }));
  await dispatch(playIntervalNotes(notes));
};

// Replay the same two-note sequence stored from the current round without re-randomizing.
export const replayHarmonyInterval = () => async (dispatch, getState) => {
  const { currentNotes } = getState().harmony;
  if (currentNotes.length) {
    await dispatch(playIntervalNotes(currentNotes));
  }
};

// Submit a guess: update local Redux, then report boolean outcome to Java Guess.
export const submitHarmonyGuess = (id) => async (dispatch, getState) => {
  const { guessTargetId, guessSolved } = getState().harmony;
  if (guessSolved) return;
  const correct = id === guessTargetId;
  dispatch(recordHarmonyGuess(id));
  await dispatch(recordServerGuess(correct));
};

export default harmonySlice.reducer;
