import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeedbackList from './FeedbackList.jsx';

describe('<FeedbackList />', () => {
  it('renders each strength and improvement', () => {
    render(
      <FeedbackList
        strengths={['Opener is sharp', 'Numbers land']}
        improvements={['Slow the ask', 'Cut the hedge']}
      />,
    );
    expect(screen.getByText('Opener is sharp')).toBeInTheDocument();
    expect(screen.getByText('Numbers land')).toBeInTheDocument();
    expect(screen.getByText('Slow the ask')).toBeInTheDocument();
    expect(screen.getByText('Cut the hedge')).toBeInTheDocument();
  });

  it('shows an empty hint when strengths are empty', () => {
    render(<FeedbackList strengths={[]} improvements={['x']} />);
    expect(screen.getByText('No strengths flagged.')).toBeInTheDocument();
  });

  it('shows an empty hint when improvements are empty', () => {
    render(<FeedbackList strengths={['x']} improvements={[]} />);
    expect(screen.getByText('Nothing flagged.')).toBeInTheDocument();
  });
});
