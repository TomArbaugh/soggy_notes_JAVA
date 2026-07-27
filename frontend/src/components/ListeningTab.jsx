/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// React default import for JSX factory in this module scope.
import React from 'react';
// Redux hooks connect this presentational component to scale slice state and thunks.
import { useSelector, useDispatch } from 'react-redux';
// Thunk plays chosen mode scale; action toggles reverse playback flag in Redux.
import { playListeningMode, setScalesReverse } from '../store/scaleSlice';
// Human-readable mode names array indexed 0..6 mapping to backend modes 1..7.
import { MODE_NAMES } from '../constants/musicTheory';
// Shared grid styles with harmony listening tab for consistent look.
import './ListeningTab.css';

// Scale listening UI: user picks a mode to hear that scale in the selected key.
export default function ListeningTab() {
  // dispatch sends thunks and plain actions to the Redux store middleware pipeline.
  const dispatch = useDispatch();
  // Current tonic letter from Redux for instructional copy and API-backed playback.
  const selectedKey = useSelector((s) => s.scale.selectedKey);
  // Gate to prevent overlapping play requests while a sequence is sounding.
  const isPlaying = useSelector((s) => s.scale.isPlaying);
  // Which mode button is currently animating as playing for visual feedback.
  const listeningMode = useSelector((s) => s.scale.listeningMode);
  // Data must be present before enabling mode buttons after successful API load.
  const scalesLoaded = useSelector((s) => s.scale.scalesLoaded);
  // Checkbox state controlling forward vs reverse note order from backend arrays.
  const scalesReverse = useSelector((s) => s.scale.scalesReverse);

  // Click handler debounces play if already playing or scales not yet loaded.
  const handlePlay = (modeNumber) => {
    if (isPlaying || !scalesLoaded) return;
    dispatch(playListeningMode(modeNumber));
  };

  return (
    <div className="listening-tab">
      <p className="tab-instructions">
        Click a mode to hear the <strong>{selectedKey}</strong> scale in that mode.
      </p>
      <label className="reverse-toggle">
        <input
          type="checkbox"
          checked={scalesReverse}
          onChange={(e) => dispatch(setScalesReverse(e.target.checked))}
          disabled={isPlaying}
        />
        <span>Reverse order (from backend)</span>
      </label>
      <div className="mode-grid">
        {MODE_NAMES.map((name, i) => {
          const modeNumber = i + 1;
          const isActive = listeningMode === modeNumber;
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
