import { motion } from 'framer-motion';
import { ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ErrorState = ({ message = 'Произошла ошибка при загрузке данных', onRetry }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-2xl p-8"
    >
      <motion.div
        animate={{
          rotate: [0, 10, -10, 10, 0],
        }}
        transition={{
          duration: 0.5,
          repeat: 3,
        }}
      >
        <ExclamationCircleIcon className="w-20 h-20 text-red-500" />
      </motion.div>
      
      <h3 className="mt-4 text-xl font-semibold text-gray-900">Упс!</h3>
      <p className="mt-2 text-gray-600 text-center max-w-md">{message}</p>
      
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="mt-6 inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg font-medium"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          Попробовать снова
        </motion.button>
      )}
    </motion.div>
  );
};

export default ErrorState;
