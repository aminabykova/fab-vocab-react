/*
  Dictionary list: search, color / part-of-speech / status filters, a
  sortable table (cards on mobile, tabular on desktop) and the no-results
  note. Filter and sort state are controlled by DictionarySection so they
  survive opening a word and coming back.
*/

import { useMemo } from 'react';
import { useWords } from '../../context/WordsContext.jsx';
import { isDusty, statusLabel, colorLabel, formatShortDate } from '../../lib/model.js';
import { PARTS_OF_SPEECH, STATUS } from '../../lib/data.js';
import { toHash } from '../../hooks/useHashRoute.js';
import { Icon } from '../../components/Icon.jsx';
import { ColorPicker } from './ColorPicker.jsx';
import colors from '../../styles/colors.module.css';
import styles from './DictionaryList.module.css';
import { cx } from '../../lib/cx.js';

const POS_CHIP_LABELS = {
  noun: 'noun',
  verb: 'verb',
  adjective: 'adj',
  adverb: 'adv',
  idiom: 'idiom',
  expression: 'expression',
};

const STATUS_FILTERS = ['new', 'learning', 'mastered', 'dusty'];

const SORT_COLUMNS = [
  { key: 'word', label: 'Word' },
  { key: 'pos', label: 'Part of speech' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Last practiced' },
];

function sortWords(list, key, dir) {
  const factor = dir === 'asc' ? 1 : -1;
  const valueOf = (word) => {
    switch (key) {
      case 'word': return word.word.toLowerCase();
      case 'pos': return word.pos;
      case 'status': return [STATUS.NEW, STATUS.LEARNING, STATUS.MASTERED].indexOf(word.status);
      case 'date': return word.lastPracticed ? Date.parse(word.lastPracticed) : 0;
      default: return 0;
    }
  };
  return [...list].sort((a, b) => {
    const av = valueOf(a);
    const bv = valueOf(b);
    if (av < bv) return -factor;
    if (av > bv) return factor;
    return 0;
  });
}

/** A filter chip radio; a second click on the selected chip clears it. */
function Chip({ name, value, label, checked, onSelect }) {
  return (
    <label>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        onClick={() => {
          if (checked) onSelect('');
        }}
      />
      {label}
    </label>
  );
}

function StatusCell({ word }) {
  if (isDusty(word)) {
    return (
      <td className={styles.cellStatus}>
        <span className={cx(styles.statusBadge, styles.statusDusty)}>dusty</span>
      </td>
    );
  }
  if (word.status === STATUS.MASTERED) {
    return (
      <td className={styles.cellStatus}>
        <span className={cx(styles.statusBadge, styles.statusMastered)}>mastered</span>
      </td>
    );
  }
  return <td className={styles.cellStatus}>{statusLabel(word)}</td>;
}

function WordRow({ word }) {
  return (
    <tr className={styles.row}>
      <td className={styles.cellColor}>
        <span
          className={cx(styles.dot, colors[word.color], word.color === 'white' && styles.dotWhite)}
          aria-label={colorLabel(word.color)}
        />
      </td>
      <th className={styles.cellTitle} scope="row">
        <a className={styles.wordLink} href={toHash('word-detail', word.id)}>
          {word.word}
        </a>
      </th>
      <td className={styles.cellPos}>{word.pos}</td>
      <StatusCell word={word} />
      {word.lastPracticed ? (
        <td className={styles.cellDate}>
          <time dateTime={word.lastPracticed}>{formatShortDate(word.lastPracticed)}</time>
        </td>
      ) : (
        <td className={styles.cellDate} aria-label="Not yet practiced">—</td>
      )}
    </tr>
  );
}

export function DictionaryList({
  query,
  setQuery,
  colorFilter,
  setColorFilter,
  posFilter,
  setPosFilter,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
}) {
  const { words } = useWords();

  const rows = useMemo(() => {
    let list = words;

    const needle = query.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (word) =>
          word.word.toLowerCase().includes(needle) ||
          word.definition.toLowerCase().includes(needle) ||
          word.translation.toLowerCase().includes(needle),
      );
    }

    if (colorFilter) list = list.filter((word) => word.color === colorFilter);
    if (posFilter) list = list.filter((word) => word.pos === posFilter);
    if (statusFilter) {
      list = list.filter((word) =>
        statusFilter === 'dusty' ? isDusty(word) : word.status === statusFilter,
      );
    }

    if (sort.key) list = sortWords(list, sort.key, sort.dir);
    return list;
  }, [words, query, colorFilter, posFilter, statusFilter, sort]);

  const toggleSort = (key) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
  };

  const resetFilters = () => {
    setQuery('');
    setColorFilter('');
    setPosFilter('');
    setStatusFilter('');
  };

  return (
    <section className={styles.screen} aria-labelledby="dictionary-heading">
      <h1 className="sr-only" id="dictionary-heading">Dictionary</h1>

      <div className={styles.search}>
        <Icon name="search" size={16} />
        <label className="sr-only" htmlFor="word-search">Search your words</label>
        <input
          id="word-search"
          type="search"
          placeholder="Search your words..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <form className={styles.filters} onSubmit={(event) => event.preventDefault()}>
        <div className={styles.filterColors}>
          <span className={styles.filterLabel}>Filter:</span>

          <fieldset>
            <legend className="sr-only">Filter by color</legend>
            <ColorPicker name="filter-color" value={colorFilter} onChange={setColorFilter} />
          </fieldset>
        </div>

        <fieldset className={styles.chips}>
          <legend className="sr-only">Part of speech filter</legend>
          {PARTS_OF_SPEECH.map((pos) => (
            <Chip
              key={pos}
              name="speech-filter"
              value={pos}
              label={POS_CHIP_LABELS[pos]}
              checked={posFilter === pos}
              onSelect={setPosFilter}
            />
          ))}
        </fieldset>

        <fieldset className={styles.chips}>
          <legend className="sr-only">Learning status filter</legend>
          {STATUS_FILTERS.map((status) => (
            <Chip
              key={status}
              name="status-filter"
              value={status}
              label={status}
              checked={statusFilter === status}
              onSelect={setStatusFilter}
            />
          ))}
        </fieldset>

        <button className={styles.reset} type="button" onClick={resetFilters}>
          Reset
        </button>
      </form>

      <table className={styles.table}>
        <caption className="sr-only">Saved words</caption>
        <thead>
          <tr>
            <th scope="col">Color</th>
            {SORT_COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={
                  sort.key === column.key
                    ? sort.dir === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
              >
                <button
                  className={styles.sortButton}
                  type="button"
                  onClick={() => toggleSort(column.key)}
                >
                  {column.label}
                  <Icon name="caret" size={12} />
                </button>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((word) => (
            <WordRow key={word.id} word={word} />
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className={styles.emptyNote}>
          <span className={styles.emptyIcon}>
            <Icon name="search" size={28} />
          </span>
          <h2>Nope, nothing here.</h2>
          <p>Did you make that word up?</p>
        </div>
      )}
    </section>
  );
}
