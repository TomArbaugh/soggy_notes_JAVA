/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// React import for JSX support in this functional component.
import React from 'react';
// Redux hooks dispatch arpeggio guess thunks and read isolated arpeggio guess state.
import { useSelector, useDispatch } from 'react-redux';
// Thunks and action for arpeggio random round, replay, submit, and reverse checkbox.
import {
  startArpeggioGuessRound,
  replayArpeggioGuess,
  submitArpeggioGuess,
  setArpeggiosReverse,
} from '../store/scaleSlice';
// Mode names for seven answer buttons and reveal copy after solve.
import { MODE_NAMES } from '../constants/musicTheory';
// Shared guessing styles with scale and harmony guess tabs.
import './GuessingTab.css';

// Arpeggio guessing: random arpeggio playback then user selects which mode they heard.
export default function ArpeggioGuessingTab() {
  const dispatch = useDispatch();
  const isPlaying = useSelector((s) => s.scale.isPlaying);
  const scalesLoaded = useSelector((s) => s.scale.scalesLoaded);
  const guessArpeggioStarted = useSelector((s) => s.scale.guessArpeggioStarted);
  const guessArpeggioResult = useSelector((s) => s.scale.guessArpeggioResult);
  const guessArpeggioWrongAttempts = useSelector((s) => s.scale.guessArpeggioWrongAttempts);
  const guessArpeggioSolved = useSelector((s) => s.scale.guessArpeggioSolved);
  const guessArpeggioTargetMode = useSelector((s) => s.scale.guessArpeggioTargetMode);
  const arpeggiosReverse = useSelector((s) => s.scale.arpeggiosReverse);

  return (
    <div className="guessing-tab">
      <div className="guess-controls">
        <label className="reverse-toggle reverse-toggle-inline">
          <input
            type="checkbox"
            checked={arpeggiosReverse}
            onChange={(e) => dispatch(setArpeggiosReverse(e.target.checked))}
            disabled={isPlaying || guessArpeggioStarted}
          />
          <span>Use reversed-scale Arpegio (from backend)</span>
        </label>
        <button
          className="guess-btn guess-btn-primary"
          onClick={() => dispatch(startArpeggioGuessRound())}
          disabled={isPlaying || !scalesLoaded}
        >
          {guessArpeggioStarted ? 'New Round' : 'Play a Random Arpegio'}
        </button>

        {guessArpeggioStarted && (
          <button
            className="guess-btn guess-btn-secondary"
            onClick={() => dispatch(replayArpeggioGuess())}
            disabled={isPlaying}
          >
            {isPlaying ? 'Playing...' : 'Replay'}
          </button>
        )}
      </div>

      {guessArpeggioResult && (
        <div className={`result-banner ${guessArpeggioResult}`}>
          {guessArpeggioResult === 'yes' ? 'YES' : 'NO'}
        </div>
      )}

      {guessArpeggioStarted && !isPlaying && (
        <div className="guess-options">
          <p className="guess-prompt">
            {guessArpeggioSolved
              ? `It was ${MODE_NAMES[guessArpeggioTargetMode - 1]}!`
              : 'Which mode is it?'}
          </p>
          <div className="guess-grid">
            {MODE_NAMES.map((name, i) => {
              const modeNumber = i + 1;
              const isWrong = guessArpeggioWrongAttempts.includes(modeNumber);
              const isCorrectAnswer =
                guessArpeggioSolved && modeNumber === guessArpeggioTargetMode;

              let btnClass = 'guess-option';
              if (isCorrectAnswer) btnClass += ' correct';
              else if (isWrong) btnClass += ' wrong';

              return (
                <button
                  key={name}
                  className={btnClass}
                  onClick={() => {
                    if (isPlaying || guessArpeggioSolved) return;
                    dispatch(submitArpeggioGuess(modeNumber));
                  }}
                  disabled={guessArpeggioSolved || isPlaying}
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
