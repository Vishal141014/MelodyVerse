"use client";
import { motion } from 'framer-motion';

interface SystemMessageProps {
  content: string;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ content }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center my-2"
    >
      <div className="bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 px-4 py-1.5 text-sm rounded-full text-center inline-block">
        {content}
      </div>
    </motion.div>
  );
};

export default SystemMessage; 