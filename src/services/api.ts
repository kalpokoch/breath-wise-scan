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

    console.log('=== 📊 ENHANCED API RESPONSE DEBUG ===');
    console.log('📈 Response status:', response.status);
    console.log('✅ Response success:', response.data.success);
    console.log('🗂️ Full response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      const data = response.data.data;
      console.log('🎯 Health classification:', data.health_classification);
      console.log('🎯 Detected symptoms count:', data.detected_symptoms?.length || 0);
      console.log('🎯 Detected symptoms:', data.detected_symptoms);
      console.log('🎯 All symptoms:', data.all_symptoms);
      console.log('🎯 Summary:', data.summary);
      console.log('🎯 Summary status:', data.summary?.status);
      console.log('🎯 Summary status message:', data.summary?.status_message);
      console.log('🎯 Weights status:', data.summary?.weights_status);
      console.log('🎯 Neutral threshold:', data.summary?.neutral_threshold);
      console.log('🎯 Processing info:', data.processing_info);
    }
    console.log('==========================================');

    if (response.status === 200 && response.data.success) {
      const rawData = response.data.data;
      
      // ✅ ENHANCED: Create fully validated AnalysisData with all new fields
      const analysisData: AnalysisData = {
        // Core analysis data
        detected_symptoms: Array.isArray(rawData.detected_symptoms) 
          ? rawData.detected_symptoms 
          : [],
        
        all_symptoms: rawData.all_symptoms && typeof rawData.all_symptoms === 'object' 
          ? rawData.all_symptoms 
          : {},
        
        // ✅ Enhanced summary with all new fields
        summary: {
          total_detected: rawData.summary?.total_detected ?? 0,
          highest_confidence: rawData.summary?.highest_confidence ?? 0,
          max_overall_confidence: rawData.summary?.max_overall_confidence ?? 0,  // ✅ New field
          status: rawData.summary?.status ?? 'inconclusive',
          status_message: rawData.summary?.status_message ?? 'Analysis completed',  // ✅ New field
          neutral_threshold: rawData.summary?.neutral_threshold ?? 0.35,  // ✅ New field
          weights_status: rawData.summary?.weights_status ?? 'random'  // ✅ New field
        },
        
        recommendations: Array.isArray(rawData.recommendations) 
          ? rawData.recommendations 
          : ['Analysis completed successfully.'],
        
        // ✅ Enhanced processing_info with all new fields
        processing_info: {
          preprocessing_time_ms: rawData.processing_info?.preprocessing_time_ms ?? 0,
          inference_time_ms: rawData.processing_info?.inference_time_ms ?? 0,
          total_time_ms: rawData.processing_info?.total_time_ms ?? 0,
          model_weights_loaded: rawData.processing_info?.model_weights_loaded ?? false,  // ✅ Updated field
          neutral_threshold: rawData.processing_info?.neutral_threshold ?? 0.35,  // ✅ New field
          max_confidence: rawData.processing_info?.max_confidence ?? 0  // ✅ New field
        },
        
        // ✅ New health classification field
        health_classification: rawData.health_classification ?? 'inconclusive'
      };

      // ✅ Enhanced validation logging
      console.log('=== ✅ ENHANCED VALIDATION RESULTS ===');
      console.log('Health classification:', analysisData.health_classification);
      console.log('Status:', analysisData.summary.status);
      console.log('Status message:', analysisData.summary.status_message);
      console.log('Weights status:', analysisData.summary.weights_status);
      console.log('Total detected:', analysisData.summary.total_detected);
      console.log('Neutral threshold:', analysisData.summary.neutral_threshold);
      console.log('Max overall confidence:', analysisData.summary.max_overall_confidence);
      console.log('Model weights loaded:', analysisData.processing_info.model_weights_loaded);
      console.log('Recommendations count:', analysisData.recommendations.length);
      console.log('=====================================');

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
    console.error('=== 🚨 ENHANCED API ERROR DEBUG ===');
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ Error details:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
      console.error('❌ Response headers:', error.response.headers);
    }
    console.error('========================================');
    
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

// ✅ Enhanced health check with detailed model status
export const checkApiHealth = async (): Promise<any> => {
  try {
    console.log('🏥 Checking enhanced API health...');
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 10000,
    });
    
    const healthData = response.data;
    console.log('✅ Enhanced health check response:', healthData);
    
    // ✅ Log enhanced health status details
    if (healthData) {
      console.log('🔍 Service ready:', healthData.service_ready);
      console.log('🔍 Model loaded:', healthData.model_loaded);
      console.log('🔍 Model weights status:', healthData.model_weights_status);
      console.log('🔍 Health classification enabled:', healthData.health_classification_enabled);
      console.log('🔍 Neutral threshold:', healthData.neutral_threshold);
      console.log('🔍 Files found:', healthData.files_found);
      console.log('🔍 Critical files missing:', healthData.critical_files_missing);
    }
    
    return healthData;
  } catch (error) {
    console.error('❌ Enhanced health check failed:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message;
      throw new ApiError(`Health check failed: ${message}`, error.response?.status);
    }
    throw new ApiError('Health check failed');
  }
};

