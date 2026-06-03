import PropTypes from 'prop-types';
import { PHASES, PhaseShape } from '../contracts.js';
import './StatusBadge.css';

const LABELS = {
  [PHASES.IDLE]: 'Ready',
  [PHASES.RECORDING]: 'Recording…',
  [PHASES.TRANSCRIBING]: 'Transcribing…',
  [PHASES.SCORING]: 'Scoring with Claude…',
  [PHASES.COMPLETE]: 'Scored',
  [PHASES.ERROR]: 'Error',
};

export default function StatusBadge({ phase, error = null }) {
  const label = error && phase === PHASES.ERROR ? error : LABELS[phase];

  return (
    <div className={`status-badge status-badge--${phase}`} role="status" aria-live="polite">
      <span className="status-badge__dot" aria-hidden="true" />
      <span className="status-badge__label">{label}</span>
    </div>
  );
}

StatusBadge.propTypes = {
  phase: PhaseShape.isRequired,
  error: PropTypes.string,
};
