import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const AnimatedStatCard = ({ title, value, icon: Icon, gradient, delay = 0, prefix = '', suffix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Определяем числовое значение для анимации
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.-]/g, '')) 
    : value;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
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
      {/* Gradient Background with Animation */}
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
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: delay + 0.2 }}
            >
              {title}
            </motion.p>
            <motion.div 
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
              transition={{ delay: delay + 0.3, type: "spring" }}
            >
              {isInView && !isNaN(numericValue) ? (
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
          </div>
          
          {/* Animated Icon */}
          <motion.div
            className="flex-shrink-0"
            initial={{ rotate: -180, opacity: 0 }}
            animate={isInView ? { rotate: 0, opacity: 1 } : { rotate: -180, opacity: 0 }}
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

        {/* Decorative Elements */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: delay + 0.5, duration: 1 }}
        />
        
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
        <motion.div
          className="absolute bottom-4 left-4 w-2 h-2 bg-white rounded-full"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: delay + 1
          }}
        />
      </div>
    </motion.div>
  );
};

export default AnimatedStatCard;
