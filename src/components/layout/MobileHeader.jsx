/*
  Mobile-only header: the current screen's title (or the brand on Home) and
  the profile avatar. Title/inversion come from the chrome context — e.g.
  the Training quiz flips it to white on the black color hint.
*/

import { useChrome } from '../../context/ChromeContext.jsx';
import { toHash } from '../../hooks/useHashRoute.js';
import styles from './MobileHeader.module.css';
import { cx } from '../../lib/cx.js';

export function MobileHeader() {
  const { chrome } = useChrome();

  return (
    <header className={cx(styles.header, chrome.hidden && styles.hidden)}>
      {chrome.title == null ? (
        <a className={cx(styles.brand, chrome.inverted && styles.inverted)} href={toHash('home')}>
          FabVocab.
        </a>
      ) : (
        <p className={cx(styles.title, chrome.inverted && styles.inverted)}>{chrome.title}</p>
      )}
      <span className={styles.avatar}>AB</span>
    </header>
  );
}
