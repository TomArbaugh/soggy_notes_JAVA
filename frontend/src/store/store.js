/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// configureStore wraps createStore with sensible Redux Toolkit defaults (thunk, serializable check).
import { configureStore } from '@reduxjs/toolkit';
// Reducer slice for scales, arpeggios, and scale-mode guessing state.
import scaleReducer from './scaleSlice';
// Reducer slice for harmony intervals, listening, and harmony guessing.
import harmonyReducer from './harmonySlice';
// Reducer slice for server-backed guess statistics (wins / total guesses).
import guessStatsReducer from './guessStatsSlice';

// Single Redux store for the whole frontend application.
const store = configureStore({
  // Root reducer map: each key becomes state.scale, state.harmony, etc.
  reducer: {
    // Namespace `scale` holds scaleSlice state.
    scale: scaleReducer,
    // Namespace `harmony` holds harmonySlice state.
    harmony: harmonyReducer,
    // Namespace `guessStats` holds guessStatsSlice state.
    guessStats: guessStatsReducer,
  },
});

// Default export consumed by main.jsx Provider.
export default store;
