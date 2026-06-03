export const MOCK_TRANSCRIPT = {
  text:
    "Hi, I'm Alex, and we're building Pitch Coach — an AI that listens to your elevator pitch and tells you exactly what to fix. " +
    "Founders practice their pitch on a flight and walk into the meeting still guessing. " +
    "We give them instant, specific feedback before that meeting — scored across six dimensions, with rationale. " +
    "In our pilot with twelve YC founders, average pitch scores rose forty percent after three sessions. " +
    "We charge nineteen dollars a month, and we're raising a small angel round to ship to the next YC batch.",
  segments: [
    { id: 's1', text: "Hi, I'm Alex, and we're building Pitch Coach — an AI that listens to your elevator pitch and tells you exactly what to fix.", startSec: 0.0, endSec: 7.2 },
    { id: 's2', text: 'Founders practice their pitch on a flight and walk into the meeting still guessing.', startSec: 7.2, endSec: 13.4 },
    { id: 's3', text: 'We give them instant, specific feedback before that meeting — scored across six dimensions, with rationale.', startSec: 13.4, endSec: 21.1 },
    { id: 's4', text: 'In our pilot with twelve YC founders, average pitch scores rose forty percent after three sessions.', startSec: 21.1, endSec: 28.8 },
    { id: 's5', text: "We charge nineteen dollars a month, and we're raising a small angel round to ship to the next YC batch.", startSec: 28.8, endSec: 35.7 },
  ],
  finalizedAt: '2026-06-02T19:00:00.000Z',
};

export const MOCK_SCORE_REPORT = {
  overall: 82,
  categories: [
    { key: 'clarity', label: 'Clarity', score: 8.5, rationale: 'Product, user, and value are stated in the first sentence.' },
    { key: 'confidence', label: 'Confidence', score: 7.8, rationale: 'Even pace and assertive verbs; one hedge ("small angel round") softens the ask.' },
    { key: 'pacing', label: 'Pacing', score: 8.0, rationale: 'Roughly 150 wpm — sustainable; no rushed numbers section.' },
    { key: 'structure', label: 'Structure', score: 9.0, rationale: 'Classic problem → solution → traction → ask arc, in five clean beats.' },
    { key: 'engagement', label: 'Engagement', score: 7.2, rationale: 'Strong opener; missing a moment of stakes or a vivid example.' },
    { key: 'persuasiveness', label: 'Persuasiveness', score: 8.4, rationale: 'Concrete metric (40% lift, 12 founders) carries the credibility.' },
  ],
  strengths: [
    'Opens with a one-sentence product definition.',
    'Quantified traction (12 founders, 40% lift) lands before the ask.',
    'Structure follows a clean problem → solution → traction → ask arc.',
  ],
  improvements: [
    'Add a concrete moment-in-the-life of a founder to lift Engagement.',
    'Drop "small" before "angel round" — it undersells the ask.',
    'Name the price anchor earlier so $19/mo lands as obviously cheap.',
  ],
  generatedAt: '2026-06-02T19:00:05.000Z',
};
