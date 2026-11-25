/*
  The eight-color swatch radio group, shared by the dictionary filters and
  the add/edit word forms. Controlled: `value` is the selected color id (or
  ''), `onChange` receives the new id (or '' when the user toggles the
  selected swatch off — second click clears, same as the original).
*/

import { COLORS } from '../../lib/data.js';
import colors from '../../styles/colors.module.css';
import styles from './ColorPicker.module.css';
import { cx } from '../../lib/cx.js';

export function ColorPicker({ name, value, onChange, error = false, firstInputRef }) {
  const handleClick = (colorId) => {
    // A second click on the selected swatch clears the selection.
    if (value === colorId) onChange('');
  };

  return (
    <div className={cx(styles.picker, error && styles.error)}>
      {COLORS.map((color, index) => (
        <label
          key={color.id}
          className={cx(styles.option, colors[color.id], color.id === 'white' && styles.optionWhite)}
        >
          <input
            type="radio"
            name={name}
            value={color.id}
            checked={value === color.id}
            aria-label={color.label}
            ref={index === 0 ? firstInputRef : undefined}
            onChange={() => onChange(color.id)}
            onClick={() => handleClick(color.id)}
          />
        </label>
      ))}
    </div>
  );
}
