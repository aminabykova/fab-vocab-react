/*
  Progress page — statistics panels (status distribution, color
  distribution, added-vs-mastered monthly chart, recently mastered) derived
  entirely from the words state. Bar proportions are computed from counts
  and set as inline flex-grow / height, so the charts are a true projection
  of state rather than fixed geometry.
*/

import { useMemo } from 'react';
import { useWords } from '../../context/WordsContext.jsx';
import { computeStats, colorCounts, monthlyStats, recentlyMastered } from '../../lib/model.js';
import { COLORS, COLOR_IDS } from '../../lib/data.js';
import { toHash } from '../../hooks/useHashRoute.js';
import { Icon } from '../../components/Icon.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import colors from '../../styles/colors.module.css';
import styles from './ProgressPage.module.css';
import { cx } from '../../lib/cx.js';

function percent(count, total) {
  return total ? Math.round((count / total) * 100) : 0;
}

/** A labelled panel: heading + content card. */
function Panel({ heading, className = '', children }) {
  return (
    <section className={cx(styles.panel, className)}>
      <h2 className={styles.panelHeading}>{heading}</h2>
      {children}
    </section>
  );
}

/* ------------------------------- panels ------------------------------- */

const STATUS_PART_STYLES = {
  new: styles.statusNew,
  learning: styles.statusLearning,
  mastered: styles.statusMastered,
  dusty: styles.statusDusty,
};

function StatusPanel({ words }) {
  const stats = computeStats(words);
  const total = stats.total;
  const masteredFresh = Math.max(stats.mastered - stats.dusty, 0);

  const parts = [
    { id: 'new', label: 'New', count: stats.new },
    { id: 'learning', label: 'Learning', count: stats.learning },
    { id: 'mastered', label: 'Mastered', count: masteredFresh },
    { id: 'dusty', label: 'Dusty', count: stats.dusty },
  ];

  return (
    <Panel heading="Vocabulary Stats">
      <div className={cx(styles.card, styles.vocabularyCard)}>
        <div className={cx(styles.distribution, styles.statusDistribution)} aria-hidden="true">
          {parts.map((part) => (
            <span
              key={part.id}
              className={cx(styles.segment, STATUS_PART_STYLES[part.id])}
              style={{ flexGrow: part.count }}
            />
          ))}
        </div>

        <dl className={styles.legend}>
          {parts.map((part) => (
            <div key={part.id} className={styles.legendEntry}>
              <dt>
                <span
                  className={cx(styles.legendDot, STATUS_PART_STYLES[part.id])}
                  aria-hidden="true"
                />
                {part.label}
              </dt>
              <dd>{percent(part.count, total)}%</dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}

function ColorPanel({ words }) {
  const counts = colorCounts(words);
  const total = words.length;

  const ranked = COLORS.map((color) => ({
    id: color.id,
    label: color.label,
    count: counts[color.id],
    pct: percent(counts[color.id], total),
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const most = ranked[0];
  const rest = ranked.slice(1);

  return (
    <Panel heading="Color Stats">
      <div className={styles.card}>
        <div className={cx(styles.distribution, styles.colorDistribution)} aria-hidden="true">
          {COLOR_IDS.map((id) => (
            <span
              key={id}
              className={cx(styles.segment, colors[id])}
              style={{ flexGrow: counts[id] }}
            />
          ))}
        </div>

        <details className={styles.colorBreakdown}>
          <summary className={styles.colorSummary}>
            <span>{most ? `Most: ${most.label} ${most.pct}%` : 'No words yet'}</span>
            <Icon name="caret" size={16} className={styles.chevron} />
          </summary>
          <ul className={styles.colorShares}>
            {rest.map((entry) => (
              <li key={entry.id}>
                <span>{entry.label}</span>
                <span>{entry.pct}%</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </Panel>
  );
}

function MonthlyPanel({ words }) {
  const months = monthlyStats(words, 3);
  const max = Math.max(1, ...months.flatMap((month) => [month.added, month.mastered]));

  return (
    <Panel heading="Added vs Mastered (Monthly)">
      <figure className={cx(styles.card, styles.monthlyCard)}>
        <div className={styles.chart} aria-hidden="true">
          {months.map((month) => (
            <div key={month.key} className={styles.monthGroup}>
              <div className={styles.monthBars}>
                <span
                  className={cx(styles.bar, styles.barAdded)}
                  style={{ height: `${Math.round((month.added / max) * 100)}%` }}
                />
                <span
                  className={cx(styles.bar, styles.barMastered)}
                  style={{ height: `${Math.round((month.mastered / max) * 100)}%` }}
                />
              </div>
              <span className={styles.monthLabel}>{month.label}</span>
            </div>
          ))}
        </div>

        <figcaption className={styles.monthlyLegend}>
          <span>
            <span className={cx(styles.legendDot, styles.statusNew)} aria-hidden="true" />
            Added
          </span>
          <span>
            <span className={cx(styles.legendDot, styles.statusMastered)} aria-hidden="true" />
            Mastered
          </span>
        </figcaption>
      </figure>
    </Panel>
  );
}

function RecentPanel({ words }) {
  const recent = recentlyMastered(words, 5);

  return (
    <Panel heading="Recently Mastered" className={styles.recentPanel}>
      <ul className={styles.recentWords}>
        {recent.length > 0 ? (
          recent.map((word) => (
            <li key={word.id}>
              <a className={styles.recentWord} href={toHash('word-detail', word.id)}>
                <span className={styles.recentWordName}>{word.word}</span>
                <span className={styles.recentWordStatus}>Mastered</span>
              </a>
            </li>
          ))
        ) : (
          <li>
            <span className={styles.recentWordName}>Nothing mastered yet — keep training.</span>
          </li>
        )}
      </ul>
    </Panel>
  );
}

/* ------------------------------- render ------------------------------- */

export function ProgressPage() {
  const { words } = useWords();
  const isEmpty = words.length === 0;

  const content = useMemo(() => {
    if (isEmpty) return null;
    return (
      <div className={styles.panels}>
        <h1 className="sr-only">Progress</h1>
        <StatusPanel words={words} />
        <ColorPanel words={words} />
        <MonthlyPanel words={words} />
        <RecentPanel words={words} />
      </div>
    );
  }, [words, isEmpty]);

  return (
    <main className={cx(styles.content, isEmpty && styles.contentEmpty)}>
      {isEmpty ? (
        <section className={styles.emptyScreen} aria-labelledby="empty-heading">
          <EmptyState
            icon="progress"
            heading="Nothing here yet"
            headingId="empty-heading"
            description="Nothing to show yet — but that’s the boring part, go fix it."
            actionHref={toHash('add-word')}
            actionLabel="Go catch some words"
            className={styles.emptyState}
          />
        </section>
      ) : (
        content
      )}
    </main>
  );
}
