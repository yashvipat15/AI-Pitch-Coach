import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import DemoControls from './components/DemoControls.jsx';
import TranscriptPanel from './components/TranscriptPanel.jsx';
import Scorecard from './components/Scorecard.jsx';
import RadarChart from './components/RadarChart.jsx';
import FeedbackList from './components/FeedbackList.jsx';
import StatusBadge from './components/StatusBadge.jsx';
import EmptyState from './components/EmptyState.jsx';
import { PHASES } from './contracts.js';
import { MOCK_TRANSCRIPT, MOCK_SCORE_REPORT } from './fixtures.js';
import { createSttSession, isSttSupported } from './lib/stt.js';
import './styles/App.css';

const EMPTY_TRANSCRIPT = { text: '', segments: [], finalizedAt: null };

function readDemoFlag() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === '1';
}

export default function App() {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [transcript, setTranscript] = useState(EMPTY_TRANSCRIPT);
  const [scoreReport, setScoreReport] = useState(null);
  const [error, setError] = useState(null);
  const sttRef = useRef(null);

  useEffect(() => {
    if (readDemoFlag()) {
      setTranscript(MOCK_TRANSCRIPT);
      setScoreReport(MOCK_SCORE_REPORT);
      setPhase(PHASES.COMPLETE);
    }
  }, []);

  useEffect(() => () => {
    if (sttRef.current) sttRef.current.stop();
  }, []);

  const handleStart = useCallback(() => {
    setError(null);
    setTranscript(EMPTY_TRANSCRIPT);
    setScoreReport(null);

    if (!isSttSupported()) {
      setError('Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
      setPhase(PHASES.ERROR);
      return;
    }

    const session = createSttSession({
      onSegment: (next) => setTranscript(next),
      onError: (msg) => {
        setError(msg);
        setPhase(PHASES.ERROR);
      },
      onEnd: (finalTranscript) => {
        setTranscript(finalTranscript);
        sttRef.current = null;
        // Person 2: scoringModule.score(finalTranscript).then(handleScoreReport).catch((e) => handleError(e.message))
        setPhase(finalTranscript.segments.length > 0 ? PHASES.SCORING : PHASES.IDLE);
      },
    });

    sttRef.current = session;
    setPhase(PHASES.RECORDING);
    session.start();
  }, []);

  const handleStop = useCallback(() => {
    setPhase(PHASES.TRANSCRIBING);
    if (sttRef.current) {
      sttRef.current.stop();
    } else {
      setPhase(PHASES.IDLE);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (sttRef.current) {
      sttRef.current.stop();
      sttRef.current = null;
    }
    setTranscript(EMPTY_TRANSCRIPT);
    setScoreReport(null);
    setError(null);
    setPhase(PHASES.IDLE);
  }, []);

  const handleLoadDemo = useCallback(() => {
    setTranscript(MOCK_TRANSCRIPT);
    setScoreReport(MOCK_SCORE_REPORT);
    setError(null);
    setPhase(PHASES.COMPLETE);
  }, []);

  const handleTranscriptUpdate = useCallback((next) => {
    setTranscript(next);
  }, []);

  const handleScoreReport = useCallback((report) => {
    setScoreReport(report);
    setPhase(PHASES.COMPLETE);
  }, []);

  const handleError = useCallback((message) => {
    setError(message);
    setPhase(PHASES.ERROR);
  }, []);

  const hasTranscript = transcript.text.length > 0;
  const hasScores = scoreReport !== null;

  const overall = useMemo(
    () => (hasScores ? scoreReport.overall : null),
    [hasScores, scoreReport],
  );

  return (
    <div className="app-shell">
      <Header overallScore={overall} />

      <main className="app-main">
        <section className="app-controls" aria-label="Recording controls">
          <DemoControls
            phase={phase}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
            onLoadDemo={handleLoadDemo}
          />
          <StatusBadge phase={phase} error={error} />
        </section>

        <section className="app-grid">
          <div className="app-grid__col app-grid__col--left">
            <TranscriptPanel
              transcript={transcript}
              phase={phase}
              onTranscriptUpdate={handleTranscriptUpdate}
              onError={handleError}
            />
          </div>

          <div className="app-grid__col app-grid__col--right">
            {hasScores ? (
              <>
                <RadarChart categories={scoreReport.categories} />
                <Scorecard report={scoreReport} onReceiveReport={handleScoreReport} />
                <FeedbackList
                  strengths={scoreReport.strengths}
                  improvements={scoreReport.improvements}
                />
              </>
            ) : (
              <EmptyState
                hasTranscript={hasTranscript}
                phase={phase}
                onLoadDemo={handleLoadDemo}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <span>AI Pitch Coach · Person 3 build</span>
        <span className="app-footer__hint">Tip: append <code>?demo=1</code> to the URL for a seeded demo.</span>
      </footer>
    </div>
  );
}
