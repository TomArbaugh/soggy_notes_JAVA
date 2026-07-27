/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MODE_NAMES } from '../constants/musicTheory';
import {
  applyGuideToneTransform,
  undoGuideToneTransform,
} from '../store/scaleSlice';
import './GuideTonePanel.css';

export default function GuideTonePanel() {
  const dispatch = useDispatch();
  const scalesLoading = useSelector((s) => s.scale.scalesLoading);
  const scalesLoaded = useSelector((s) => s.scale.scalesLoaded);
  const canUndo = useSelector((s) => s.scale.guideToneUndoScales != null);
  const [mode, setMode] = useState(1);

  const busy = scalesLoading || !scalesLoaded;

  return (
    <section className="guide-tone-panel" aria-label="Guide Tones">
      <h3 className="guide-tone-heading">Guide Tones</h3>
      <p className="guide-tone-hint">
        Pick a mode, then refetch scales with server guide-tone transforms (destroy / only). Use Undo
        to restore the previous scale cache for this key.
      </p>
      <label className="guide-tone-label">
        Scale / mode
        <select
          className="guide-tone-select"
          value={mode}
          onChange={(e) => setMode(Number(e.target.value))}
          disabled={busy}
        >
          {MODE_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {i + 1}. {name}
            </option>
          ))}
        </select>
      </label>
      <div className="guide-tone-actions">
        <button
          type="button"
          className="guide-tone-btn danger"
          disabled={busy}
          onClick={() => dispatch(applyGuideToneTransform({ transform: 'destroy', mode }))}
        >
          Destroy guide tones
        </button>
        <button
          type="button"
          className="guide-tone-btn"
          disabled={busy}
          onClick={() => dispatch(applyGuideToneTransform({ transform: 'only', mode }))}
        >
          Guide tones only
        </button>
        <button
          type="button"
          className="guide-tone-btn secondary"
          disabled={busy || !canUndo}
          onClick={() => dispatch(undoGuideToneTransform())}
        >
          Undo
        </button>
      </div>
    </section>
  );
}
