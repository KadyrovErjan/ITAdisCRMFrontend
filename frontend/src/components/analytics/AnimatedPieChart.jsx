import { motion } from 'framer-motion';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, value
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={fill}
      />
    </g>
  );
};

const AnimatedPieChart = ({ data, title, description, dataKey = "value", nameKey = "name" }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const formatValue = (value) => {
    return value.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ₸';
  };

  const total = data?.reduce((sum, item) => sum + (item[dataKey] || 0), 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-2xl p-6 overflow-hidden relative"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full blur-3xl opacity-30 -z-10" />
      
      {/* Header */}
      <div className="mb-6">
        <motion.h3 
          className="text-xl font-bold text-gray-900 mb-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h3>
        {description && (
          <motion.p 
            className="text-sm text-gray-500"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {description}
          </motion.p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey={dataKey}
                onMouseEnter={onPieEnter}
                animationBegin={0}
                animationDuration={1500}
              >
                {data?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2 space-y-3">
          {data?.map((entry, index) => {
            const percentage = total > 0 ? ((entry[dataKey] / total) * 100).toFixed(1) : 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  activeIndex === index 
                    ? 'bg-gradient-to-r from-gray-100 to-gray-50 shadow-md scale-105' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <motion.div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    animate={{
                      scale: activeIndex === index ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {entry[nameKey]}
                  </span>
                </div>
                <div className="text-right ml-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatValue(entry[dataKey])}
                  </div>
                  <div className="text-xs text-gray-500">
                    {percentage}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 pt-6 border-t border-gray-200"
      >
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">Итого:</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {formatValue(total)}
          </span>
        </div>
      </motion.div>

      {/* Decorative Line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      />
    </motion.div>
  );
};

export default AnimatedPieChart;
