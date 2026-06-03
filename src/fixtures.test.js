import { describe, expect, it } from 'vitest';
import PropTypes from 'prop-types';
import { TranscriptShape, ScoreReportShape, SCORE_CATEGORY_KEYS } from './contracts.js';
import { MOCK_TRANSCRIPT, MOCK_SCORE_REPORT } from './fixtures.js';

function collectShapeErrors(shape, value, name) {
  PropTypes.resetWarningCache();
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try {
    PropTypes.checkPropTypes({ [name]: shape.isRequired }, { [name]: value }, 'prop', 'test');
  } finally {
    console.error = original;
  }
  return errors;
}

describe('fixtures', () => {
  describe('MOCK_TRANSCRIPT', () => {
    it('conforms to TranscriptShape', () => {
      expect(collectShapeErrors(TranscriptShape, MOCK_TRANSCRIPT, 'transcript')).toEqual([]);
    });

    it('segments are in time order', () => {
      for (let i = 1; i < MOCK_TRANSCRIPT.segments.length; i += 1) {
        expect(MOCK_TRANSCRIPT.segments[i].startSec).toBeGreaterThanOrEqual(
          MOCK_TRANSCRIPT.segments[i - 1].endSec - 0.001,
        );
      }
    });

    it('text is the concatenation of segments', () => {
      const joined = MOCK_TRANSCRIPT.segments.map((s) => s.text).join(' ');
      expect(MOCK_TRANSCRIPT.text).toBe(joined);
    });
  });

  describe('MOCK_SCORE_REPORT', () => {
    it('conforms to ScoreReportShape', () => {
      expect(collectShapeErrors(ScoreReportShape, MOCK_SCORE_REPORT, 'report')).toEqual([]);
    });

    it('has exactly one category per known key, in order', () => {
      expect(MOCK_SCORE_REPORT.categories.map((c) => c.key)).toEqual(SCORE_CATEGORY_KEYS);
    });

    it('every score is 0-10', () => {
      for (const cat of MOCK_SCORE_REPORT.categories) {
        expect(cat.score).toBeGreaterThanOrEqual(0);
        expect(cat.score).toBeLessThanOrEqual(10);
      }
    });

    it('overall is 0-100', () => {
      expect(MOCK_SCORE_REPORT.overall).toBeGreaterThanOrEqual(0);
      expect(MOCK_SCORE_REPORT.overall).toBeLessThanOrEqual(100);
    });

    it('generatedAt is a valid ISO timestamp', () => {
      expect(Number.isNaN(Date.parse(MOCK_SCORE_REPORT.generatedAt))).toBe(false);
    });
  });
});
