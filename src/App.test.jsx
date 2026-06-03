import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App.jsx';

function setSearch(qs) {
  window.history.replaceState({}, '', `/${qs}`);
}

afterEach(() => {
  setSearch('');
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

describe('<App /> — demo flow', () => {
  it('boots into the idle state with empty scoring panel', () => {
    setSearch('');
    render(<App />);
    expect(screen.getByText(/Your scores will appear here/i)).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('seeds mock data when ?demo=1 is present in the URL', () => {
    setSearch('?demo=1');
    render(<App />);
    expect(screen.getByText('Scored')).toBeInTheDocument();
    expect(screen.getByText(/Category breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Coach notes/i)).toBeInTheDocument();
    expect(screen.getByText('Clarity')).toBeInTheDocument();
  });

  it('Load demo button seeds mock data from a cold start', () => {
    setSearch('');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Load demo/i }));
    expect(screen.getByText('Scored')).toBeInTheDocument();
    expect(screen.getByText('Clarity')).toBeInTheDocument();
  });

  it('Reset clears the scored UI back to the empty state', () => {
    setSearch('?demo=1');
    render(<App />);
    expect(screen.getByText('Scored')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText(/Your scores will appear here/i)).toBeInTheDocument();
  });
});

describe('<App /> — STT integration', () => {
  let recognitionInstances;

  beforeEach(() => {
    recognitionInstances = [];
    class MockRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = true;
        this.lang = '';
        this.start = vi.fn();
        this.stop = vi.fn(() => {
          if (this.onend) this.onend();
        });
        recognitionInstances.push(this);
      }
    }
    window.SpeechRecognition = MockRecognition;
  });

  it('shows an error when the browser does not support speech recognition', () => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Start pitch/i }));
    expect(screen.getByText(/not supported in this browser/i)).toBeInTheDocument();
  });

  it('drives the phase through recording → transcribing → scoring on a real result', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Start pitch/i }));
    expect(screen.getByText('Recording…')).toBeInTheDocument();

    const rec = recognitionInstances[0];
    expect(rec.start).toHaveBeenCalledTimes(1);
    expect(rec.continuous).toBe(true);
    expect(rec.interimResults).toBe(false);

    act(() => {
      const result = [{ transcript: 'Hello world.', confidence: 0.9 }];
      result.isFinal = true;
      rec.onresult({ results: [result], resultIndex: 0 });
    });
    expect(screen.getByText('Hello world.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Stop & score/i }));
    expect(screen.getByText('Scoring with Claude…')).toBeInTheDocument();
  });

  it('surfaces SpeechRecognition errors as a user-facing error message', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Start pitch/i }));
    const rec = recognitionInstances[0];
    act(() => {
      rec.onerror({ error: 'not-allowed' });
    });
    expect(screen.getByText(/not-allowed/)).toBeInTheDocument();
  });
});
