/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// createSlice generates action creators and a reducer from a concise state description.
import { createSlice } from '@reduxjs/toolkit';
// HTTP client that POSTs guess outcomes to the Java ScaleServer.
import { postGuessOutcome, postGuessReset } from '../services/scaleApi';

// Redux slice storing cumulative guess stats returned from the server after each guess.
const guessStatsSlice = createSlice({
  // slice name used in Redux DevTools and action type prefixes.
  name: 'guessStats',
  // initialState before any successful POST updates the session.
  initialState: {
    // Opaque session id string issued by Java; sent back on subsequent POSTs.
    sessionId: null,
    // Count of correct outcomes (Java Guess entries equal to 1).
    wins: 0,
    // Total recorded outcomes (wins + losses) from the same Java Guess session.
    guesses: 0,
  },
  // Synchronous reducers only; async work lives in thunks below.
  reducers: {
    // Overwrites all stats fields from a successful /api/guess-outcome JSON body.
    setGuessStatsFromServer(state, action) {
      // Destructure payload for concise assignment to Immer draft state.
      const { sessionId, wins, guesses } = action.payload;
      // Persist session id so the next POST reuses the same server-side Guess object.
      state.sessionId = sessionId;
      // Mirror server-computed win count.
      state.wins = wins;
      // Mirror server-computed total guess count.
      state.guesses = guesses;
    },
  },
});

// Named exports for dispatching inside components and other thunks.
export const { setGuessStatsFromServer } = guessStatsSlice.actions;

// Thunk factory: returns async function (dispatch, getState) => Promise for RTK middleware.
/** Sends outcome to ScaleServer; server updates Guess and returns counts. */
export const recordServerGuess =
  // correct is whether the user's last click matched the hidden target.
  (correct) => async (dispatch, getState) => {
    // Read current session id from Redux so the server can append to the same Guess.
    const { sessionId } = getState().guessStats;
    try {
      // Await network; throws on non-2xx so catch runs and UI stats stay unchanged.
      const data = await postGuessOutcome({ correct, sessionId });
      // Commit authoritative counts from Java into Redux for the HUD.
      dispatch(setGuessStatsFromServer(data));
    } catch (err) {
      // Log only: user still sees last known stats; no crash on transient network errors.
      console.error('Failed to record guess on server:', err);
    }
  };

/** POST /api/guess-reset; clears HUD to 0/0 on success. */
export const resetGuessScoreOnServer = () => async (dispatch, getState) => {
  const { sessionId } = getState().guessStats;
  try {
    const data = await postGuessReset({ sessionId });
    dispatch(setGuessStatsFromServer(data));
  } catch (err) {
    console.error('Failed to reset guess score on server:', err);
  }
};

// Default export is the reducer function passed into configureStore.
export default guessStatsSlice.reducer;
