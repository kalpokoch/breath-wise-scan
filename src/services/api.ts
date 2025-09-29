import axios from 'axios';
import { AnalysisResponse } from '../types/api';

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
): Promise<AnalysisResponse> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile, filename);

    const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds timeout
    });

    if (!response.data.success) {
      throw new ApiError(
        response.data.message || 'Analysis failed',
        response.status
      );
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new ApiError('Request timeout. Please try again with a shorter audio file.');
      }
      
      if (error.response) {
        const message = error.response.data?.message || 
                       error.response.data?.detail || 
                       'Analysis failed';
        throw new ApiError(message, error.response.status);
      }
      
      if (error.request) {
        throw new ApiError('Network error. Please check your connection and try again.');
      }
    }
    
    throw new ApiError('An unexpected error occurred during analysis.');
  }
};