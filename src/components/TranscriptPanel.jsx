import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { PHASES, PhaseShape, TranscriptShape } from '../contracts.js';
import './TranscriptPanel.css';

function formatTime(sec) {
  if (typeof sec !== 'number') return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TranscriptPanel({ transcript, phase, onTranscriptUpdate, onError }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript.segments.length]);

  const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
  const onErrorRef = useRef(onError);
  useEffect(() => { onTranscriptUpdateRef.current = onTranscriptUpdate; }, [onTranscriptUpdate]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const isRecording = phase === PHASES.RECORDING;
  const isTranscribing = phase === PHASES.TRANSCRIBING;
  const hasSegments = transcript.segments.length > 0;

  return (
    <article className="transcript-panel" aria-labelledby="transcript-heading">
      <header className="transcript-panel__head">
        <h2 id="transcript-heading">Live transcript</h2>
        <span className="transcript-panel__count">
          {transcript.segments.length} segment{transcript.segments.length === 1 ? '' : 's'}
        </span>
      </header>

      <div ref={scrollRef} className="transcript-panel__body">
        {!hasSegments && !isRecording && (
          <p className="transcript-panel__placeholder">
            Your transcript will appear here as you speak. Press <strong>Start pitch</strong> to begin.
          </p>
        )}

        {!hasSegments && isRecording && (
          <p className="transcript-panel__placeholder transcript-panel__placeholder--recording">
            Listening… speak naturally for 60–90 seconds.
          </p>
        )}

        {hasSegments && (
          <ol className="transcript-panel__list">
            {transcript.segments.map((seg) => (
              <li key={seg.id} className="transcript-segment">
                <span className="transcript-segment__time">
                  {formatTime(seg.startSec)}
                </span>
                <span className="transcript-segment__text">{seg.text}</span>
              </li>
            ))}
          </ol>
        )}

        {isTranscribing && (
          <p className="transcript-panel__status">Finalizing transcript…</p>
        )}
      </div>
    </article>
  );
}

TranscriptPanel.propTypes = {
  transcript: TranscriptShape.isRequired,
  phase: PhaseShape.isRequired,
  onTranscriptUpdate: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};
