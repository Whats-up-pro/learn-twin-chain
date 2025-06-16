
import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  color?: string; // Tailwind color class e.g., 'bg-sky-500'
  height?: string; // Tailwind height class e.g., 'h-2'
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  color = 'bg-sky-500',
  height = 'h-2.5',
}) => {
  const percentage = Math.max(0, Math.min(100, value));

  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-medium text-sky-700">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${height} dark:bg-gray-700`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
