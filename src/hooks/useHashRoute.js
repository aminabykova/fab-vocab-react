/*
  Minimal hash router as a hook.

  The single-page React app keeps the original hash-based navigation (works
  on any static host, no server rewrites): `#/dictionary`, `#/word/<id>`,
  `#/training`… `useHashRoute` parses the hash into a route object and
  re-renders on hashchange; `toHash` builds link targets. Malformed hashes
  resolve to home instead of throwing.
*/

import { useCallback, useEffect, useState } from 'react';

/** Parse `#/screen/param(/edit)` into a route object, decoding defensively. */
export function parseRoute(hash) {
  const raw = (hash || '').replace(/^#\/?/, '');
  if (!raw) return { name: 'home' };

  const parts = raw.split('/');
  let screen = parts[0] || '';
  let param = '';
  try {
    param = parts[1] ? decodeURIComponent(parts[1]) : '';
  } catch {
    param = ''; // malformed percent-encoding — ignore the param
  }

  switch (screen) {
    case 'dictionary':
      return { name: 'dictionary' };
    case 'add-word':
      return { name: 'add-word' };
    case 'word':
      if (!param) return { name: 'dictionary' };
      return parts[2] === 'edit'
        ? { name: 'edit-word', id: param }
        : { name: 'word-detail', id: param };
    case 'training':
      return { name: 'training' };
    case 'progress':
      return { name: 'progress' };
    default:
      return { name: 'home' };
  }
}

/** Build a hash link for a route. */
export function toHash(name, id = '') {
  switch (name) {
    case 'home': return '#/';
    case 'dictionary': return '#/dictionary';
    case 'add-word': return '#/add-word';
    case 'word-detail': return `#/word/${encodeURIComponent(id)}`;
    case 'edit-word': return `#/word/${encodeURIComponent(id)}/edit`;
    case 'training': return '#/training';
    case 'progress': return '#/progress';
    default: return '#/';
  }
}

function readRoute() {
  return parseRoute(window.location.hash);
}

/** The current route, kept in sync with the address bar hash. */
export function useHashRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((name, id = '') => {
    window.location.hash = toHash(name, id);
  }, []);

  return { route, navigate };
}
