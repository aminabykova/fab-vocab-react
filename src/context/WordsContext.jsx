/*
  FabVocab — words state container (the React edition of store.js).

  A single source of truth for the dictionary, provided via context. The
  provider owns the `words` array in useState, exposes intent-named actions
  that update it, persists to localStorage after every change (useEffect),
  and syncs across tabs through the `storage` event. Unidirectional flow:
  event → action → state → re-render.
*/

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SEED_WORDS, STORAGE_KEY } from '../lib/data.js';
import { loadWords, saveWords } from '../lib/storage.js';
import { createWord, applyAnswer } from '../lib/model.js';

const WordsContext = createContext(null);

function initialWords() {
  const loaded = loadWords();
  // Fall back to a deep copy of the seed on first run.
  return loaded ?? SEED_WORDS.map((word) => ({ ...word, examples: [...word.examples] }));
}

export function WordsProvider({ children }) {
  const [words, setWords] = useState(initialWords);
  // Did the last write to storage succeed? The UI can surface failures.
  const [saveOk, setSaveOk] = useState(true);
  // Skip persisting when the change came from another tab's storage event.
  const fromStorageEvent = useRef(false);

  // Persist after every change.
  useEffect(() => {
    if (fromStorageEvent.current) {
      fromStorageEvent.current = false;
      return;
    }
    setSaveOk(saveWords(words));
  }, [words]);

  // Another tab may write to the same storage key. The `storage` event
  // fires in every tab except the one that made the change, so reloading
  // here merges the other tab's writes without ping-ponging.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      const reloaded = loadWords();
      fromStorageEvent.current = true;
      setWords(reloaded ?? []);
      setSaveOk(true);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /* ----------------------------- actions ----------------------------- */

  /** Add a new word built from raw form values. @returns the created word. */
  const addWord = useCallback((values) => {
    const word = createWord(values);
    setWords((current) => [word, ...current]);
    return word;
  }, []);

  /** Patch an existing word by id with the given fields. */
  const updateWord = useCallback((id, patch) => {
    setWords((current) =>
      current.map((word) => (word.id === id ? { ...word, ...patch } : word)),
    );
  }, []);

  /** Remove a word by id. */
  const deleteWord = useCallback((id) => {
    setWords((current) => current.filter((word) => word.id !== id));
  }, []);

  /** Append an example to a word (used on the detail screen). */
  const addExample = useCallback((id, text) => {
    const clean = text.trim();
    if (!clean) return;
    setWords((current) =>
      current.map((word) =>
        word.id === id ? { ...word, examples: [...word.examples, clean] } : word,
      ),
    );
  }, []);

  /** Record a quiz answer, updating streak/status/stats via the model. */
  const recordAnswer = useCallback((id, isCorrect) => {
    const word = words.find((entry) => entry.id === id);
    if (!word) return { transition: 'none' };
    const { word: next, transition } = applyAnswer(word, isCorrect);
    setWords((current) => current.map((entry) => (entry.id === id ? next : entry)));
    return { transition };
  }, [words]);

  /* ----------------------------- selectors ---------------------------- */

  /** Find a single word by id (or null). */
  const getWord = useCallback(
    (id) => words.find((word) => word.id === id) ?? null,
    [words],
  );

  /** True when a word already exists with this spelling (case-insensitive). */
  const hasWord = useCallback(
    (spelling, exceptId = null) => {
      const needle = spelling.trim().toLowerCase();
      return words.some((word) => word.id !== exceptId && word.word.toLowerCase() === needle);
    },
    [words],
  );

  const value = {
    words,
    saveOk,
    addWord,
    updateWord,
    deleteWord,
    addExample,
    recordAnswer,
    getWord,
    hasWord,
  };

  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
}

export function useWords() {
  return useContext(WordsContext);
}
