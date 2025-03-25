import React from 'react';
import { View, Svg, Path } from '@react-pdf/renderer';
import { styles } from '../styles';

interface PieChartProps {
  data: { category: string; count: number }[];
}

export const PieChart = ({ data }: PieChartProps) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };
  
  let cumulativePercent = 0;
  const paths = data.map((item, i) => {
    const { category, count } = item;
    const percent = count / total;
    
    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
    cumulativePercent += percent;
    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
    
    const largeArcFlag = percent > 0.5 ? 1 : 0;
    
    const pathData = [
      `M 0 0`,
      `L ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L 0 0`
    ].join(' ');
    
    // Cycle through some colors
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const fill = colors[i % colors.length];
    
    return <Path key={i} d={pathData} fill={fill} />;
  });
  
  return (
    <View style={styles.pieContainer}>
      <Svg viewBox="-1 -1 2 2">
        {paths}
      </Svg>
    </View>
  );
}; 