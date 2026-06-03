import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge.jsx';
import { PHASES } from '../contracts.js';

describe('<StatusBadge />', () => {
  it.each([
    [PHASES.IDLE, 'Ready'],
    [PHASES.RECORDING, 'Recording…'],
    [PHASES.TRANSCRIBING, 'Transcribing…'],
    [PHASES.SCORING, 'Scoring with Claude…'],
    [PHASES.COMPLETE, 'Scored'],
  ])('renders the label for phase %s', (phase, label) => {
    render(<StatusBadge phase={phase} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('shows the error string when phase is error', () => {
    render(<StatusBadge phase={PHASES.ERROR} error="Mic blocked" />);
    expect(screen.getByText('Mic blocked')).toBeInTheDocument();
  });

  it('falls back to default error label when no error string', () => {
    render(<StatusBadge phase={PHASES.ERROR} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
