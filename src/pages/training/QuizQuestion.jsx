/*
  Quiz question screen: progress, prompt, the free color hint, four answer
  cards and instant feedback. One screen, several states — question / hint /
  correct / wrong — all derived from the session object (no DOM toggling).
  The feedback phrase is picked by the parent at grade time so it stays
  stable across re-renders.
*/

import { FEEDBACK } from '../../lib/data.js';
import { Button } from '../../components/Button.jsx';
import styles from './Training.module.css';
import { cx } from '../../lib/cx.js';

function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function Progress({ index, total }) {
  const filled = index + 1;
  return (
    <div className={styles.progress}>
      <p className={styles.progressLabel} id="quiz-progress-label">
        {filled} / {total}
      </p>
      <progress
        className="sr-only"
        max={total}
        value={filled}
        aria-labelledby="quiz-progress-label"
      >
        {filled} / {total}
      </progress>
      <div className={styles.segments} aria-hidden="true">
        {Array.from({ length: total }, (_, segment) => (
          <i key={segment} className={segment < filled ? styles.filled : ''} />
        ))}
      </div>
    </div>
  );
}

function AnswerOption({ option, index, session, onSelect }) {
  const selected = session.selectedIndex === index;
  const classes = cx(
    styles.answerCard,
    session.answered && option.correct && styles.answerCorrect,
    session.answered && !option.correct && selected && styles.answerWrong,
  );

  return (
    <label className={classes}>
      <input
        className={styles.nativeRadio}
        type="radio"
        name="quiz-answer"
        value={index}
        checked={selected}
        disabled={session.answered}
        onChange={() => onSelect(index)}
      />
      <span>
        {option.text}
        {session.answered && option.correct && <span className="sr-only"> (Correct answer)</span>}
        {session.answered && !option.correct && selected && (
          <span className="sr-only"> (Incorrect answer)</span>
        )}
      </span>
    </label>
  );
}

export function QuizQuestion({ session, dark, onSelect, onHint, onCheck, onNext }) {
  const question = session.questions[session.index];
  const isLast = session.index >= session.questions.length - 1;
  const showCategory = session.hintUsed || session.answered;

  const instruction = session.hintUsed
    ? 'Select the option with matching color hint'
    : session.direction === 'word'
      ? 'Select the correct meaning'
      : 'Select the correct word';

  const handleCheck = () => {
    const correct = Boolean(question.options[session.selectedIndex]?.correct);
    onCheck(randomOf(correct ? FEEDBACK.correct : FEEDBACK.wrong));
  };

  return (
    <section
      className={cx(
        session.hintUsed && !session.answered && styles.hintScreen,
        session.answered && styles.feedbackScreen,
        session.answered && session.lastCorrect && styles.correctScreen,
        session.answered && !session.lastCorrect && styles.wrongScreen,
        dark && styles.dark,
      )}
      aria-labelledby="quiz-heading"
    >
      <h1 className={styles.heading} id="quiz-heading">Quiz</h1>

      <Progress index={session.index} total={session.questions.length} />

      <p className={styles.instruction} id="quiz-instruction">{instruction}</p>

      <div className={styles.prompt}>
        <h2 id="quiz-word">{question.prompt}</h2>
        {showCategory && <span className={styles.category}>{question.pos}</span>}
      </div>

      <div className={styles.answerArea}>
        {session.answered && (
          <p className={styles.feedbackMessage}>
            <span>{session.feedback}</span>
            {session.lastCorrect && <span className={styles.points}>+1 point</span>}
          </p>
        )}

        <fieldset aria-labelledby="quiz-instruction quiz-word">
          <legend className="sr-only">Answers</legend>
          <div className={styles.answerGrid}>
            {question.options.map((option, index) => (
              <AnswerOption
                key={option.text}
                option={option}
                index={index}
                session={session}
                onSelect={onSelect}
              />
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.actions}>
        {session.answered ? (
          <Button autoFocus className={dark ? styles.buttonInverted : ''} onClick={onNext}>
            {isLast ? 'See results' : 'Next question'}
          </Button>
        ) : (
          <>
            {!session.hintUsed && (
              <Button variant="secondary" onClick={onHint}>
                Show color
              </Button>
            )}
            <Button
              className={dark ? styles.buttonInverted : ''}
              disabled={session.selectedIndex == null}
              onClick={handleCheck}
            >
              Check
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
