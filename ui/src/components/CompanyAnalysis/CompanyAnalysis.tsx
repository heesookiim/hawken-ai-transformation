import axios from 'axios';
import { getApiBaseUrl } from '@/lib/api';

// Make sure all API calls use the getApiBaseUrl function
const checkCacheStatus = async (companyName: string) => {
  setIsLoading(true);
  setError(null);
  
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.get(`${apiBaseUrl}/api/cache-status/${companyName}`);
    console.log("Cache status response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error checking cache status:", error);
    setError("Failed to check cache status. Please try again.");
    return null;
  } finally {
    setIsLoading(false);
  }
};

const generateAnalysis = async (companyName: string) => {
  setIsLoading(true);
  setError(null);
  
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.post(`${apiBaseUrl}/api/analyze`, { companyName });
    console.log("Analysis response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating analysis:", error);
    setError("Failed to generate analysis. Please try again.");
    return null;
  } finally {
    setIsLoading(false);
  }
}; 