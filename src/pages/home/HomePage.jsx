/*
  Home page — the dashboard.

  Projects the words state onto vocabulary stats, the "getting dusty"
  reminder, today's pick and the train/add actions. The dashboard and the
  empty state are both chosen from data, so the screen reflects state.
*/

import { useMemo } from 'react';
import { useWords } from '../../context/WordsContext.jsx';
import { computeStats, todaysPick } from '../../lib/model.js';
import { MIN_WORDS_TO_TRAIN } from '../../lib/data.js';
import { toHash } from '../../hooks/useHashRoute.js';
import { Button } from '../../components/Button.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import styles from './HomePage.module.css';
import { cx } from '../../lib/cx.js';

/** One labelled statistic cell. */
function StatCell({ label, value, modifier }) {
  return (
    <div className={cx(styles.stat, modifier)}>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={styles.statValue}>{value}</dd>
    </div>
  );
}

/** The dashboard overview subtree, derived from current state. */
function Overview({ words }) {
  const stats = useMemo(() => computeStats(words), [words]);
  const pick = useMemo(() => todaysPick(words), [words]);
  const canTrain = words.length >= MIN_WORDS_TO_TRAIN;

  return (
    <div className={styles.overview}>
      <dl className={styles.statistics} aria-label="Vocabulary statistics">
        <StatCell label="Total" value={stats.total} />
        <StatCell label="New" value={stats.new} />
        <StatCell label="Learning" value={stats.learning} modifier={styles.statLearning} />
        <StatCell label="Mastered" value={stats.mastered} modifier={styles.statMastered} />
      </dl>

      {stats.dusty > 0 && (
        <p className={styles.reminder}>
          {stats.dusty} {stats.dusty === 1 ? 'word is' : 'words are'} getting dusty!{' '}
          <span className={styles.reminderContinuation}>
            Practice them before they fade from your memory.
          </span>
        </p>
      )}

      {pick && (
        <article className={styles.pick} aria-labelledby="featured-word">
          <p className={styles.pickEyebrow}>Today's Pick</p>
          <div className={styles.pickEntry}>
            <h2 className={styles.pickWord} id="featured-word">
              <a href={toHash('word-detail', pick.id)}>{pick.word}</a>
            </h2>
            <p className={styles.pickDefinition}>{pick.definition}</p>
          </div>
          <p className={styles.pickPos}>{pick.pos}</p>
        </article>
      )}

      {!canTrain && (
        <p className={styles.requirement} id="training-requirement">
          You need at least {MIN_WORDS_TO_TRAIN} words to play.
          <br />
          Go catch some.
        </p>
      )}

      <div className={styles.actions}>
        {canTrain ? (
          <Button className={styles.actionButton} href={toHash('training')}>
            Let's train
          </Button>
        ) : (
          <Button
            className={styles.actionButton}
            disabled
            aria-describedby="training-requirement"
          >
            Let's train
          </Button>
        )}
        <Button className={styles.actionButton} variant="secondary" href={toHash('add-word')}>
          + Add a word
        </Button>
      </div>
    </div>
  );
}

export function HomePage() {
  const { words } = useWords();
  const isEmpty = words.length === 0;

  return (
    <main className={cx(styles.content, isEmpty && styles.contentEmpty)}>
      {isEmpty ? (
        <section className={styles.emptyScreen} aria-labelledby="empty-heading">
          <EmptyState
            icon="eye"
            heading="Nothing here yet"
            headingId="empty-heading"
            description="Your future favourite words are waiting out there — go catch one."
            actionHref={toHash('add-word')}
            actionLabel="+ Add the first one"
          />
        </section>
      ) : (
        <section aria-labelledby="home-heading">
          <h1 className={styles.greeting} id="home-heading">
            Ready to make some words stick?
          </h1>
          <Overview words={words} />
        </section>
      )}
    </main>
  );
}
