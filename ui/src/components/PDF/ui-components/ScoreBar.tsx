import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

interface ScoreBarProps {
  label: string;
  value: number;
  maxValue?: number;
}

export const ScoreBar = ({ label, value, maxValue = 100 }: ScoreBarProps) => {
  const percentage = (value / maxValue) * 100;
  return (
    <View style={styles.scoreContainer}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreBarBg}>
        <View style={[styles.scoreBarFg, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.scoreValue}>{value}%</Text>
    </View>
  );
}; 