/*
  Dictionary section — owns the four dictionary screens (list, add, detail,
  edit) the way dictionary.html did: one place, screens switched by the hash
  route. Filter/sort state lives here so it survives opening a word and
  coming back, and the delete confirmation dialog is shared by the detail
  and edit screens.
*/

import { useCallback, useEffect, useState } from 'react';
import { useWords } from '../../context/WordsContext.jsx';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { DictionaryList } from './DictionaryList.jsx';
import { WordFormPage } from './WordFormPage.jsx';
import { WordDetailPage } from './WordDetailPage.jsx';
import { DeleteDialog } from './DeleteDialog.jsx';

/** Unknown word id: bounce back to the list once, render nothing. */
function MissingWord() {
  const { navigate } = useHashRoute();
  useEffect(() => {
    navigate('dictionary');
  }, [navigate]);
  return null;
}

export function DictionarySection({ route }) {
  const { getWord, deleteWord } = useWords();
  const { navigate } = useHashRoute();

  // List state — kept mounted at section level so it survives navigation.
  const [query, setQuery] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  // Delete confirmation: the word id awaiting a decision, or null.
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const closeDeleteDialog = useCallback(() => setPendingDeleteId(null), []);

  const confirmDelete = useCallback(() => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    if (!id) return;
    deleteWord(id);
    navigate('dictionary');
  }, [pendingDeleteId, deleteWord, navigate]);

  // A stale dialog shouldn't survive navigation; Escape closes it.
  useEffect(() => {
    if (route.name !== 'word-detail' && route.name !== 'edit-word') setPendingDeleteId(null);
  }, [route]);

  useEffect(() => {
    if (pendingDeleteId == null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPendingDeleteId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingDeleteId]);

  let screen;
  if (route.name === 'add-word') {
    screen = <WordFormPage mode="add" />;
  } else if (route.name === 'edit-word' || route.name === 'word-detail') {
    const word = getWord(route.id);
    if (!word) {
      // Unknown or deleted id — fall back to the list.
      screen = <MissingWord />;
    } else if (route.name === 'edit-word') {
      screen = (
        <WordFormPage mode="edit" word={word} onDelete={() => setPendingDeleteId(word.id)} />
      );
    } else {
      screen = <WordDetailPage word={word} onDelete={() => setPendingDeleteId(word.id)} />;
    }
  } else {
    screen = (
      <DictionaryList
        query={query}
        setQuery={setQuery}
        colorFilter={colorFilter}
        setColorFilter={setColorFilter}
        posFilter={posFilter}
        setPosFilter={setPosFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sort={sort}
        setSort={setSort}
      />
    );
  }

  return (
    <main>
      {screen}
      {pendingDeleteId != null && (
        <DeleteDialog onConfirm={confirmDelete} onCancel={closeDeleteDialog} />
      )}
    </main>
  );
}
