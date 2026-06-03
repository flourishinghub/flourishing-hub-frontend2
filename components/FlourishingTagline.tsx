'use client';

import { motion } from 'framer-motion';

export default function FlourishingTagline() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
        Flourishing Hub
      </h1>
      <h2 className="text-xl md:text-2xl font-semibold text-white/80 mb-2">
        IIT Bombay
      </h2>
      <p className="text-lg md:text-xl italic text-primary font-medium">
        Let's Thrive, Not Just Survive
      </p>
    </motion.div>
  );
}
