/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// React default import for JSX in this module.
import React from 'react';
// Redux hooks connect arpeggio listening controls to scale slice state and thunks.
import { useSelector, useDispatch } from 'react-redux';
// Thunk plays arpeggio pattern; action toggles reverse arpeggio direction flag.
import { playArpeggioListeningMode, setArpeggiosReverse } from '../store/scaleSlice';
// Mode names reused from music theory constants for seven mode buttons.
import { MODE_NAMES } from '../constants/musicTheory';
// Shared listening tab layout and grid styling with scale listening tab.
import './ListeningTab.css';

// Arpeggio listening: user hears 1-3-5-7 pattern for chosen mode in selected key.
export default function ArpeggioListeningTab() {
  const dispatch = useDispatch();
  const selectedKey = useSelector((s) => s.scale.selectedKey);
  const isPlaying = useSelector((s) => s.scale.isPlaying);
  const listeningArpeggioMode = useSelector((s) => s.scale.listeningArpeggioMode);
  const scalesLoaded = useSelector((s) => s.scale.scalesLoaded);
  const arpeggiosReverse = useSelector((s) => s.scale.arpeggiosReverse);

  const handlePlay = (modeNumber) => {
    if (isPlaying || !scalesLoaded) return;
    dispatch(playArpeggioListeningMode(modeNumber));
  };

  return (
    <div className="listening-tab">
      <p className="tab-instructions">
        Click a mode to hear the <strong>{selectedKey}</strong> Arpegio (1–3–5–7) in that mode.
      </p>
      <label className="reverse-toggle">
        <input
          type="checkbox"
          checked={arpeggiosReverse}
          onChange={(e) => dispatch(setArpeggiosReverse(e.target.checked))}
          disabled={isPlaying}
        />
        <span>Use reversed-scale Arpegio (from backend)</span>
      </label>
      <div className="mode-grid">
        {MODE_NAMES.map((name, i) => {
          const modeNumber = i + 1;
          const isActive = listeningArpeggioMode === modeNumber;
          return (
            <button
              key={name}
              className={`mode-btn ${isActive ? 'playing' : ''}`}
              onClick={() => handlePlay(modeNumber)}
              disabled={isPlaying || !scalesLoaded}
            >
              <span className="mode-name">{name}</span>
              <span className="mode-number">Mode {modeNumber}</span>
              {isActive && <span className="playing-indicator" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
