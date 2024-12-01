import React from 'react';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';

const Chart = ({ data, type }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        grid: { display: true },
      },
    },
    plugins: {
      legend: { display: true, position: 'top' },
    },
  };

  if (type === 'line') {
    return <Line data={data} options={chartOptions} />;
  } else if (type === 'bar') {
    return <Bar data={data} options={chartOptions} />;
  }

  return null; // Return null if no valid type is provided
};

export default Chart;
