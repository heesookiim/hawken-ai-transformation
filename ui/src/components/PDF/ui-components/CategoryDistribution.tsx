import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PieChart } from './PieChart';
import { styles } from '../styles';

interface CategoryDistributionProps {
  opportunities: any[];
}

export const CategoryDistribution = ({ opportunities }: CategoryDistributionProps) => {
  // Get category counts
  const categoryCounts: Record<string, number> = {};
  opportunities.forEach(opportunity => {
    const category = opportunity.category || 'Uncategorized';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  // Convert to array for PieChart
  const data = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count
  }));
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
      <PieChart data={data} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        {data.map((item, i) => (
          <Text key={i} style={{ fontSize: 9, marginBottom: 3 }}>
            {item.category}: {item.count} ({Math.round((item.count / opportunities.length) * 100)}%)
          </Text>
        ))}
      </View>
    </View>
  );
}; 