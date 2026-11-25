/*
  Add / edit word form (one component, two modes).

  Fully controlled form: field values and validation errors live in
  useState. Owns the Clipboard integration — paste buttons read the system
  clipboard through lib/clipboard.js, and natively pasted text (Cmd+V) is
  cleaned through the same normaliser. Add mode resets after a successful
  submit; edit mode patches the word and returns to its detail card.
*/

import { useRef, useState } from 'react';
import { useWords } from '../../context/WordsContext.jsx';
import { useToast } from '../../components/Toast.jsx';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { PARTS_OF_SPEECH, FEEDBACK } from '../../lib/data.js';
import {
  readClipboardText,
  cleanPastedText,
  ClipboardError,
} from '../../lib/clipboard.js';
import { Icon } from '../../components/Icon.jsx';
import { Button } from '../../components/Button.jsx';
import { ColorPicker } from './ColorPicker.jsx';
import styles from './WordForm.module.css';
import { cx } from '../../lib/cx.js';

/** One specific message per failure cause — never a generic catch-all. */
const CLIPBOARD_MESSAGES = {
  denied: 'The browser said no to your clipboard. Paste it the old-fashioned way — that still works.',
  empty: 'Your clipboard is empty. Copy something first.',
  unsupported: "Clipboard access isn't available in this context — paste manually instead.",
  failed: "Couldn't read the clipboard. Try pasting manually.",
};

const EMPTY_VALUES = {
  word: '',
  pos: PARTS_OF_SPEECH[0],
  color: '',
  definition: '',
  translation: '',
  example: '',
};

