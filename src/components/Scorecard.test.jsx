import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Scorecard from './Scorecard.jsx';
import { MOCK_SCORE_REPORT } from '../fixtures.js';

describe('<Scorecard />', () => {
  it('renders every category label, score, and rationale', () => {
    render(<Scorecard report={MOCK_SCORE_REPORT} />);
    for (const cat of MOCK_SCORE_REPORT.categories) {
      expect(screen.getByText(cat.label)).toBeInTheDocument();
      expect(screen.getByText(cat.score.toFixed(1))).toBeInTheDocument();
      expect(screen.getByText(cat.rationale)).toBeInTheDocument();
    }
  });

  it('renders a tier class on each row', () => {
    const { container } = render(<Scorecard report={MOCK_SCORE_REPORT} />);
    const rows = container.querySelectorAll('.scorecard__row');
    expect(rows).toHaveLength(MOCK_SCORE_REPORT.categories.length);
    for (const row of rows) {
      expect(
        row.className.match(/scorecard__row--(high|mid|low)/),
      ).toBeTruthy();
    }
  });

  it('clamps an out-of-range score before rendering', () => {
    const report = {
      ...MOCK_SCORE_REPORT,
      categories: MOCK_SCORE_REPORT.categories.map((c, i) =>
        i === 0 ? { ...c, score: 99 } : c,
      ),
    };
    const { container } = render(<Scorecard report={report} />);
    const firstFill = container.querySelector('.scorecard__bar-fill');
    expect(firstFill.style.width).toBe('100%');
  });
});
