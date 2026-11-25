/*
  Word detail screen: the color word card, definition / translation /
  examples / practice cards, and the toolbar (back, copy, edit, delete).
  The Copy button writes "word — definition" (+ translation) to the system
  clipboard through the Clipboard API; failures get a specific toast.
*/

import { useState } from 'react';
import { useWords } from '../../context/WordsContext.jsx';
import { useToast } from '../../components/Toast.jsx';
import { toHash } from '../../hooks/useHashRoute.js';
import {
  isDusty,
  successRate,
  formatLongDate,
} from '../../lib/model.js';
import { MASTERY_STREAK } from '../../lib/data.js';
import { writeClipboardText, ClipboardError } from '../../lib/clipboard.js';
import { Icon } from '../../components/Icon.jsx';
import { Button } from '../../components/Button.jsx';
import colors from '../../styles/colors.module.css';
import styles from './WordDetail.module.css';
import { cx } from '../../lib/cx.js';

/** Colors that need light text on the detail card. */
const DARK_CARD_COLORS = new Set(['gray', 'black', 'red', 'green', 'blue']);

/** `word — definition` (+ translation), ready to paste into Anki or a chat. */
function copyTextFor(word) {
  const lines = [`${word.word} — ${word.definition}`];
  if (word.translation) lines.push(word.translation);
  return lines.join('\n');
}

function InfoCard({ heading, className = '', children }) {
  return (
    <section className={cx(styles.infoCard, className)}>
      <h2>{heading}</h2>
      {children}
    </section>
  );
}

function ExamplesCard({ word }) {
  const { addExample } = useWords();
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    addExample(word.id, draft);
    setDraft('');
  };

  return (
    <InfoCard heading="Examples" className={styles.examplesCard}>
      {word.examples.length > 0 ? (
        word.examples.map((example) => <p key={example}>{example}</p>)
      ) : (
        <p className={styles.ghost}>No examples yet — add one below.</p>
      )}
      <div className={styles.exampleField}>
        <input
          placeholder="Add another example"
          aria-label="Add another example"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button type="button" aria-label="Add example" onClick={submit}>
          <Icon name="plus" />
        </button>
      </div>
    </InfoCard>
  );
}

function PracticeCard({ word }) {
  const earned = Math.min(word.streak, MASTERY_STREAK);
  const headingWord = isDusty(word)
    ? 'Dusty'
    : word.status.charAt(0).toUpperCase() + word.status.slice(1);

  return (
    <InfoCard heading="Practice progress" className={styles.practiceCard}>
      <div className={styles.practiceHeading}>
        <strong>{headingWord}</strong>
        <span>{earned} / {MASTERY_STREAK} Points</span>
      </div>
      <div className={styles.practiceBars} aria-hidden="true">
        {Array.from({ length: MASTERY_STREAK }, (_, index) => (
          <span key={index} className={index < earned ? styles.earned : ''} />
        ))}
      </div>
      <dl className={styles.practiceStats}>
        <div>
          <dt>Times practiced</dt>
          <dd>{word.timesPracticed}</dd>
        </div>
        <div>
          <dt>Success rate</dt>
          <dd>{successRate(word)}%</dd>
        </div>
      </dl>
    </InfoCard>
  );
}

export function WordDetailPage({ word, onDelete }) {
  const { showToast } = useToast();

  /** Async Clipboard API write; one specific toast per failure cause. */
  const copyWord = async () => {
    try {
      await writeClipboardText(copyTextFor(word));
      showToast('Copied. Go paste it somewhere.');
    } catch (error) {
      const code = error instanceof ClipboardError ? error.code : 'failed';
      showToast(
        code === 'denied' || code === 'unsupported'
          ? "Couldn't copy — your browser blocked it. Select the text and copy manually."
          : "Couldn't copy. Try selecting the text and copying manually.",
      );
    }
  };

  const dark = DARK_CARD_COLORS.has(word.color);

  return (
    <section className={styles.screen} aria-labelledby="detail-heading">
      <div className={styles.controls}>
        <Button variant="secondary" compact href={toHash('dictionary')}>
          <Icon name="chevron" size={14} className={styles.backIcon} />
          Back
        </Button>
        <Button variant="secondary" compact onClick={copyWord}>
          <Icon name="copy" size={14} />
          Copy
        </Button>
        <Button
          variant="secondary"
          compact
          className={styles.editLink}
          href={toHash('edit-word', word.id)}
        >
          Edit word
        </Button>
        <Button
          variant="secondary"
          compact
          className={styles.deleteButton}
          aria-label="Delete word"
          onClick={onDelete}
        >
          <Icon name="trash" size={16} />
        </Button>
      </div>

      <div className={styles.layout}>
        <header className={cx(styles.card, colors[word.color], dark && styles.cardDark)}>
          <h1 id="detail-heading">{word.word}</h1>
          <div className={styles.cardMeta}>
            <span className={styles.speechBadge}>{word.pos}</span>
            <time dateTime={word.dateAdded}>Added {formatLongDate(word.dateAdded)}</time>
          </div>
        </header>

        <div className={styles.information}>
          <InfoCard heading="Definition">
            <p>{word.definition}</p>
          </InfoCard>

          <InfoCard heading="Translation">
            {word.translation ? (
              <p lang="ru">{word.translation}</p>
            ) : (
              <p className={styles.ghost}>No translation yet.</p>
            )}
          </InfoCard>

          <ExamplesCard word={word} />
          <PracticeCard word={word} />
        </div>
      </div>
    </section>
  );
}
