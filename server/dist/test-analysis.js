import { runAnalysisTest } from './utils/test-analyzer';
// Simple wrapper to call the test function
console.log('Starting AI Transformation Analysis Test');
// Simply run the test without any module checks
runAnalysisTest()
    .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
})
    .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
