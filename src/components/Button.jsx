/*
  The app's single button look. Renders an <a> when `href` is given (hash
  navigation) or a <button> otherwise; variants map to the original
  button-primary / button-secondary / button-danger / button-delete styles.
*/

import styles from './Button.module.css';
import { cx } from '../lib/cx.js';

export function Button({
  variant = 'primary',
  compact = false,
  href,
  className = '',
  children,
  ...rest
}) {
  const classes = cx(
    styles.button,
    styles[variant],
    compact && styles.compact,
    className,
  );

  if (href != null) {
    return (
      <a className={classes} href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} type="button" {...rest}>
      {children}
    </button>
  );
}
