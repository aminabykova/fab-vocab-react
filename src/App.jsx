/*
  App shell: hash route → page, shared chrome (mobile header + navigation),
  and the providers (words state, toast, chrome overrides).

  Every screen is a React component tree driven by state — no direct DOM
  access anywhere in the app.
*/

import { useEffect, useMemo, useState } from 'react';
import { useHashRoute } from './hooks/useHashRoute.js';
import { WordsProvider, useWords } from './context/WordsContext.jsx';
import { ChromeContext } from './context/ChromeContext.jsx';
import { ToastProvider, useToast } from './components/Toast.jsx';
import { MobileHeader } from './components/layout/MobileHeader.jsx';
import { PrimaryNavigation } from './components/layout/PrimaryNavigation.jsx';
import { HomePage } from './pages/home/HomePage.jsx';
import { DictionarySection } from './pages/dictionary/DictionarySection.jsx';
import { TrainingPage } from './pages/training/TrainingPage.jsx';
import { ProgressPage } from './pages/progress/ProgressPage.jsx';

const TITLES = {
  home: 'Home | FabVocab',
  dictionary: 'Dictionary | FabVocab',
  'add-word': 'New word | FabVocab',
  'edit-word': 'Edit word | FabVocab',
  'word-detail': 'Dictionary | FabVocab',
  training: 'Training | FabVocab',
  progress: 'Progress | FabVocab',
};

/** Route-derived default chrome; the Training quiz overrides it per phase. */
function defaultChrome(route) {
  switch (route.name) {
    case 'dictionary':
      return { title: 'Dictionary', inverted: false, hidden: false };
    case 'add-word':
      return { title: 'New word', inverted: false, hidden: false };
    case 'edit-word':
      return { title: 'Edit word', inverted: false, hidden: false };
    case 'word-detail':
      // The detail card takes over the whole mobile screen.
      return { title: '', inverted: false, hidden: true };
    case 'training':
      return { title: 'Quiz setup', inverted: false, hidden: false };
    case 'progress':
      return { title: 'Progress', inverted: false, hidden: false };
    default:
      return { title: null, inverted: false, hidden: false }; // brand on Home
  }
}

function Page({ route }) {
  switch (route.name) {
    case 'dictionary':
    case 'add-word':
    case 'word-detail':
    case 'edit-word':
      return <DictionarySection route={route} />;
    case 'training':
      return <TrainingPage />;
    case 'progress':
      return <ProgressPage />;
    default:
      return <HomePage />;
  }
}

/**
 * Surfaces failed localStorage writes (quota / blocked storage) as a toast,
 * wherever the change was made. The React equivalent of the original
 * store.saveOk checks after every action.
 */
function SaveStateReporter() {
  const { saveOk } = useWords();
  const { showToast } = useToast();
  useEffect(() => {
    if (!saveOk) showToast("Heads up — couldn't save. Your storage may be full.");
  }, [saveOk, showToast]);
  return null;
}

export default function App() {
  const { route } = useHashRoute();
  const [chrome, setChrome] = useState(() => defaultChrome(route));

  // Re-apply the route default whenever the screen changes; pages may then
  // refine it (Training sets the quiz-phase title and the hint inversion).
  useEffect(() => {
    setChrome(defaultChrome(route));
    document.title = TITLES[route.name] ?? TITLES.home;
  }, [route]);

  const chromeValue = useMemo(() => ({ chrome, setChrome }), [chrome]);

  return (
    <WordsProvider>
      <ToastProvider>
        <ChromeContext.Provider value={chromeValue}>
          <SaveStateReporter />
          <MobileHeader />
          <PrimaryNavigation route={route} />
          <Page route={route} />
        </ChromeContext.Provider>
      </ToastProvider>
    </WordsProvider>
  );
}
