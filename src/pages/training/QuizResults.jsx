/*
  Training results: score card, the word groups that changed state during
  the session (freshly learned / back to the bench / dusted off) and the
  exit actions.
*/

import { assessmentFor } from '../../lib/model.js';
import { toHash } from '../../hooks/useHashRoute.js';
import { Icon } from '../../components/Icon.jsx';
import { Button } from '../../components/Button.jsx';
import styles from './Training.module.css';
import { cx } from '../../lib/cx.js';

function ResultGroup({ modifier, title, words, open = false }) {
  return (
    <details className={cx(styles.resultGroup, modifier)} open={open && words.length > 0}>
      <summary>
        <span>{title}</span>
        <span className={styles.wordCount}>
          {words.length} {words.length === 1 ? 'word' : 'words'}
        </span>
        <Icon name="caret" size={12} className={styles.chevron} />
      </summary>
      {words.length > 0 && (
        <ul>
          {words.map((word) => (
            <li key={word}>{word}</li>
          ))}
        </ul>
      )}
    </details>
  );
}

export function QuizResults({ session, onRestart }) {
  const total = session.questions.length;
  const fraction = total ? session.correctCount / total : 0;

  return (
    <section aria-labelledby="results-heading">
      <h1 className={styles.heading} id="results-heading">Training complete</h1>

      <div className={styles.scoreCard}>
        <p className={styles.scoreTotal} aria-label={`${session.correctCount} out of ${total}`}>
          {session.correctCount}/{total}
        </p>
        <p className={styles.scoreAssessment}>{assessmentFor(fraction)}</p>
      </div>

      <div className={styles.resultGroups}>
        <ResultGroup
          modifier={styles.freshlyLearned}
          title="freshly learned"
          words={session.transitions.mastered}
          open
        />
        <ResultGroup
          modifier={styles.backToBench}
          title="back to the bench"
          words={session.transitions.demoted}
        />
        <ResultGroup
          modifier={styles.dustedOff}
          title="dusted off"
          words={session.transitions.dusted}
        />
      </div>

      <div className={styles.resultActions}>
        <Button onClick={onRestart}>One more?</Button>
        <Button variant="secondary" href={toHash('home')}>
          That's it for today
        </Button>
      </div>
    </section>
  );
}
