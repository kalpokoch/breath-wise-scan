import axios from 'axios';
import { AnalysisData } from '../types/api';

const API_BASE_URL = 'https://kalpokoch-respiratory-symptom-api.hf.space';

export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export const analyzeAudio = async (
  audioFile: File | Blob,
  filename: string
): Promise<AnalysisData> => {
  try {
    const formData = new FormData();
    formData.append('audio_file', audioFile, filename);

    console.log('🚀 Sending request to:', `${API_BASE_URL}/analyze`);
    console.log('📁 File details:', {
      name: filename,
      size: audioFile.size,
      type: audioFile.type || 'unknown'
    });

    const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
      timeout: 60000,
      validateStatus: (status) => status < 500,
    });

    console.log('=== 📊 COMPLETE API RESPONSE DEBUG ===');
    console.log('📈 Response status:', response.status);
    console.log('✅ Response success:', response.data.success);
    console.log('🗂️ Full response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log('🎯 Detected symptoms count:', response.data.data.detected_symptoms?.length || 0);
      console.log('🎯 Detected symptoms:', response.data.data.detected_symptoms);
      console.log('🎯 All symptoms:', response.data.data.all_symptoms);
      console.log('🎯 Summary:', response.data.data.summary);
      console.log('🎯 Processing info:', response.data.data.processing_info);
    }
    console.log('=====================================');

    if (response.status === 200 && response.data.success) {
      const analysisData = response.data.data as AnalysisData;
      
      // Validate and fix data structure
      if (!analysisData) {
        throw new ApiError('No analysis data received from server');
      }
      
      if (!analysisData.detected_symptoms) {
        console.warn('⚠️ No detected_symptoms in response, setting to empty array');
        analysisData.detected_symptoms = [];
      }
      
      if (!analysisData.all_symptoms) {
        console.warn('⚠️ No all_symptoms in response, setting to empty object');
        analysisData.all_symptoms = {};
      }
      
      if (!analysisData.summary) {
        console.warn('⚠️ No summary in response, creating default');
        analysisData.summary = {
          total_detected: analysisData.detected_symptoms.length,
          highest_confidence: analysisData.detected_symptoms.length > 0 
            ? Math.max(...analysisData.detected_symptoms.map(s => s.confidence))
            : 0,
          status: analysisData.detected_symptoms.length > 0 ? 'symptoms_detected' : 'no_symptoms'
        };
      }
      
      if (!analysisData.recommendations) {
        console.warn('⚠️ No recommendations in response, setting to empty array');
        analysisData.recommendations = [];
      }
      
      if (!analysisData.processing_info) {
        console.warn('⚠️ No processing_info in response, creating default');
        analysisData.processing_info = {
          preprocessing_time_ms: 0,
          inference_time_ms: 0,
          total_time_ms: 0
        };
      }
      
      console.log('✅ Final analysis data being returned:', analysisData);
      return analysisData;
    }

    // Handle error responses
    if (response.status >= 400) {
      const errorData = response.data;
      let message = 'Analysis failed';
      
      if (typeof errorData === 'string') {
        message = errorData;
      } else if (errorData?.detail) {
        message = errorData.detail;
      } else if (errorData?.message) {
        message = errorData.message;
      }
      
      throw new ApiError(message, response.status);
    }

    throw new ApiError('Unexpected response format', response.status);

  } catch (error) {
    console.error('=== 🚨 API ERROR DEBUG ===');
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ Error details:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    console.error('==========================');
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new ApiError('Request timeout. Please try again with a shorter audio file.');
      }
      
      if (error.response) {
        const errorData = error.response.data;
        let message = 'Analysis failed';
        
        if (typeof errorData === 'string') {
          message = errorData;
        } else if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
            message = errorData.detail.map((err: any) => err.msg || err.message || String(err)).join(', ');
          } else {
            message = errorData.detail;
          }
        } else if (errorData?.message) {
          message = errorData.message;
        }
        
        throw new ApiError(message, error.response.status);
      }
      
      if (error.request) {
        throw new ApiError('Network error. Please check your connection and try again.');
      }
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError('An unexpected error occurred during analysis.');
  }
};

export const checkApiHealth = async (): Promise<any> => {
  try {
    console.log('🏥 Checking API health...');
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 10000,
    });
    console.log('✅ Health check response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message;
      throw new ApiError(`Health check failed: ${message}`, error.response?.status);
    }
    throw new ApiError('Health check failed');
  }
};

export const getApiInfo = async (): Promise<any> => {
  try {
    console.log('ℹ️ Getting API info...');
    const response = await axios.get(`${API_BASE_URL}/info`, {
      timeout: 10000,
    });
    console.log('✅ API info response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API info failed:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message;
      throw new ApiError(`API info failed: ${message}`, error.response?.status);
    }
    throw new ApiError('API info failed');
  }
};

export const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
  console.log('🔍 Validating audio file:', {
    name: file.name,
    size: file.size,
    type: file.type
  });
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum 10MB allowed.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  // Check file type
  const allowedTypes = [
    'audio/wav', 
    'audio/mpeg', 
    'audio/mp3', 
    'audio/flac', 
    'audio/ogg', 
    'audio/x-m4a',
    'audio/mp4',
    'audio/webm'
  ];
  
  if (file.type && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${file.type}. Supported: WAV, MP3, FLAC, OGG, WebM, M4A` 
    };
  }

  console.log('✅ File validation passed');
  return { valid: true };
};

// Utility function to test API connectivity
export const testApiConnection = async (): Promise<boolean> => {
  try {
    await checkApiHealth();
    return true;
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    return false;
  }
};

// Utility function for debugging - get full API status
export const getFullApiStatus = async () => {
  try {
    console.log('🔍 Getting full API status...');
    
    const [health, info] = await Promise.allSettled([
      checkApiHealth(),
      getApiInfo()
    ]);

    const status = {
      health: health.status === 'fulfilled' ? health.value : { error: health.reason?.message },
      info: info.status === 'fulfilled' ? info.value : { error: info.reason?.message },
      timestamp: new Date().toISOString()
    };

    console.log('📊 Full API status:', status);
    return status;
  } catch (error) {
    console.error('❌ Failed to get full API status:', error);
    throw error;
  }
};
