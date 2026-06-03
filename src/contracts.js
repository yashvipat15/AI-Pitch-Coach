import PropTypes from 'prop-types';

export const SCORE_CATEGORY_KEYS = [
  'clarity',
  'confidence',
  'pacing',
  'structure',
  'engagement',
  'persuasiveness',
];

export const CATEGORY_LABELS = {
  clarity: 'Clarity',
  confidence: 'Confidence',
  pacing: 'Pacing',
  structure: 'Structure',
  engagement: 'Engagement',
  persuasiveness: 'Persuasiveness',
};

export const TranscriptSegmentShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  startSec: PropTypes.number.isRequired,
  endSec: PropTypes.number.isRequired,
});

export const TranscriptShape = PropTypes.shape({
  text: PropTypes.string.isRequired,
  segments: PropTypes.arrayOf(TranscriptSegmentShape).isRequired,
  finalizedAt: PropTypes.string,
});

export const ScoreCategoryShape = PropTypes.shape({
  key: PropTypes.oneOf(SCORE_CATEGORY_KEYS).isRequired,
  label: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
  rationale: PropTypes.string.isRequired,
});

export const ScoreReportShape = PropTypes.shape({
  overall: PropTypes.number.isRequired,
  categories: PropTypes.arrayOf(ScoreCategoryShape).isRequired,
  strengths: PropTypes.arrayOf(PropTypes.string).isRequired,
  improvements: PropTypes.arrayOf(PropTypes.string).isRequired,
  generatedAt: PropTypes.string.isRequired,
});

export const PHASES = Object.freeze({
  IDLE: 'idle',
  RECORDING: 'recording',
  TRANSCRIBING: 'transcribing',
  SCORING: 'scoring',
  COMPLETE: 'complete',
  ERROR: 'error',
});

export const PhaseShape = PropTypes.oneOf(Object.values(PHASES));

export function isValidScore(value) {
  return typeof value === 'number' && value >= 0 && value <= 10;
}

export function clampScore(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 10) return 10;
  return value;
}
