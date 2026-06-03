import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { ScoreCategoryShape } from '../contracts.js';
import './RadarChart.css';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const DATASET_COLOR = 'rgba(110, 168, 254, 1)';
const DATASET_FILL = 'rgba(110, 168, 254, 0.25)';
const GRID_COLOR = 'rgba(255, 255, 255, 0.08)';
const ANGLE_COLOR = 'rgba(255, 255, 255, 0.18)';
const TICK_COLOR = 'rgba(255, 255, 255, 0.45)';
const LABEL_COLOR = 'rgba(232, 236, 246, 0.95)';

export default function RadarChart({ categories }) {
  const data = useMemo(
    () => ({
      labels: categories.map((c) => c.label),
      datasets: [
        {
          label: 'Score',
          data: categories.map((c) => c.score),
          backgroundColor: DATASET_FILL,
          borderColor: DATASET_COLOR,
          borderWidth: 2,
          pointBackgroundColor: DATASET_COLOR,
          pointBorderColor: '#0b1020',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: DATASET_COLOR,
          pointRadius: 4,
        },
      ],
    }),
    [categories],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed.r.toFixed(1)} / 10`,
          },
        },
      },
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: {
            stepSize: 2,
            color: TICK_COLOR,
            backdropColor: 'transparent',
            showLabelBackdrop: false,
          },
          grid: { color: GRID_COLOR },
          angleLines: { color: ANGLE_COLOR },
          pointLabels: {
            color: LABEL_COLOR,
            font: { size: 13, weight: '500' },
          },
        },
      },
    }),
    [],
  );

  return (
    <article className="radar-chart" aria-labelledby="radar-heading">
      <header className="radar-chart__head">
        <h2 id="radar-heading">Score profile</h2>
        <span className="radar-chart__hint">0 – 10 per category</span>
      </header>
      <div className="radar-chart__canvas">
        <Radar data={data} options={options} />
      </div>
    </article>
  );
}

RadarChart.propTypes = {
  categories: PropTypes.arrayOf(ScoreCategoryShape).isRequired,
};
