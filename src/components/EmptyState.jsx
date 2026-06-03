import PropTypes from 'prop-types';
import { PHASES, PhaseShape } from '../contracts.js';
import './EmptyState.css';

function copyFor(phase, hasTranscript) {
  if (phase === PHASES.RECORDING) {
    return {
      title: 'Recording in progress…',
      body: 'Finish your pitch, then press Stop & score.',
    };
  }
  if (phase === PHASES.TRANSCRIBING) {
    return {
      title: 'Wrapping up the transcript',
      body: 'Person 1 module is finalizing your transcript.',
    };
  }
  if (phase === PHASES.SCORING) {
    return {
      title: 'Asking Claude to score this pitch',
      body: 'Person 2 module is calling Claude and parsing the JSON response.',
    };
  }
  if (phase === PHASES.ERROR) {
    return {
      title: 'Something went sideways',
      body: 'Check the status badge for details, then reset and try again.',
    };
  }
  if (hasTranscript) {
    return {
      title: 'Transcript captured',
      body: 'Scoring will appear here once Person 2 returns the JSON report.',
    };
  }
  return {
    title: 'Your scores will appear here',
    body: 'Press Start pitch, or load the seeded demo to preview the full UI.',
  };
}

export default function EmptyState({ hasTranscript, phase, onLoadDemo }) {
  const { title, body } = copyFor(phase, hasTranscript);
  const isIdle = phase === PHASES.IDLE;

  return (
    <article className="empty-state" aria-live="polite">
      <div className="empty-state__art" aria-hidden="true">
        <svg viewBox="0 0 120 120" width="96" height="96">
          <defs>
            <linearGradient id="es-grad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#6ea8fe" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <polygon
            points="60,12 100,38 92,86 28,86 20,38"
            fill="none"
            stroke="url(#es-grad)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon
            points="60,28 88,46 82,76 38,76 32,46"
            fill="rgba(110,168,254,0.10)"
            stroke="url(#es-grad)"
            strokeWidth="1.5"
          />
          <circle cx="60" cy="56" r="3" fill="#a78bfa" />
        </svg>
      </div>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__body">{body}</p>
      {isIdle && (
        <button
          type="button"
          className="empty-state__btn"
          onClick={onLoadDemo}
        >
          Show me with seeded data
        </button>
      )}
    </article>
  );
}

EmptyState.propTypes = {
  hasTranscript: PropTypes.bool.isRequired,
  phase: PhaseShape.isRequired,
  onLoadDemo: PropTypes.func.isRequired,
};
