import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-[4px]">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-[#1a1d3a]/50 rounded-full"
              animate={{ y: [-4, 0, -4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
