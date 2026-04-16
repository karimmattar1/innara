import { motion, AnimatePresence } from 'framer-motion';

interface ClickIndicatorProps {
  indicators: { id: number; x: number; y: number }[];
  size?: 'small' | 'large';
}

export function ClickIndicator({ indicators, size = 'small' }: ClickIndicatorProps) {
  const dimensions = size === 'small' 
    ? { width: 80, height: 80, margin: -40, border: 3 }
    : { width: 150, height: 150, margin: -75, border: 4 };

  return (
    <AnimatePresence>
      {indicators.map((indicator) => (
        <motion.div
          key={indicator.id}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: size === 'small' ? 0.8 : 1, ease: "easeOut" }}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${indicator.x}%`,
            top: `${indicator.y}%`,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            marginLeft: `${dimensions.margin}px`,
            marginTop: `${dimensions.margin}px`,
            borderRadius: '50%',
            border: `${dimensions.border}px solid rgba(26, 29, 58, 0.5)`,
            background: 'radial-gradient(circle, rgba(26, 29, 58, 0.25) 0%, transparent 70%)',
            willChange: 'opacity',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
          }}
        />
      ))}
    </AnimatePresence>
  );
}
