/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// useState holds local UI tab state not worth serializing in Redux.
import React, { useState, useEffect } from 'react';
// Typed hooks connect React components to the Redux store without prop drilling.
import { useSelector, useDispatch } from 'react-redux';
// Thunks and tab actions for scales and arpeggios feature area.
import { loadScalesForKey, setActiveTab, setArpeggioSubTab } from './store/scaleSlice';
// Thunks and tab actions for harmonies feature area.
import { loadHarmoniesForKey, setHarmonySubTab } from './store/harmonySlice';
// Warm browser audio cache for all chromatic samples on first paint.
import { preloadAll } from './services/audioService';
// Shared list of root key labels for key picker and preload.
import { CHROMATIC } from './constants/musicTheory';
// Visual one-octave keyboard highlights active and in-scale notes.
import Piano from './components/Piano';
// Scale mode listening grid (Ionian through Locrian).
import ListeningTab from './components/ListeningTab';
// Scale mode guessing UI.
import GuessingTab from './components/GuessingTab';
// Arpeggio listening grid per mode.
import ArpeggioListeningTab from './components/ArpeggioListeningTab';
// Arpeggio guessing UI.
import ArpeggioGuessingTab from './components/ArpeggioGuessingTab';
// Harmony interval listening grid.
import HarmonyListeningTab from './components/HarmonyListeningTab';
// Harmony interval guessing UI.
import HarmonyGuessingTab from './components/HarmonyGuessingTab';
import GuideTonePanel from './components/GuideTonePanel';
import { resetGuessScoreOnServer } from './store/guessStatsSlice';
// Global layout and chrome styles for this shell component.
import './App.css';

