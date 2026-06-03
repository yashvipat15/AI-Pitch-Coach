import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from './Header.jsx';

describe('<Header />', () => {
  it('renders the brand title and tagline', () => {
    render(<Header overallScore={null} />);
    expect(screen.getByRole('heading', { name: /AI Pitch Coach/i })).toBeInTheDocument();
    expect(screen.getByText(/Practice\. Score\. Polish\./)).toBeInTheDocument();
  });

  it('renders a dash when no score is provided', () => {
    const { container } = render(<Header overallScore={null} />);
    expect(container.querySelector('.app-header__score-value').textContent).toBe('—');
    expect(container.querySelector('.app-header__score--neutral')).toBeInTheDocument();
  });

  it('renders the high tier when score >= 85', () => {
    const { container } = render(<Header overallScore={92} />);
    expect(container.querySelector('.app-header__score-value').textContent).toBe('92');
    expect(container.querySelector('.app-header__score--high')).toBeInTheDocument();
  });

  it('renders the mid tier between 70 and 84', () => {
    const { container } = render(<Header overallScore={75} />);
    expect(container.querySelector('.app-header__score--mid')).toBeInTheDocument();
  });

  it('renders the low tier below 70', () => {
    const { container } = render(<Header overallScore={42} />);
    expect(container.querySelector('.app-header__score--low')).toBeInTheDocument();
  });

  it('rounds fractional scores for display', () => {
    const { container } = render(<Header overallScore={82.4} />);
    expect(container.querySelector('.app-header__score-value').textContent).toBe('82');
  });
});
