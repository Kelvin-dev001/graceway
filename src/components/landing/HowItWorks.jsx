'use client';

import { motion } from 'framer-motion';
import { DISCIPLESHIP_STEPS } from '@/lib/constants';

export default function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-navy-500 mb-4">The Discipleship Growth Loop</h2>
          <p className="text-xl text-gray-600">Six steps to spiritual growth and multiplication.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {DISCIPLESHIP_STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-navy-500 flex items-center justify-center text-2xl mb-3 shadow-md">
                {step.icon}
              </div>
              <div className="text-xs text-orange-500 font-bold mb-1">Step {step.step}</div>
              <h3 className="font-bold text-navy-500 mb-1">{step.label}</h3>
              <p className="text-xs text-gray-500">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
