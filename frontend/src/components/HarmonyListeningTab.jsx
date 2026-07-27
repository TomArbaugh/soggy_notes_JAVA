/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// React import for JSX compilation in this component module.
import React from 'react';
// Redux hooks wire harmony slice playback and shared scale slice for selected key label.
import { useSelector, useDispatch } from 'react-redux';
// Thunk plays two-note interval; helpers format button label and stable id string.
import {
  playListeningInterval,
  ivId,
  harmonyIntervalDisplayName,
} from '../store/harmonySlice';
// Reuse listening tab grid styles for visual consistency across practice modes.
import './ListeningTab.css';

// Harmony listening: user hears each selectable interval against current tonic in Redux.
export default function HarmonyListeningTab() {
  const dispatch = useDispatch();
  // Tonic letter shown in instructional copy (stored on scale slice as global key choice).
  const selectedKey = useSelector((s) => s.scale.selectedKey);
  // Prevent double-trigger while interval arpeggio is sounding.
  const isPlaying = useSelector((s) => s.harmony.isPlaying);
  // Highlights which interval button is currently playing for progress animation.
  const listeningId = useSelector((s) => s.harmony.listeningId);
  // Gate enabling buttons only after successful harmony API normalization.
  const intervalsLoaded = useSelector((s) => s.harmony.intervalsLoaded);
  // Normalized interval rows (collapsed 4ths/5ths, no minor second) from Redux cache.
  const intervals = useSelector((s) => s.harmony.intervals);

  const handlePlay = (id) => {
    if (isPlaying || !intervalsLoaded) return;
    dispatch(playListeningInterval(id));
  };

  return (
    <div className="listening-tab">
      <p className="tab-instructions">
        Click an interval to hear it in the key of{' '}
        <strong>{selectedKey}</strong>.
      </p>
      <div className="mode-grid">
        {intervals.map((iv) => {
          const id = ivId(iv);
          const isActive = listeningId === id;
          return (
            <button
              key={id}
              className={`mode-btn ${isActive ? 'playing' : ''}`}
              onClick={() => handlePlay(id)}
              disabled={isPlaying || !intervalsLoaded}
            >
              <span className="mode-name">{harmonyIntervalDisplayName(iv)}</span>
              {isActive && <span className="playing-indicator" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
