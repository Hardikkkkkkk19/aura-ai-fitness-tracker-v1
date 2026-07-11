import { useRef, useEffect } from 'react';
import { useMotionValue, useSpring } from 'motion/react';

export function useMagnetic() {
  const ref = useRef<HTMLButtonElement | HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150, mass: 0.15 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = element.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distanceX = clientX - centerX;
      const distanceY = clientY - centerY;

      // Magnetic range threshold: 80px
      const threshold = 80;
      const distance = Math.hypot(distanceX, distanceY);

      if (distance < threshold) {
        // Attract: max 10px movement
        x.set(distanceX * 0.15);
        y.set(distanceY * 0.15);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (element) {
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [x, y]);

  return { ref, style: { x: springX, y: springY } };
}
