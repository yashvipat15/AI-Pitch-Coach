import { describe, expect, it, vi } from 'vitest';
import {
  buildSegment,
  joinSegmentText,
  isSttSupported,
  createSttSession,
} from './stt.js';

function fakeResults(alternatives) {
  const list = alternatives.map(({ text, isFinal = true }) => {
    const r = [{ transcript: text, confidence: 0.95 }];
    r.isFinal = isFinal;
    return r;
  });
  return list;
}

function makeMockRecognition() {
  let onresult;
  let onerror;
  let onend;
  const calls = { start: 0, stop: 0 };

  const inst = {
    continuous: false,
    interimResults: true,
    lang: 'en-US',
    set onresult(fn) { onresult = fn; },
    get onresult() { return onresult; },
    set onerror(fn) { onerror = fn; },
    get onerror() { return onerror; },
    set onend(fn) { onend = fn; },
    get onend() { return onend; },
    start: vi.fn(() => { calls.start += 1; }),
    stop: vi.fn(() => {
      calls.stop += 1;
      if (onend) onend();
    }),
  };

  return {
    inst,
    calls,
    emitResult: (alternatives, resultIndex = 0) => {
      onresult({ results: fakeResults(alternatives), resultIndex });
    },
    emitError: (err) => onerror({ error: err }),
    emitEnd: () => onend && onend(),
  };
}

describe('stt — pure helpers', () => {
  it('buildSegment normalizes inputs', () => {
    expect(buildSegment({ id: 7, text: '  hello  ', startSec: 1, endSec: 3 })).toEqual({
      id: '7',
      text: 'hello',
      startSec: 1,
      endSec: 3,
    });
  });

  it('buildSegment defaults timings to 0', () => {
    const seg = buildSegment({ id: 'a', text: 'x' });
    expect(seg.startSec).toBe(0);
    expect(seg.endSec).toBe(0);
  });

  it('joinSegmentText collapses whitespace', () => {
    const segs = [
      { text: 'one   two' },
      { text: '  three' },
      { text: 'four' },
    ];
    expect(joinSegmentText(segs)).toBe('one two three four');
  });

  it('isSttSupported returns false when no constructor is on window', () => {
    expect(isSttSupported({})).toBe(false);
  });

  it('isSttSupported returns true when SpeechRecognition exists', () => {
    expect(isSttSupported({ SpeechRecognition: function () {} })).toBe(true);
  });

  it('isSttSupported returns true for the webkit-prefixed name', () => {
    expect(isSttSupported({ webkitSpeechRecognition: function () {} })).toBe(true);
  });
});

describe('createSttSession', () => {
  it('reports unsupported when no recognition is available', () => {
    const onError = vi.fn();
    const session = createSttSession({
      recognitionFactory: () => null,
      onError,
    });
    session.start();
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('not supported'));
  });

  it('starts the underlying recognition and pushes a segment on each final result', () => {
    const mock = makeMockRecognition();
    const onSegment = vi.fn();
    const now = vi.fn();
    now.mockReturnValueOnce(2.5).mockReturnValueOnce(5.0);

    const session = createSttSession({
      recognitionFactory: () => mock.inst,
      onSegment,
      now,
    });

    session.start();
    expect(mock.calls.start).toBe(1);
    expect(mock.inst.continuous).toBe(true);
    expect(mock.inst.interimResults).toBe(false);
    expect(mock.inst.lang).toBe('en-US');

    mock.emitResult([{ text: 'Hello world.' }]);
    expect(onSegment).toHaveBeenCalledTimes(1);
    const first = onSegment.mock.calls[0][0];
    expect(first.segments).toHaveLength(1);
    expect(first.segments[0]).toMatchObject({
      id: 's1',
      text: 'Hello world.',
      startSec: 0,
      endSec: 2.5,
    });
    expect(first.text).toBe('Hello world.');
    expect(first.finalizedAt).toBeNull();

    // Real Web Speech API delivers a cumulative results list; resultIndex marks the new chunk.
    mock.emitResult(
      [{ text: 'Hello world.' }, { text: 'Second segment.' }],
      1,
    );
    expect(onSegment).toHaveBeenCalledTimes(2);
    const second = onSegment.mock.calls[1][0];
    expect(second.segments).toHaveLength(2);
    expect(second.segments[1]).toMatchObject({
      id: 's2',
      text: 'Second segment.',
      startSec: 2.5,
      endSec: 5.0,
    });
    expect(second.text).toBe('Hello world. Second segment.');
  });

  it('ignores non-final results', () => {
    const mock = makeMockRecognition();
    const onSegment = vi.fn();

    const session = createSttSession({
      recognitionFactory: () => mock.inst,
      onSegment,
      now: () => 1,
    });

    session.start();
    mock.emitResult([{ text: 'still typing…', isFinal: false }]);
    expect(onSegment).not.toHaveBeenCalled();
  });

  it('skips blank transcripts', () => {
    const mock = makeMockRecognition();
    const onSegment = vi.fn();
    const session = createSttSession({
      recognitionFactory: () => mock.inst,
      onSegment,
      now: () => 1,
    });
    session.start();
    mock.emitResult([{ text: '   ' }]);
    expect(onSegment).not.toHaveBeenCalled();
  });

  it('forwards errors through onError', () => {
    const mock = makeMockRecognition();
    const onError = vi.fn();
    const session = createSttSession({
      recognitionFactory: () => mock.inst,
      onError,
    });
    session.start();
    mock.emitError('no-speech');
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('no-speech'));
  });

  it('emits a finalized cumulative transcript on stop', () => {
    const mock = makeMockRecognition();
    const onEnd = vi.fn();
    const session = createSttSession({
      recognitionFactory: () => mock.inst,
      onEnd,
      now: () => 1,
    });
    session.start();
    mock.emitResult([{ text: 'Done.' }]);
    session.stop();
    expect(mock.calls.stop).toBe(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
    const final = onEnd.mock.calls[0][0];
    expect(final.text).toBe('Done.');
    expect(final.segments).toHaveLength(1);
    expect(typeof final.finalizedAt).toBe('string');
    expect(Number.isNaN(Date.parse(final.finalizedAt))).toBe(false);
  });

  it('stop() without start() still fires onEnd', () => {
    const onEnd = vi.fn();
    const session = createSttSession({
      recognitionFactory: () => makeMockRecognition().inst,
      onEnd,
    });
    session.stop();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0][0].segments).toEqual([]);
  });

  it('does not double-fire onEnd if stop() is called twice', () => {
    const mock = makeMockRecognition();
    const onEnd = vi.fn();
    const session = createSttSession({
      recognitionFactory: () => mock.inst,
      onEnd,
    });
    session.start();
    session.stop();
    session.stop();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('catches recognition.start() throwing (e.g. permission denied)', () => {
    const mock = makeMockRecognition();
    mock.inst.start = vi.fn(() => { throw new Error('permission denied'); });
    const onError = vi.fn();
    const session = createSttSession({
      recognitionFactory: () => mock.inst,
      onError,
    });
    session.start();
    expect(onError).toHaveBeenCalledWith('permission denied');
  });
});
