import { useEffect, useState } from 'react';

const ProgressRing = ({ progress, size = 100, stroke = 4 }) => {
  const [normalizedRadius, setNormalizedRadius] = useState(0);
  const [circumference, setCircumference] = useState(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const calculatedRadius = size / 2 - stroke;
    const circumference = 2 * Math.PI * calculatedRadius;
    setNormalizedRadius(calculatedRadius);
    setCircumference(circumference);

    const progressOffset = circumference - (progress / 100) * circumference;
    setOffset(isNaN(progressOffset) ? 0 : progressOffset);
  }, [progress, size, stroke]);

  return (
    <svg
      className='Progress'
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        stroke='currentColor'
        fill='transparent'
        strokeLinecap='round'
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset: offset }}
        r={normalizedRadius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
};

export default ProgressRing;
