/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// React import enabling JSX syntax in this functional component file.
import React from 'react';
// Redux hooks read harmony guess state and dispatch harmony thunks.
import { useSelector, useDispatch } from 'react-redux';
// Thunks and pure helpers for random interval round, replay, submit, and labels.
import {
  startHarmonyGuessRound,
  replayHarmonyInterval,
  submitHarmonyGuess,
  ivId,
  harmonyIntervalDisplayName,
} from '../store/harmonySlice';
// Shared guess UI styles with scale and arpeggio guessing tabs.
import './GuessingTab.css';

// Harmony guessing: random two-note interval then user picks matching label button.
export default function HarmonyGuessingTab() {
  const dispatch = useDispatch();
  const isPlaying = useSelector((s) => s.harmony.isPlaying);
  const intervalsLoaded = useSelector((s) => s.harmony.intervalsLoaded);
  const intervals = useSelector((s) => s.harmony.intervals);
  const guessStarted = useSelector((s) => s.harmony.guessStarted);
  const guessResult = useSelector((s) => s.harmony.guessResult);
  const guessWrongAttempts = useSelector((s) => s.harmony.guessWrongAttempts);
  const guessSolved = useSelector((s) => s.harmony.guessSolved);
  const guessTargetId = useSelector((s) => s.harmony.guessTargetId);

  const handleNewRound = () => dispatch(startHarmonyGuessRound());
  const handleReplay = () => dispatch(replayHarmonyInterval());

  const handleGuess = (id) => {
    if (isPlaying || guessSolved) return;
    dispatch(submitHarmonyGuess(id));
  };

  const targetIv = intervals.find((iv) => ivId(iv) === guessTargetId);

  return (
    <div className="guessing-tab">
      <div className="guess-controls">
        <button
          className="guess-btn guess-btn-primary"
          onClick={handleNewRound}
          disabled={isPlaying || !intervalsLoaded}
        >
          {guessStarted ? 'New Round' : 'Play a Random Interval'}
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

      {guessResult && (
        <div className={`result-banner ${guessResult}`}>
          {guessResult === 'yes' ? 'YES' : 'NO'}
        </div>
      )}

      {guessStarted && !isPlaying && (
        <div className="guess-options">
          <p className="guess-prompt">
            {guessSolved
              ? `It was ${targetIv ? harmonyIntervalDisplayName(targetIv) : ''}!`
              : 'Which interval is it?'}
          </p>
          <div className="guess-grid">
            {intervals.map((iv) => {
              const id = ivId(iv);
              const isWrong = guessWrongAttempts.includes(id);
              const isCorrectAnswer = guessSolved && id === guessTargetId;

              let btnClass = 'guess-option';
              if (isCorrectAnswer) btnClass += ' correct';
              else if (isWrong) btnClass += ' wrong';

              return (
                <button
                  key={id}
                  className={btnClass}
                  onClick={() => handleGuess(id)}
                  disabled={guessSolved || isPlaying}
                >
                  {harmonyIntervalDisplayName(iv)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
