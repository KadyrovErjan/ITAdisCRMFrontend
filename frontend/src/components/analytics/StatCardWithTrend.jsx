import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const StatCardWithTrend = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  gradient,
  delay = 0,
  prefix = '',
  suffix = ''
}) => {
  // Вычисляем изменение в процентах
  const change = previousValue > 0 
    ? ((value - previousValue) / previousValue * 100).toFixed(1)
    : 0;
  const isPositive = change >= 0;
  
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.-]/g, '')) 
    : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.05, 
        rotate: 1,
        transition: { duration: 0.3 }
      }}
      className="relative overflow-hidden rounded-2xl shadow-2xl"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 ${gradient} opacity-90`}>
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            ]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Glass Effect */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/10" />

      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <motion.p 
              className="text-white/80 text-sm font-medium mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.2 }}
            >
              {title}
            </motion.p>
            <motion.div 
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.3, type: "spring" }}
            >
              {!isNaN(numericValue) ? (
                <CountUp
                  start={0}
                  end={numericValue}
                  duration={2}
                  separator=" "
                  decimals={suffix.includes('₸') ? 2 : 0}
                  decimal="."
                  prefix={prefix}
                  suffix={suffix}
                />
              ) : (
                value
              )}
            </motion.div>
            
            {/* Trend Indicator */}
            {previousValue > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.4 }}
                className={`flex items-center gap-1 text-sm ${
                  isPositive ? 'text-green-200' : 'text-red-200'
                }`}
              >
                {isPositive ? (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {Math.abs(change)}%
                </span>
                <span className="text-white/60 text-xs">
                  с прошлого периода
                </span>
              </motion.div>
            )}
          </div>
          
          {/* Animated Icon */}
          <motion.div
            className="flex-shrink-0"
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ 
              delay: delay + 0.4,
              type: "spring",
              stiffness: 200
            }}
            whileHover={{ 
              rotate: 360,
              scale: 1.2,
              transition: { duration: 0.5 }
            }}
          >
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3">
              <Icon className="h-8 w-8 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        {previousValue > 0 && (
          <motion.div
            className="mt-4 pt-4 border-t border-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
          >
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isPositive ? 'bg-green-400' : 'bg-red-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.abs(change), 100)}%` }}
                transition={{ duration: 1, delay: delay + 0.6 }}
              />
            </div>
          </motion.div>
        )}

        {/* Sparkle Effect */}
        <motion.div
          className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: delay
          }}
        />
      </div>
    </motion.div>
  );
};

export default StatCardWithTrend;
