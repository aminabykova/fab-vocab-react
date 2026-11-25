/*
  Delete confirmation dialog ("Sure?"). Rendered by DictionarySection only
  while a deletion is pending — conditional rendering replaces the original
  hidden/is-open class toggling. Escape handling lives in the section.
*/

import { Button } from '../../components/Button.jsx';
import styles from './DeleteDialog.module.css';

export function DeleteDialog({ onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-heading"
        aria-describedby="delete-description"
      >
        <h2 id="delete-heading">Sure?</h2>
        <p id="delete-description">It's been through a lot with you.</p>
        <Button variant="danger" autoFocus onClick={onConfirm}>
          Delete
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Keep it
        </Button>
      </div>
    </div>
  );
}
