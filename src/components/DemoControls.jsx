import PropTypes from 'prop-types';
import { PHASES, PhaseShape } from '../contracts.js';
import './DemoControls.css';

export default function DemoControls({ phase, onStart, onStop, onReset, onLoadDemo }) {
  const isRecording = phase === PHASES.RECORDING;
  const isBusy = phase === PHASES.TRANSCRIBING || phase === PHASES.SCORING;
  const isComplete = phase === PHASES.COMPLETE;

  return (
    <div className="demo-controls" role="group" aria-label="Pitch session controls">
      {!isRecording && (
        <button
          type="button"
          className="demo-controls__btn demo-controls__btn--primary"
          onClick={onStart}
          disabled={isBusy}
        >
          <span className="demo-controls__dot" aria-hidden="true" />
          {isComplete ? 'Try another pitch' : 'Start pitch'}
        </button>
      )}

      {isRecording && (
        <button
          type="button"
          className="demo-controls__btn demo-controls__btn--stop"
          onClick={onStop}
        >
          <span className="demo-controls__dot demo-controls__dot--pulse" aria-hidden="true" />
          Stop & score
        </button>
      )}

      <button
        type="button"
        className="demo-controls__btn demo-controls__btn--ghost"
        onClick={onLoadDemo}
        disabled={isRecording || isBusy}
        title="Load a seeded transcript and score report"
      >
        Load demo
      </button>

      <button
        type="button"
        className="demo-controls__btn demo-controls__btn--ghost"
        onClick={onReset}
        disabled={isRecording || isBusy}
      >
        Reset
      </button>
    </div>
  );
}

DemoControls.propTypes = {
  phase: PhaseShape.isRequired,
  onStart: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onLoadDemo: PropTypes.func.isRequired,
};
