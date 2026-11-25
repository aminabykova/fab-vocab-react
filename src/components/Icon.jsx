/*
  Shared icon components. Each icon is a small inline SVG (ported from the
  original <symbol> sprite, paths unchanged), so no sprite mounting or DOM
  lookup is needed. <Icon name="…"> picks one by name.
*/

import styles from './Icon.module.css';
import { cx } from '../lib/cx.js';

const ICONS = {
  home: {
    viewBox: '0 0 24 24',
    content: <path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z" />,
  },
  dictionary: {
    viewBox: '0 0 24 24',
    content: <path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z" />,
  },
  training: {
    viewBox: '0 0 24 24',
    content: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
  },
  progress: {
    viewBox: '0 0 24 24',
    content: <path d="m2 17 7-7 5 5 8-9 M16 6h6v6" />,
  },
  plus: {
    viewBox: '0 0 24 24',
    content: <path d="M12 5v14M5 12h14" />,
  },
  eye: {
    viewBox: '0 0 24 24',
    content: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  search: {
    viewBox: '0 0 24 24',
    content: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
  },
  chevron: {
    viewBox: '0 0 24 24',
    content: <path d="m9 5 7 7-7 7" />,
  },
  caret: {
    viewBox: '0 0 24 24',
    content: <path d="m6 9 6 6 6-6" />,
  },
  trash: {
    viewBox: '0 0 24 24',
    content: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />,
  },
  paste: {
    viewBox: '0 0 24 24',
    content: <path d="M9 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3M9 3h6v4H9V3z" />,
  },
  copy: {
    viewBox: '0 0 24 24',
    content: <path d="M6 15.5H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9.5a1 1 0 0 1 1 1v1m-6 14H19a1 1 0 0 0 1-1V9.5a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1Z" />,
  },
};

/** Inline icon. `size` overrides the default token size when given. */
export function Icon({ name, size, className = '' }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg
      className={cx(styles.icon, className)}
      viewBox={icon.viewBox}
      aria-hidden="true"
      width={size}
      height={size}
    >
      {icon.content}
    </svg>
  );
}
