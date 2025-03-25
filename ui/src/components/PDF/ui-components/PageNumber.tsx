import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';

interface PageNumberProps {
  number: number;
}

export const PageNumber = ({ number }: PageNumberProps) => (
  <View style={styles.footer}>
    {/* Left side is empty as copyright is in the Footer component */}
    <Text style={styles.footerText}></Text>
    <Text style={styles.pageNumber}>{number}</Text>
  </View>
); 