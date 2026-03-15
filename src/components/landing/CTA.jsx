'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-navy-500 to-teal-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Your Discipleship Journey?
          </h2>
          <p className="text-xl text-navy-100 mb-8">
            Join thousands of believers growing and multiplying through Graceway.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/signup"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-2xl text-xl font-bold transition-colors shadow-xl"
            >
              Join Graceway Free →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
