/*
  Primary navigation: bottom bar on mobile, top bar on desktop. The current
  destination is derived from the route, not from which HTML file loaded.
*/

import { Icon } from '../Icon.jsx';
import { toHash } from '../../hooks/useHashRoute.js';
import styles from './PrimaryNavigation.module.css';
import { cx } from '../../lib/cx.js';

const DESTINATIONS = [
  { key: 'home', icon: 'home', label: 'Home', hash: toHash('home') },
  { key: 'dictionary', icon: 'dictionary', label: 'Dictionary', hash: toHash('dictionary') },
  { key: 'training', icon: 'training', label: 'Training', hash: toHash('training') },
  { key: 'progress', icon: 'progress', label: 'Progress', hash: toHash('progress') },
];

/** The nav destination a route belongs to. */
function sectionOf(routeName) {
  if (routeName === 'add-word' || routeName === 'word-detail' || routeName === 'edit-word') {
    return 'dictionary';
  }
  return routeName;
}

export function PrimaryNavigation({ route }) {
  const current = sectionOf(route.name);

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <a className={styles.brand} href={toHash('home')}>FabVocab.</a>

      <div className={styles.destinations}>
        {DESTINATIONS.map((destination) => (
          <a
            key={destination.key}
            className={cx(styles.item, current === destination.key && styles.current)}
            href={destination.hash}
            aria-current={current === destination.key ? 'page' : undefined}
          >
            <Icon name={destination.icon} />
            <span>{destination.label}</span>
          </a>
        ))}
      </div>

      <a className={styles.add} href={toHash('add-word')} aria-label="Add a word">
        <Icon name="plus" className={styles.addIcon} />
        <span className={styles.addLabel}>+ Add word</span>
      </a>
    </nav>
  );
}