// ✅ Enhanced API info with model features
export const getApiInfo = async (): Promise<any> => {
  try {
    console.log('ℹ️ Getting enhanced API info...');
    const response = await axios.get(`${API_BASE_URL}/info`, {
      timeout: 10000,
    });
    
    const infoData = response.data;
    console.log('✅ Enhanced API info response:', infoData);
    
    // ✅ Log enhanced API features
    if (infoData) {
      console.log('🔍 Model version:', infoData.model_info?.version);
      console.log('🔍 Weights loaded:', infoData.model_info?.weights_loaded);
      console.log('🔍 Neutral threshold:', infoData.model_info?.neutral_threshold);
      console.log('🔍 Health classifications:', infoData.model_info?.health_classifications);
      console.log('🔍 Features available:', infoData.features);
      console.log('🔍 API version:', infoData.api_version);
    }
    
    return infoData;
  } catch (error) {
    console.error('❌ Enhanced API info failed:', error);
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

  // ✅ Enhanced file type support including WebM
  const allowedTypes = [
    'audio/wav', 
    'audio/mpeg', 
    'audio/mp3', 
    'audio/flac', 
    'audio/ogg', 
    'audio/x-m4a',
    'audio/mp4',
    'audio/webm'  // ✅ WebM support for browser recordings
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

// ✅ Enhanced connectivity test with health classification check
export const testApiConnection = async (): Promise<{ connected: boolean; features: any }> => {
  try {
    const healthData = await checkApiHealth();
    return {
      connected: true,
      features: {
        modelLoaded: healthData.model_loaded,
        weightsStatus: healthData.model_weights_status,
        healthClassificationEnabled: healthData.health_classification_enabled,
        neutralThreshold: healthData.neutral_threshold,
        filesFound: healthData.files_found
      }
    };
  } catch (error) {
    console.error('❌ Enhanced API connection test failed:', error);
    return {
      connected: false,
      features: null
    };
  }
};

// ✅ Enhanced full API status with all new features
export const getFullApiStatus = async () => {
  try {
    console.log('🔍 Getting comprehensive API status...');
    
    const [health, info] = await Promise.allSettled([
      checkApiHealth(),
      getApiInfo()
    ]);

    const status = {
      health: health.status === 'fulfilled' ? health.value : { error: health.reason?.message },
      info: info.status === 'fulfilled' ? info.value : { error: info.reason?.message },
      timestamp: new Date().toISOString(),
      // ✅ Enhanced status summary
      summary: {
        apiOperational: health.status === 'fulfilled',
        modelLoaded: health.status === 'fulfilled' ? health.value?.model_loaded : false,
        weightsStatus: health.status === 'fulfilled' ? health.value?.model_weights_status : 'unknown',
        healthClassificationEnabled: health.status === 'fulfilled' ? health.value?.health_classification_enabled : false,
        featuresAvailable: info.status === 'fulfilled' ? info.value?.features : null
      }
    };

    console.log('📊 Comprehensive API status:', status);
    return status;
  } catch (error) {
    console.error('❌ Failed to get comprehensive API status:', error);
    throw error;
  }
};

// ✅ New utility: Test specific health classification features
export const testHealthClassificationFeatures = async (): Promise<{
  available: boolean;
  neutralThreshold: number | null;
  weightsLoaded: boolean;
  classifications: string[];
}> => {
  try {
    const [health, info] = await Promise.all([checkApiHealth(), getApiInfo()]);
    
    return {
      available: health.health_classification_enabled || false,
      neutralThreshold: health.neutral_threshold || info.model_info?.neutral_threshold || null,
      weightsLoaded: health.model_weights_status === 'trained',
      classifications: info.model_info?.health_classifications || ['healthy', 'symptoms_detected', 'inconclusive']
    };
  } catch (error) {
    console.error('❌ Health classification feature test failed:', error);
    return {
      available: false,
      neutralThreshold: null,
      weightsLoaded: false,
      classifications: []
    };
  }
};

// ✅ New utility: Quick model status check
export const getModelStatus = async (): Promise<{
  loaded: boolean;
  weightsStatus: 'trained' | 'random' | 'unknown';
  neutralThreshold: number | null;
  filesFound: number;
}> => {
  try {
    const health = await checkApiHealth();
    
    return {
      loaded: health.model_loaded || false,
      weightsStatus: health.model_weights_status || 'unknown',
      neutralThreshold: health.neutral_threshold || null,
      filesFound: health.files_found || 0
    };
  } catch (error) {
    console.error('❌ Model status check failed:', error);
    return {
      loaded: false,
      weightsStatus: 'unknown',
      neutralThreshold: null,
      filesFound: 0
    };
  }
};
