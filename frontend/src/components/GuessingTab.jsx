/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// React core import for JSX in this file.
import React from 'react';
// Redux bindings for dispatching thunks and selecting scale guess slice fields.
import { useSelector, useDispatch } from 'react-redux';
// Thunks and actions implementing scale guessing game loop and reverse toggle.
import {
  startGuessRound,
  replayGuessScale,
  submitGuess,
  setScalesReverse,
} from '../store/scaleSlice';
// Mode labels for grid buttons and reveal string after solve.
import { MODE_NAMES } from '../constants/musicTheory';
// Shared styles with harmony and arpeggio guess tabs for consistent controls layout.
import './GuessingTab.css';

// Scale guessing UI: random mode playback then user picks matching mode name.
export default function GuessingTab() {
  const dispatch = useDispatch();
  const isPlaying = useSelector((s) => s.scale.isPlaying);
  const scalesLoaded = useSelector((s) => s.scale.scalesLoaded);
  const guessStarted = useSelector((s) => s.scale.guessStarted);
  const guessResult = useSelector((s) => s.scale.guessResult);
  const guessWrongAttempts = useSelector((s) => s.scale.guessWrongAttempts);
  const guessSolved = useSelector((s) => s.scale.guessSolved);
  const guessTargetMode = useSelector((s) => s.scale.guessTargetMode);
  const scalesReverse = useSelector((s) => s.scale.scalesReverse);

  const handleNewRound = () => {
    dispatch(startGuessRound());
  };

  const handleReplay = () => {
    dispatch(replayGuessScale());
  };

  const handleGuess = (modeNumber) => {
    if (isPlaying || guessSolved) return;
    dispatch(submitGuess(modeNumber));
  };

  return (
    <div className="guessing-tab">
      {/* ── Play Controls ─────────────────────────────────────── */}
      <div className="guess-controls">
        <label className="reverse-toggle reverse-toggle-inline">
          <input
            type="checkbox"
            checked={scalesReverse}
            onChange={(e) => dispatch(setScalesReverse(e.target.checked))}
            disabled={isPlaying || guessStarted}
          />
          <span>Reverse order (from backend)</span>
        </label>
        <button
          className="guess-btn guess-btn-primary"
          onClick={handleNewRound}
          disabled={isPlaying || !scalesLoaded}
        >
          {guessStarted ? 'New Round' : 'Play a Random Scale'}
        </button>

        {guessStarted && (
          <button
            className="guess-btn guess-btn-secondary"
            onClick={handleReplay}
            disabled={isPlaying}
          >
            {isPlaying ? 'Playing...' : 'Replay'}
          </button>
        )}
      </div>

      {/* ── Result Banner ─────────────────────────────────────── */}
      {guessResult && (
        <div className={`result-banner ${guessResult}`}>
          {guessResult === 'yes' ? 'YES' : 'NO'}
        </div>
      )}

      {/* ── Guess Buttons ─────────────────────────────────────── */}
      {guessStarted && !isPlaying && (
        <div className="guess-options">
          <p className="guess-prompt">
            {guessSolved
              ? `It was ${MODE_NAMES[guessTargetMode - 1]}!`
              : 'Which mode is it?'}
          </p>
          <div className="guess-grid">
            {MODE_NAMES.map((name, i) => {
              const modeNumber = i + 1;
              const isWrong = guessWrongAttempts.includes(modeNumber);
              const isCorrectAnswer = guessSolved && modeNumber === guessTargetMode;

              let btnClass = 'guess-option';
              if (isCorrectAnswer) btnClass += ' correct';
              else if (isWrong) btnClass += ' wrong';

              return (
                <button
                  key={name}
                  className={btnClass}
                  onClick={() => handleGuess(modeNumber)}
                  disabled={guessSolved || isPlaying}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
