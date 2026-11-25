/*
  Training page — owns the quiz session and switches the three screens
  (setup → question → results) as phases of one state machine, the React
  edition of training.js. The session lives in useState; grading answers
  goes through the words context so streaks and statuses persist.
*/

import { useEffect, useState } from 'react';
import { useWords } from '../../context/WordsContext.jsx';
import { useChrome } from '../../context/ChromeContext.jsx';
import { buildQuestions } from '../../lib/quiz.js';
import { MIN_WORDS_TO_TRAIN } from '../../lib/data.js';
import { QuizSetup } from './QuizSetup.jsx';
import { QuizQuestion } from './QuizQuestion.jsx';
import { QuizResults } from './QuizResults.jsx';
import colors from '../../styles/colors.module.css';
import styles from './Training.module.css';
import { cx } from '../../lib/cx.js';

const PHASE_TITLES = {
  setup: 'Quiz setup',
  question: 'Quiz',
  results: 'Training complete',
};

export function TrainingPage() {
  const { words, recordAnswer } = useWords();
  const { setChrome } = useChrome();

  const [phase, setPhase] = useState('setup');
  /** @type {[null | object, Function]} the live quiz session */
  const [session, setSession] = useState(null);

  const question = session ? session.questions[session.index] : null;
  // The color hint recolors the whole screen — only while it is shown.
  const hintColor =
    phase === 'question' && session?.hintUsed && !session.answered ? question.color : null;

  // Mobile chrome: per-phase title, inverted to white on the black hint.
  useEffect(() => {
    setChrome({ title: PHASE_TITLES[phase], inverted: hintColor === 'black', hidden: false });
  }, [phase, hintColor, setChrome]);

  const startQuiz = ({ direction, mode, count }) => {
    if (words.length < MIN_WORDS_TO_TRAIN) return;
    const questions = buildQuestions({ words, direction, mode, count });
    if (questions.length === 0) return;

    setSession({
      direction,
      mode,
      questions,
      index: 0,
      correctCount: 0,
      answered: false,
      selectedIndex: null,
      hintUsed: false,
      lastCorrect: false,
      feedback: '',
      transitions: { mastered: [], demoted: [], dusted: [] },
    });
    setPhase('question');
  };

  /** Apply a partial update to the live session. */
  const updateSession = (patch) => {
    setSession((current) => ({ ...current, ...patch }));
  };

  const showHint = () => {
    if (!session || session.answered) return;
    updateSession({ hintUsed: true });
  };

  const selectOption = (index) => {
    if (!session || session.answered) return;
    updateSession({ selectedIndex: index });
  };

  const checkAnswer = (feedback) => {
    if (!session || session.answered || session.selectedIndex == null) return;
    const current = session.questions[session.index];
    const correct = Boolean(current.options[session.selectedIndex]?.correct);

    const { transition } = recordAnswer(current.wordId, correct);

    setSession((previous) => {
      const transitions = { ...previous.transitions };
      if (transition === 'mastered') transitions.mastered = [...transitions.mastered, current.word];
      else if (transition === 'demoted') transitions.demoted = [...transitions.demoted, current.word];
      else if (transition === 'dusted') transitions.dusted = [...transitions.dusted, current.word];
      return {
        ...previous,
        answered: true,
        lastCorrect: correct,
        correctCount: previous.correctCount + (correct ? 1 : 0),
        feedback,
        transitions,
      };
    });
  };

  const nextQuestion = () => {
    if (!session) return;
    if (session.index >= session.questions.length - 1) {
      setPhase('results');
      return;
    }
    updateSession({
      index: session.index + 1,
      answered: false,
      selectedIndex: null,
      hintUsed: false,
      lastCorrect: false,
      feedback: '',
    });
  };

  const restart = () => {
    setSession(null);
    setPhase('setup');
  };

  return (
    <main className={styles.content}>
      {hintColor && <div className={cx(styles.hintBackdrop, colors[hintColor])} aria-hidden="true" />}

      {phase === 'setup' && <QuizSetup words={words} onStart={startQuiz} />}

      {phase === 'question' && session && (
        <QuizQuestion
          session={session}
          dark={hintColor === 'black'}
          onSelect={selectOption}
          onHint={showHint}
          onCheck={checkAnswer}
          onNext={nextQuestion}
        />
      )}

      {phase === 'results' && session && (
        <QuizResults session={session} onRestart={restart} />
      )}
    </main>
  );
}
