/*
  Chrome (mobile header) state shared between the app shell and pages.

  The mobile header title depends on the route, and the Training quiz can
  invert the chrome to white when the black color hint fills the screen.
  Pages declare their chrome through `setChrome` in an effect; App applies
  a route-derived default. Replaces the original direct DOM class toggles
  (`body.screen-detail`, `body.hint-dark`) with explicit React state.
*/

import { createContext, useContext } from 'react';

export const ChromeContext = createContext(null);

export function useChrome() {
  return useContext(ChromeContext);
}
