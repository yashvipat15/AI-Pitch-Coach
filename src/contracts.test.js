import { describe, expect, it } from 'vitest';
import {
  SCORE_CATEGORY_KEYS,
  CATEGORY_LABELS,
  PHASES,
  clampScore,
  isValidScore,
  TranscriptShape,
  ScoreReportShape,
} from './contracts.js';

describe('contracts', () => {
  describe('clampScore', () => {
    it('returns the value when in range', () => {
      expect(clampScore(0)).toBe(0);
      expect(clampScore(5.5)).toBe(5.5);
      expect(clampScore(10)).toBe(10);
    });

    it('clamps below zero', () => {
      expect(clampScore(-1)).toBe(0);
      expect(clampScore(-100)).toBe(0);
    });

    it('clamps above ten', () => {
      expect(clampScore(11)).toBe(10);
      expect(clampScore(9999)).toBe(10);
    });

    it('coerces non-numbers to zero', () => {
      expect(clampScore(NaN)).toBe(0);
      expect(clampScore(undefined)).toBe(0);
      expect(clampScore('7')).toBe(0);
      expect(clampScore(null)).toBe(0);
    });
  });

  describe('isValidScore', () => {
    it.each([
      [0, true],
      [10, true],
      [5.5, true],
      [-0.01, false],
      [10.01, false],
      [NaN, false],
      ['5', false],
      [null, false],
      [undefined, false],
    ])('isValidScore(%p) === %p', (input, expected) => {
      expect(isValidScore(input)).toBe(expected);
    });
  });

  describe('PHASES', () => {
    it('exposes the full state machine', () => {
      expect(PHASES).toEqual({
        IDLE: 'idle',
        RECORDING: 'recording',
        TRANSCRIBING: 'transcribing',
        SCORING: 'scoring',
        COMPLETE: 'complete',
        ERROR: 'error',
      });
    });

    it('is frozen', () => {
      expect(Object.isFrozen(PHASES)).toBe(true);
    });
  });

  describe('category catalog', () => {
    it('has six keys', () => {
      expect(SCORE_CATEGORY_KEYS).toHaveLength(6);
    });

    it('has a label for every key', () => {
      for (const key of SCORE_CATEGORY_KEYS) {
        expect(CATEGORY_LABELS[key]).toBeTruthy();
      }
    });
  });

  describe('PropTypes shapes', () => {
    it('exports both Transcript and ScoreReport shapes', () => {
      expect(typeof TranscriptShape).toBe('function');
      expect(typeof ScoreReportShape).toBe('function');
    });
  });
});
