import { useState, useEffect, useRef, useCallback } from "react";

interface UseCountdownTimerProps {
  totalTime: number;
  calculateTimeLeft: () => number;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseCountdownTimerReturn {
  timeLeft: number;
  isCompleted: boolean;
  start: () => void;
  stop: () => void;
}

export function useCountdownTimer(
  props: UseCountdownTimerProps
): UseCountdownTimerReturn {
  const [timeLeft, setTimeLeft] = useState<number>(props.totalTime);
  const [isActive, setIsActive] = useState(props.autoStart ?? false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(props.onComplete);

  // Keep the onComplete callback reference up to date
  useEffect(() => {
    onCompleteRef.current = props.onComplete;
  }, [props.onComplete]);

  useEffect(() => {
    const calculateTimeLeft = props.calculateTimeLeft;

    // Set initial value
    setTimeLeft(calculateTimeLeft());
  }, [props.calculateTimeLeft]);

  const start = useCallback(() => {
    if (timeLeft > 0) {
      setIsActive(true);
      setIsCompleted(false);
    }
  }, [timeLeft]);

  const stop = useCallback(() => {
    setIsActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsActive(false);
            setIsCompleted(true);
            if (onCompleteRef.current) {
              setTimeout(() => onCompleteRef.current?.(), 0);
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, timeLeft]);

  return {
    timeLeft,
    isCompleted,
    start,
    stop,
  };
}
