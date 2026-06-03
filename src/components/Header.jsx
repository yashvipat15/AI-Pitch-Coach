import PropTypes from 'prop-types';
import './Header.css';

function overallTier(score) {
  if (score === null || score === undefined) return 'neutral';
  if (score >= 85) return 'high';
  if (score >= 70) return 'mid';
  return 'low';
}

export default function Header({ overallScore = null }) {
  const tier = overallTier(overallScore);
  const display = overallScore === null ? '—' : Math.round(overallScore);

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">◐</span>
        <div className="app-header__title">
          <h1>AI Pitch Coach</h1>
          <p>Practice. Score. Polish.</p>
        </div>
      </div>

      <div className={`app-header__score app-header__score--${tier}`} aria-live="polite">
        <span className="app-header__score-label">Overall</span>
        <span className="app-header__score-value">{display}</span>
        <span className="app-header__score-unit">/100</span>
      </div>
    </header>
  );
}

Header.propTypes = {
  overallScore: PropTypes.number,
};
