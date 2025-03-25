import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

export const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>© 2025 Hawken. All rights reserved.</Text>
    {/* Right side will be used for page number */}
  </View>
); 