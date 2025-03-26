"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMusic } from 'react-icons/fa';

const SplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide splash screen after 5 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-pink-500 to-pink-900"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="bg-white rounded-full p-6 shadow-2xl"
              >
                <FaMusic className="text-6xl text-pink-600" />
              </motion.div>
            </div>

            <motion.h1 
              className="text-4xl font-bold text-white mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              MelodyVerse
            </motion.h1>

            <motion.div
              className="space-y-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <p className="text-xl text-white/90">Created by</p>
              <p className="text-3xl font-semibold text-white">Nikita & Vishal</p>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-8 left-0 right-0 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4.5, ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen; 