import PropTypes from 'prop-types';
import './FeedbackList.css';

export default function FeedbackList({ strengths, improvements }) {
  return (
    <article className="feedback" aria-labelledby="feedback-heading">
      <header className="feedback__head">
        <h2 id="feedback-heading">Coach notes</h2>
      </header>

      <section className="feedback__col feedback__col--strengths">
        <h3>What worked</h3>
        <ul>
          {strengths.length === 0 && (
            <li className="feedback__empty">No strengths flagged.</li>
          )}
          {strengths.map((s, i) => (
            <li key={`s-${i}`}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="feedback__col feedback__col--improvements">
        <h3>What to fix next</h3>
        <ul>
          {improvements.length === 0 && (
            <li className="feedback__empty">Nothing flagged.</li>
          )}
          {improvements.map((s, i) => (
            <li key={`i-${i}`}>{s}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

FeedbackList.propTypes = {
  strengths: PropTypes.arrayOf(PropTypes.string).isRequired,
  improvements: PropTypes.arrayOf(PropTypes.string).isRequired,
};
