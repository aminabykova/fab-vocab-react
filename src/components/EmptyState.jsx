/*
  Shared "nothing here yet" screen used by Home and Progress: illustration,
  heading, description and one primary action.
*/

import { Icon } from './Icon.jsx';
import { Button } from './Button.jsx';
import styles from './EmptyState.module.css';
import { cx } from '../lib/cx.js';

export function EmptyState({ icon, heading, description, actionHref, actionLabel, headingId, className = '' }) {
  return (
    <div className={cx(styles.state, className)}>
      <div className={styles.message}>
        <span className={styles.illustration} aria-hidden="true">
          <Icon name={icon} size={32} />
        </span>

        <h1 className={styles.heading} id={headingId}>{heading}</h1>

        <p className={styles.description}>{description}</p>
      </div>

      <Button className={styles.action} href={actionHref}>
        {actionLabel}
      </Button>
    </div>
  );
}
