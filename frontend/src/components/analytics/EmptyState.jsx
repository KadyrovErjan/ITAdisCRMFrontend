import { motion } from 'framer-motion';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const EmptyState = ({ title = 'Нет данных', message = 'Пока нет данных для отображения' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[300px] bg-gray-50 rounded-2xl p-8"
    >
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-6"
      >
        <ChartBarIcon className="w-16 h-16 text-gray-500" />
      </motion.div>
      
      <h3 className="mt-6 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 text-center max-w-md">{message}</p>
      
      <motion.div
        className="mt-6 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-16 bg-gray-300 rounded-full"
            animate={{
              scaleY: [0.3, 1, 0.5, 0.8, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