export function WordFormPage({ mode, word = null, onDelete }) {
  const { addWord, updateWord, hasWord } = useWords();
  const { showToast } = useToast();
  const { navigate } = useHashRoute();

  const isEdit = mode === 'edit';

  const [values, setValues] = useState(() =>
    isEdit && word
      ? {
          word: word.word,
          pos: word.pos,
          color: word.color,
          definition: word.definition,
          translation: word.translation,
          example: '',
        }
      : EMPTY_VALUES,
  );
  const [errors, setErrors] = useState({});

  const wordRef = useRef(null);
  const definitionRef = useRef(null);
  const translationRef = useRef(null);
  const exampleRef = useRef(null);
  const colorRef = useRef(null);

  const setField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  /* ---------------------------- clipboard ---------------------------- */

  /** Async Clipboard API read → cleaned text in the target field. */
  const pasteInto = async (field, ref, multiline) => {
    try {
      const text = await readClipboardText();
      setField(field, cleanPastedText(text, { multiline }));
      ref.current?.focus();
    } catch (error) {
      const code = error instanceof ClipboardError ? error.code : 'failed';
      showToast(CLIPBOARD_MESSAGES[code] || CLIPBOARD_MESSAGES.failed);
    }
  };

  /**
   * Clean text that arrives via the *native* paste action (Cmd+V / context
   * menu) — the fallback for when the async Clipboard API is missing, and
   * an improvement for ordinary pastes everywhere.
   */
  const handlePaste = (field, multiline) => (event) => {
    const raw = event.clipboardData?.getData('text/plain');
    if (!raw) return;
    const clean = cleanPastedText(raw, { multiline });
    if (!clean || clean === raw) return; // nothing to improve — keep native undo
    event.preventDefault();

    const input = event.target;
    const from = input.selectionStart ?? input.value.length;
    const to = input.selectionEnd ?? input.value.length;
    const inserted = input.value.slice(0, from) + clean + input.value.slice(to);
    setField(field, inserted);

    // Restore the caret right after the inserted text once React commits.
    const caret = from + clean.length;
    requestAnimationFrame(() => input.setSelectionRange(caret, caret));
  };

  /* --------------------------- validation ---------------------------- */

  const validate = () => {
    const next = {};
    if (!values.word.trim()) {
      next.word = "This one's required.";
    } else if (hasWord(values.word, isEdit && word ? word.id : null)) {
      next.word = 'Slow down — this one already lives in your dictionary.';
    }
    if (!values.definition.trim()) next.definition = "This one's required.";
    if (!values.color) next.color = 'Pick a color — any color.';
    setErrors(next);
    return next;
  };

  const focusFirstError = (next) => {
    if (next.word) wordRef.current?.focus();
    else if (next.definition) definitionRef.current?.focus();
    else if (next.color) colorRef.current?.focus();
  };

  /* ----------------------------- submit ------------------------------ */

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) {
      focusFirstError(next);
      return;
    }

    if (isEdit && word) {
      const patch = {
        word: values.word.trim(),
        pos: values.pos,
        color: values.color,
        definition: values.definition.trim(),
        translation: values.translation.trim(),
      };
      const example = values.example.trim();
      if (example) patch.examples = [...word.examples, example];
      updateWord(word.id, patch);
      navigate('word-detail', word.id);
      return;
    }

    addWord(values);
    showToast(FEEDBACK.toastAdded[Math.floor(Math.random() * FEEDBACK.toastAdded.length)]);
    setValues(EMPTY_VALUES);
    setErrors({});
    wordRef.current?.focus();
  };

  /* ----------------------------- fields ------------------------------ */

  const pasteButton = (field, ref, multiline = false) => (
    <button
      className={cx(styles.pasteButton, multiline && styles.pasteButtonTall)}
      type="button"
      aria-label="Paste from clipboard"
      title="Paste from clipboard"
      onClick={() => pasteInto(field, ref, multiline)}
    >
      <Icon name="paste" size={18} />
    </button>
  );

  const idPrefix = isEdit ? 'edit' : 'add';

  return (
    <section className={styles.screen} aria-labelledby={`${idPrefix}-heading`}>
      <h1 className={styles.heading} id={`${idPrefix}-heading`}>
        {isEdit ? 'Edit word' : 'New word'}
      </h1>

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-text`}>Word *</label>
          <div className={styles.withPaste}>
            <input
              ref={wordRef}
              className={cx(styles.input, errors.word && styles.invalid)}
              id={`${idPrefix}-text`}
              name="word"
              placeholder={isEdit ? undefined : 'What is it?'}
              required
              value={values.word}
              aria-invalid={errors.word ? true : undefined}
              onChange={(event) => setField('word', event.target.value)}
              onPaste={handlePaste('word', false)}
            />
            {!isEdit && pasteButton('word', wordRef)}
          </div>
          {errors.word && <p className={styles.fieldError}>{errors.word}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-speech`}>Part of speech *</label>
          <select
            className={styles.select}
            id={`${idPrefix}-speech`}
            name="pos"
            required
            value={values.pos}
            onChange={(event) => setField('pos', event.target.value)}
          >
            {PARTS_OF_SPEECH.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        <fieldset className={styles.field}>
          <legend>Color *</legend>
          <ColorPicker
            name={`${idPrefix}-color`}
            value={values.color}
            onChange={(color) => setField('color', color)}
            error={Boolean(errors.color)}
            firstInputRef={colorRef}
          />
          {errors.color && <p className={styles.fieldError}>{errors.color}</p>}
        </fieldset>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-definition`}>Definition *</label>
          <div className={styles.withPaste}>
            <textarea
              ref={definitionRef}
              className={cx(styles.textarea, errors.definition && styles.invalid)}
              id={`${idPrefix}-definition`}
              name="definition"
              placeholder={isEdit ? undefined : 'What does it mean?'}
              required
              value={values.definition}
              aria-invalid={errors.definition ? true : undefined}
              onChange={(event) => setField('definition', event.target.value)}
              onPaste={handlePaste('definition', true)}
            />
            {!isEdit && pasteButton('definition', definitionRef, true)}
          </div>
          {errors.definition && <p className={styles.fieldError}>{errors.definition}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-translation`}>Translation</label>
          <div className={styles.withPaste}>
            <input
              ref={translationRef}
              className={styles.input}
              id={`${idPrefix}-translation`}
              name="translation"
              placeholder="What does it mean in your lang?"
              value={values.translation}
              onChange={(event) => setField('translation', event.target.value)}
              onPaste={handlePaste('translation', false)}
            />
            {!isEdit && pasteButton('translation', translationRef)}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-example`}>Example</label>
          <div className={styles.withPaste}>
            <input
              ref={exampleRef}
              className={styles.input}
              id={`${idPrefix}-example`}
              name="example"
              placeholder="Later is fine"
              value={values.example}
              onChange={(event) => setField('example', event.target.value)}
              onPaste={handlePaste('example', false)}
            />
            {!isEdit && pasteButton('example', exampleRef)}
          </div>
        </div>

        <div className={styles.actions}>
          {isEdit && (
            <Button variant="delete" onClick={onDelete}>
              Delete word
            </Button>
          )}
          <Button type="submit">{isEdit ? 'Save' : 'Lock it in'}</Button>
        </div>
      </form>
    </section>
  );
}