// Root application component rendered once inside Redux Provider.
export default function App() {
  // dispatch is stable reference used to fire thunks and synchronous actions.
  const dispatch = useDispatch();
  // mainTab tracks which primary feature (harmonies, scales, arpeggios) is visible.
  const [mainTab, setMainTab] = useState('harmonies');

  // Currently selected tonic from Redux for key picker highlighting and API loads.
  const selectedKey = useSelector((s) => s.scale.selectedKey);
  // Scales sub-route: listening vs guessing within Scales main tab.
  const scaleActiveTab = useSelector((s) => s.scale.activeTab);
  // Arpeggios sub-route: listening vs guessing within Arpeggios main tab.
  const arpeggioSubTab = useSelector((s) => s.scale.arpeggioSubTab);
  // True while GET /api/scales is in flight for the selected key.
  const scalesLoading = useSelector((s) => s.scale.scalesLoading);
  // Harmonies sub-route: listening vs guessing within Harmonies main tab.
  const harmonySubTab = useSelector((s) => s.harmony.activeSubTab);
  // True while GET /api/harmonies is in flight for the selected key.
  const intervalsLoading = useSelector((s) => s.harmony.intervalsLoading);
  // Cumulative correct guesses from Java-backed session for HUD display.
  const guessWins = useSelector((s) => s.guessStats.wins);
  // Total guess attempts recorded server-side for HUD denominator.
  const guessTotal = useSelector((s) => s.guessStats.guesses);

  // Combined loading flag disables key buttons while either backend fetch runs.
  const loading = scalesLoading || intervalsLoading;

  // On mount: preload audio and load default key C for both scales and harmonies.
  useEffect(() => {
    preloadAll(CHROMATIC);
    dispatch(loadScalesForKey('C'));
    dispatch(loadHarmoniesForKey('C'));
  }, [dispatch]);

  // When user picks a new tonic, refresh both backend datasets for that key.
  const handleKeyChange = (key) => {
    dispatch(loadScalesForKey(key));
    dispatch(loadHarmoniesForKey(key));
  };

  return (
    <div className="app">
      <div className="app-body">
      <aside className="guess-stats-hud" aria-live="polite">
        <span className="guess-stats-label">Wins</span>
        <span className="guess-stats-value">{guessWins}</span>
        <span className="guess-stats-sep">/</span>
        <span className="guess-stats-label">Guesses</span>
        <span className="guess-stats-value">{guessTotal}</span>
        <button
          type="button"
          className="guess-reset-btn"
          onClick={() => dispatch(resetGuessScoreOnServer())}
        >
          Reset score
        </button>
      </aside>
      <header className="app-header">
        <h1>Ear Trainer</h1>
      </header>

      <section className="key-picker">
        <span className="key-picker-label">Key of</span>
        <div className="key-buttons">
          {CHROMATIC.map((k) => (
            <button
              key={k}
              className={`key-btn ${selectedKey === k ? 'selected' : ''}`}
              onClick={() => handleKeyChange(k)}
              disabled={loading}
            >
              {k}
            </button>
          ))}
        </div>
      </section>

      {loading && <p className="loading-msg">Loading from backend...</p>}

      <Piano mainTab={mainTab} />

      <nav className="main-tab-bar">
        <button
          className={`main-tab ${mainTab === 'harmonies' ? 'active' : ''}`}
          onClick={() => setMainTab('harmonies')}
        >
          Harmonies
        </button>
        <button
          className={`main-tab ${mainTab === 'scales' ? 'active' : ''}`}
          onClick={() => setMainTab('scales')}
        >
          Scales
        </button>
        <button
          className={`main-tab ${mainTab === 'arpeggios' ? 'active' : ''}`}
          onClick={() => setMainTab('arpeggios')}
        >
          Arpegios
        </button>
      </nav>

      {mainTab === 'scales' && (
        <nav className="tab-bar">
          <button
            className={`tab ${scaleActiveTab === 'listening' ? 'active' : ''}`}
            onClick={() => dispatch(setActiveTab('listening'))}
          >
            Listen
          </button>
          <button
            className={`tab ${scaleActiveTab === 'guessing' ? 'active' : ''}`}
            onClick={() => dispatch(setActiveTab('guessing'))}
          >
            Guess
          </button>
        </nav>
      )}

      {mainTab === 'arpeggios' && (
        <nav className="tab-bar">
          <button
            className={`tab ${arpeggioSubTab === 'listening' ? 'active' : ''}`}
            onClick={() => dispatch(setArpeggioSubTab('listening'))}
          >
            Listen
          </button>
          <button
            className={`tab ${arpeggioSubTab === 'guessing' ? 'active' : ''}`}
            onClick={() => dispatch(setArpeggioSubTab('guessing'))}
          >
            Guess
          </button>
        </nav>
      )}

      {mainTab === 'harmonies' && (
        <nav className="tab-bar">
          <button
            className={`tab ${harmonySubTab === 'listening' ? 'active' : ''}`}
            onClick={() => dispatch(setHarmonySubTab('listening'))}
          >
            Listen
          </button>
          <button
            className={`tab ${harmonySubTab === 'guessing' ? 'active' : ''}`}
            onClick={() => dispatch(setHarmonySubTab('guessing'))}
          >
            Guess
          </button>
        </nav>
      )}

      <section className="tab-content">
        {mainTab === 'scales' && scaleActiveTab === 'listening' && <ListeningTab />}
        {mainTab === 'scales' && scaleActiveTab === 'guessing' && <GuessingTab />}
        {mainTab === 'arpeggios' && arpeggioSubTab === 'listening' && <ArpeggioListeningTab />}
        {mainTab === 'arpeggios' && arpeggioSubTab === 'guessing' && <ArpeggioGuessingTab />}
        {mainTab === 'harmonies' && harmonySubTab === 'listening' && (
          <HarmonyListeningTab />
        )}
        {mainTab === 'harmonies' && harmonySubTab === 'guessing' && (
          <HarmonyGuessingTab />
        )}
      </section>
      </div>

      {mainTab === 'scales' && (
        <div className="guide-tone-panel-anchor">
          <GuideTonePanel />
        </div>
      )}
    </div>
  );
}
