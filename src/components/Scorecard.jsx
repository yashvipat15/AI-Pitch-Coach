import PropTypes from 'prop-types';
import { ScoreReportShape, clampScore } from '../contracts.js';
import './Scorecard.css';

function tierFor(score) {
  if (score >= 8.5) return 'high';
  if (score >= 7) return 'mid';
  return 'low';
}

export default function Scorecard({ report }) {
  return (
    <article className="scorecard" aria-labelledby="scorecard-heading">
      <header className="scorecard__head">
        <h2 id="scorecard-heading">Category breakdown</h2>
        <span className="scorecard__generated">
          {new Date(report.generatedAt).toLocaleTimeString()}
        </span>
      </header>

      <ul className="scorecard__list">
        {report.categories.map((cat) => {
          const score = clampScore(cat.score);
          const tier = tierFor(score);
          return (
            <li key={cat.key} className={`scorecard__row scorecard__row--${tier}`}>
              <div className="scorecard__row-head">
                <span className="scorecard__row-label">{cat.label}</span>
                <span className="scorecard__row-score">{score.toFixed(1)}</span>
              </div>
              <div className="scorecard__bar" aria-hidden="true">
                <span
                  className="scorecard__bar-fill"
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>
              <p className="scorecard__row-rationale">{cat.rationale}</p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

Scorecard.propTypes = {
  report: ScoreReportShape.isRequired,
  onReceiveReport: PropTypes.func,
};
