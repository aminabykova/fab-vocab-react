/*
  Quiz setup screen: direction, difficulty and session length. Hard mode is
  disabled until some color has at least HARD_MODE_MIN_PER_COLOR words; the
  start button is gated on MIN_WORDS_TO_TRAIN. Fully controlled — the
  selected values go to TrainingPage's startQuiz on submit.
*/

import { useState } from 'react';
import { colorCounts } from '../../lib/model.js';
import {
  MIN_WORDS_TO_TRAIN,
  HARD_MODE_MIN_PER_COLOR,
} from '../../lib/data.js';
import { Button } from '../../components/Button.jsx';
import styles from './Training.module.css';

function Choice({ name, value, checked, disabled = false, title, description, onChange }) {
  return (
    <label className={styles.choice}>
      <input
        className={styles.nativeRadio}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
      />
      <span className={styles.choiceTitle}>{title}</span>
      <span className={styles.choiceDescription}>{description}</span>
    </label>
  );
}

export function QuizSetup({ words, onStart }) {
  const [direction, setDirection] = useState('word');
  const [mode, setMode] = useState('regular');
  const [count, setCount] = useState(5);

  const canTrain = words.length >= MIN_WORDS_TO_TRAIN;
  const counts = colorCounts(words);
  const hardAvailable = Object.values(counts).some((total) => total >= HARD_MODE_MIN_PER_COLOR);

  const effectiveMode = hardAvailable ? mode : 'regular';

  const handleSubmit = (event) => {
    event.preventDefault();
    onStart({ direction, mode: effectiveMode, count: Number(count) });
  };

  return (
    <section aria-labelledby="setup-heading">
      <h1 className={`${styles.heading} ${styles.setupHeading}`} id="setup-heading">
        Quiz setup
      </h1>

      <form className={styles.setupForm} onSubmit={handleSubmit}>
        <fieldset>
          <legend>Training direction</legend>

          <div className={styles.setupOptions}>
            <Choice
              name="setup-direction"
              value="word"
              checked={direction === 'word'}
              title="Word → Definition"
              description="See the word, guess the correct meaning."
              onChange={setDirection}
            />
            <Choice
              name="setup-direction"
              value="definition"
              checked={direction === 'definition'}
              title="Definition → Word"
              description="Reverse recall. Harder, but highly rewarding."
              onChange={setDirection}
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Difficulty Mode</legend>

          <div className={styles.setupOptions}>
            <Choice
              name="setup-difficulty"
              value="regular"
              checked={effectiveMode === 'regular'}
              title="Regular mode"
              description="Options in different colors"
              onChange={setMode}
            />
            <Choice
              name="setup-difficulty"
              value="hard"
              checked={effectiveMode === 'hard'}
              disabled={!hardAvailable}
              title="Hard mode"
              description={
                hardAvailable ? 'Same color chaos' : 'Not enough words of one color (need 4).'
              }
              onChange={setMode}
            />
          </div>
        </fieldset>

        <div className={styles.startRow}>
          <fieldset>
            <legend>Questions</legend>

            <div className={styles.questionCount}>
              {[5, 10, 15].map((option) => (
                <label key={option}>
                  <input
                    className={styles.nativeRadio}
                    type="radio"
                    name="setup-count"
                    value={option}
                    checked={count === option}
                    onChange={() => setCount(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit" className={styles.startButton} disabled={!canTrain}>
            Let's go
          </Button>
        </div>

        {!canTrain && (
          <p className={styles.setupNote}>
            You need at least {MIN_WORDS_TO_TRAIN} words to play. Go catch some.
          </p>
        )}
      </form>
    </section>
  );
}
