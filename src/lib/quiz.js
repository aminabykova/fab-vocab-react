/*
  FabVocab — quiz engine (pure functions).

  Builds a quiz session from the dictionary: target selection biased toward
  words that need work, distractor picking (regular mode mixes colors, hard
  mode sticks to the target's color), and answer option shuffling. No state,
  no DOM — the Training components project a session object built here.
*/

import { isDusty, colorCounts } from './model.js';
import { STATUS, QUESTION_OPTIONS, HARD_MODE_MIN_PER_COLOR } from './data.js';

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Words usable as question targets (hard mode needs 4 of their color). */
function eligibleTargets(words, mode) {
  if (mode !== 'hard') return words;
  const counts = colorCounts(words);
  return words.filter((word) => counts[word.color] >= HARD_MODE_MIN_PER_COLOR);
}

/** Pick up to `count` distinct targets, biased toward words needing work. */
function pickTargets(words, count, mode) {
  const eligible = eligibleTargets(words, mode);
  const weighted = [];
  for (const word of eligible) {
    let weight = 1;
    if (isDusty(word)) weight = 3;
    else if (word.status !== STATUS.MASTERED) weight = 2;
    for (let i = 0; i < weight; i += 1) weighted.push(word);
  }

  const chosen = [];
  const seen = new Set();
  for (const word of shuffle(weighted)) {
    if (chosen.length >= count) break;
    if (seen.has(word.id)) continue;
    seen.add(word.id);
    chosen.push(word);
  }
  return chosen;
}

/** Build one question with a correct answer and up to three distractors. */
function buildQuestion(target, words, direction, mode) {
  const answerOf = (word) => (direction === 'word' ? word.definition : word.word);
  const correctText = answerOf(target);
  const used = new Set([correctText]);

  const sameColor = shuffle(words.filter((w) => w.id !== target.id && w.color === target.color));
  const others = shuffle(words.filter((w) => w.id !== target.id && w.color !== target.color));
  const order = mode === 'hard' ? [...sameColor, ...others] : shuffle([...sameColor, ...others]);

  const distractors = [];
  for (const word of order) {
    if (distractors.length >= QUESTION_OPTIONS - 1) break;
    const text = answerOf(word);
    if (used.has(text)) continue;
    used.add(text);
    distractors.push(text);
  }

  const options = shuffle([
    { text: correctText, correct: true },
    ...distractors.map((text) => ({ text, correct: false })),
  ]);

  return {
    wordId: target.id,
    word: target.word,
    color: target.color,
    pos: target.pos,
    prompt: direction === 'word' ? target.word : target.definition,
    options,
  };
}

/**
 * Build the question list for a session.
 * @param {object} settings
 * @param {Array} settings.words the current dictionary
 * @param {'word'|'definition'} settings.direction
 * @param {'regular'|'hard'} settings.mode
 * @param {number} settings.count requested number of questions
 */
export function buildQuestions({ words, direction, mode, count }) {
  return pickTargets(words, count, mode)
    .map((target) => buildQuestion(target, words, direction, mode))
    .filter((question) => question.options.length >= 2);
}
