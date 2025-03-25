import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  // Document styles
  page: {
    padding: 40,
    paddingBottom: 65,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  
  // Background styles
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImageStyle: {
    width: '100%',
    height: '100%',
  },
  
  // Pagination and section styles
  sectionContainer: {
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E293B',
  },
  sectionContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  continuedSection: {
    marginTop: 10,
    fontSize: 9,
    fontStyle: 'italic',
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'right',
    paddingRight: 5,
  },
  
  // Score bar styles
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  scoreLabel: {
    width: '40%',
    fontSize: 10,
  },
  scoreBarBg: {
    width: '40%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  scoreBarFg: {
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  scoreValue: {
    width: '20%',
    fontSize: 10,
    paddingLeft: 5,
  },

  // Pie chart styles
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  
  // Strategy matrix styles
  matrixContainer: {
    border: '1pt solid #E5E7EB',
    padding: 10,
    marginTop: 10,
  },
  matrixHeader: {
    fontSize: 12,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  matrixTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  matrixRow: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
  },
  matrixQuadrant: {
    width: '48%',
    padding: 8,
    borderRadius: 4,
    marginHorizontal: '1%',
  },
  quadrantContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quadrant: {
    width: '50%',
    padding: 5,
    height: 100,
  },
  quadrantTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  quadrantDesc: {
    fontSize: 10,
    color: '#4a5568',
    marginBottom: 8,
  },
  quadrantContent: {
    fontSize: 8,
    lineHeight: 1.5,
  },
  strategyItem: {
    fontSize: 10,
    color: '#2d3748',
    marginBottom: 2,
  },
  
  // Text styles
  text: {
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  
  // Layout styles
  twoColumn: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  column: {
    width: '50%',
    paddingRight: 10,
  },
  
  // Opportunity styles
  opportunity: {
    marginBottom: 20,
  },
  
  // Bullet point styles
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginTop: 5,
    marginRight: 5,
  },
  bulletText: {
    fontSize: 11,
    lineHeight: 1.5,
    flex: 1,
  },
  
  // Numbered list styles
  numberedList: {
    marginTop: 5,
    marginBottom: 10,
  },
  numberedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  number: {
    width: 15,
    fontSize: 11,
    marginRight: 5,
  },
  
  // Table of Contents styles
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tocNumber: {
    width: '5%',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tocText: {
    width: '85%',
    fontSize: 12,
  },
  tocPage: {
    width: '10%',
    fontSize: 12,
    textAlign: 'right',
  },
  
  // Enhanced TOC styles
  tocSection: {
    marginBottom: 20,
    width: '100%',
  },
  tocMainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  tocMainNumber: {
    width: '5%',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  tocMainText: {
    width: '85%',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  tocSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 15,
    width: '100%',
  },
  tocSubNumber: {
    width: '8%',
    fontSize: 11,
    color: '#6B7280',
  },
  tocSubText: {
    width: '82%',
    fontSize: 11,
    color: '#4B5563',
  },
  
  // Callout box styles
  calloutBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    borderLeft: '3pt solid #3B82F6',
  },
  calloutText: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  
  // Axis styles for matrix
  axisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  axisLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1pt solid #E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#6B7280',
  },
  
  // Page number styles
  pageNumber: {
    fontSize: 8,
    color: '#6B7280',
  },
  
  // Contact information styles
  contactInfo: {
    marginTop: 20,
    padding: 15,
    borderTop: '1px solid #E2E8F0',
    borderBottom: '1px solid #E2E8F0',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1E293B'
  },
  contactText: {
    fontSize: 12,
    color: '#4A5568'
  },
});

// Chapter-specific styles
export const chapterStyles = StyleSheet.create({
  textContainer: {
    padding: 40,
    paddingBottom: 65,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1E40AF',
    paddingBottom: 10,
    borderBottom: '1pt solid #E5E7EB',
  },
});

// Cover page styles
export const coverPageStyles = StyleSheet.create({
  textContainer: {
    padding: 40,
    paddingBottom: 65,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
});

// Table of contents styles
export const tocPageStyles = StyleSheet.create({
  textContainer: {
    padding: 40,
    paddingBottom: 65,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#1E40AF',
    paddingBottom: 10,
    borderBottom: '1pt solid #E5E7EB',
  },
});

// Business letter styles
export const businessLetterStyles = StyleSheet.create({
  page: {
    padding: 35,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  letterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  letterheadLogo: {
    width: 120,
    height: 36,
  },
  companyInfo: {
    fontSize: 11,
    textAlign: 'right',
    color: '#4B5563',
    lineHeight: 1.6,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
    borderBottom: '1pt solid #E5E7EB',
  },
  date: {
    fontSize: 12,
    marginBottom: 25,
    color: '#374151',
  },
  greeting: {
    fontSize: 13,
    marginBottom: 25,
    fontWeight: 'bold',
    color: '#111827',
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 20,
    color: '#1F2937',
  },
  signature: {
    marginTop: 40,
    marginBottom: 15,
  },
  signatureImage: {
    width: 150,
    height: 50,
  },
  name: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 30,
    color: '#111827',
  },
  title: {
    fontSize: 12,
    marginTop: 5,
    color: '#374151',
  },
  contact: {
    fontSize: 11,
    marginTop: 8,
    color: '#4B5563',
  },
});

// Closing page styles
export const closingPageStyles = StyleSheet.create({
  textContainer: {
    padding: 40,
    paddingBottom: 65,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
}); 