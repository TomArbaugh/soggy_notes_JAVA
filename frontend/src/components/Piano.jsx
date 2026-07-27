/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// Default React import enables JSX in this file under classic runtime settings.
import React from 'react';
// useSelector reads Redux slices without passing store through props manually.
import { useSelector } from 'react-redux';
// Component-scoped styles for keyboard layout and key colors.
import './Piano.css';

// Natural white keys in one octave for simplified piano visualization.
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
// Black keys with horizontal percent offsets for overlay positioning on white bed.
const BLACK_KEYS = [
  { note: 'C#', leftPercent: 12.28 },
  { note: 'D#', leftPercent: 26.57 },
  { note: 'F#', leftPercent: 55.14 },
  { note: 'G#', leftPercent: 69.42 },
  { note: 'A#', leftPercent: 83.71 },
];

// Visual keyboard: highlights depend on which main tab is active (prop from App).
export default function Piano({ mainTab }) {
  // Currently sounding note name during scale or arpeggio playback sequence.
  const scaleActiveNote = useSelector((s) => s.scale.activeNote);
  // Currently sounding note during harmony interval playback (root or upper tone).
  const harmonyActiveNote = useSelector((s) => s.harmony.activeNote);
  // Full ordered list of scale degrees being practiced for scale tab highlighting.
  const scaleNotes = useSelector((s) => s.scale.currentScaleNotes);
  // Arpeggio tone set for arpeggio tab highlighting on the keyboard graphic.
  const arpeggioNotes = useSelector((s) => s.scale.currentArpeggioNotes);
  // Two-note harmony set [root, upper] for harmony tab in-scale highlighting.
  const harmonyNotes = useSelector((s) => s.harmony.currentNotes);

  // Choose which Redux active note field drives the teal "pressed" key styling.
  const activeNote =
    mainTab === 'scales' || mainTab === 'arpeggios' ? scaleActiveNote : harmonyActiveNote;
  // Choose which note-name array should receive subtle "in scale" highlight treatment.
  const highlightedNotes =
    mainTab === 'scales'
      ? scaleNotes
      : mainTab === 'arpeggios'
        ? arpeggioNotes
        : harmonyNotes;

  // Predicate testing membership of a pitch class in the current highlight set.
  const isInScale = (note) => highlightedNotes.includes(note);

  return (
    <div className="piano-container">
      <div className="piano">
        {WHITE_KEYS.map((note) => (
          <div
            key={note}
            className={[
              'key white-key',
              activeNote === note ? 'active' : '',
              isInScale(note) ? 'in-scale' : '',
            ].join(' ')}
          >
            <span className="key-label">{note}</span>
          </div>
        ))}
        {BLACK_KEYS.map(({ note, leftPercent }) => (
          <div
            key={note}
            className={[
              'key black-key',
              activeNote === note ? 'active' : '',
              isInScale(note) ? 'in-scale' : '',
            ].join(' ')}
            style={{ left: `${leftPercent}%` }}
          >
            <span className="key-label">{note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
