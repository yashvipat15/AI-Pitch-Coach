function getRecognitionCtor(win = typeof window !== 'undefined' ? window : null) {
  if (!win) return null;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isSttSupported(win) {
  return getRecognitionCtor(win) !== null;
}

export function buildSegment({ id, text, startSec, endSec }) {
  return {
    id: String(id),
    text: String(text || '').trim(),
    startSec: typeof startSec === 'number' ? startSec : 0,
    endSec: typeof endSec === 'number' ? endSec : 0,
  };
}

export function joinSegmentText(segments) {
  return segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim();
}

export function createSttSession({
  onSegment,
  onError,
  onEnd,
  recognitionFactory,
  now,
} = {}) {
  const factory =
    recognitionFactory ||
    (() => {
      const Ctor = getRecognitionCtor();
      return Ctor ? new Ctor() : null;
    });

  const segments = [];
  let recognition = null;
  let startedAtMs = 0;
  let segmentStartSec = 0;
  let nextId = 1;
  let stopped = false;

  const clock =
    now ||
    (() => {
      const t = typeof performance !== 'undefined' ? performance.now() : Date.now();
      return (t - startedAtMs) / 1000;
    });

  function cumulative(finalized = false) {
    return {
      text: joinSegmentText(segments),
      segments: segments.slice(),
      finalizedAt: finalized ? new Date().toISOString() : null,
    };
  }

  function handleResult(event) {
    const results = event.results || [];
    const startIdx = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
    for (let i = startIdx; i < results.length; i += 1) {
      const r = results[i];
      if (!r || !r[0]) continue;
      if (!r.isFinal) continue;
      const text = r[0].transcript || '';
      if (!text.trim()) continue;
      const endSec = clock();
      segments.push(
        buildSegment({
          id: `s${nextId++}`,
          text,
          startSec: segmentStartSec,
          endSec,
        }),
      );
      segmentStartSec = endSec;
      try {
        if (onSegment) onSegment(cumulative(false));
      } catch (e) {
        if (onError) onError(e && e.message ? e.message : String(e));
      }
    }
  }

  function handleError(event) {
    const code = (event && (event.error || event.message)) || 'unknown';
    if (onError) onError(`Speech recognition error: ${code}`);
  }

  function handleEnd() {
    if (stopped) return;
    stopped = true;
    if (onEnd) onEnd(cumulative(true));
  }

  function start() {
    if (recognition) return;
    const inst = factory();
    if (!inst) {
      if (onError) onError('Speech recognition not supported in this browser.');
      return;
    }
    recognition = inst;
    stopped = false;
    segments.length = 0;
    nextId = 1;
    startedAtMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    segmentStartSec = 0;

    if ('continuous' in recognition) recognition.continuous = true;
    if ('interimResults' in recognition) recognition.interimResults = false;
    if ('lang' in recognition) recognition.lang = 'en-US';

    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    try {
      recognition.start();
    } catch (e) {
      if (onError) onError(e && e.message ? e.message : 'Could not start microphone.');
    }
  }

  function stop() {
    if (!recognition) {
      handleEnd();
      return;
    }
    try {
      recognition.stop();
    } catch {
      handleEnd();
    }
  }

  return { start, stop, get supported() { return isSttSupported(); } };
}
