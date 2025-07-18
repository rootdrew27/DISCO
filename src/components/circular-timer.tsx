interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularTimer({
  timeLeft,
  totalTime,
  size = 42,
  strokeWidth = 4,
  className = "",
}: CircularTimerProps) {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        className="-rotate-90 transform"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-900 transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute text-sm font-bold text-gray-800">
        {timeLeft}s
      </div>
    </div>
  );
}
