export interface Symptom {
  symptom: string;
  display_name: string;
  confidence: number;
  color: string;
  threshold_used?: number;  // ✅ New field from backend
}

export interface AllSymptoms {
  [key: string]: {
    display_name: string;
    confidence: number;
    detected: boolean;
    original_threshold: number;  // ✅ Updated from backend
    effective_threshold: number;  // ✅ New field
    neutral_threshold: number;  // ✅ New field
    color: string;
  };
}

export interface Summary {
  total_detected: number;
  highest_confidence: number;
  max_overall_confidence: number;  // ✅ New field
  status: 'healthy' | 'symptoms_detected' | 'inconclusive';  // ✅ Enhanced status types
  status_message: string;  // ✅ New field
  neutral_threshold: number;  // ✅ New field
  weights_status: 'trained' | 'random';  // ✅ New field
}

export interface ProcessingInfo {
  preprocessing_time_ms: number;
  inference_time_ms: number;
  total_time_ms: number;
  model_weights_loaded: boolean;  // ✅ Updated field
  neutral_threshold: number;  // ✅ New field
  max_confidence: number;  // ✅ New field
}

export interface AnalysisData {
  detected_symptoms: Symptom[];
  all_symptoms: AllSymptoms;
  summary: Summary;
  recommendations: string[];
  processing_info: ProcessingInfo;
  health_classification: 'healthy' | 'symptoms_detected' | 'inconclusive';  // ✅ New field
}

export interface AnalysisResponse {
  success: boolean;
  data: AnalysisData;
  metadata: {
    filename: string;
    file_size_bytes: number;
    content_type?: string;
    timestamp: number;
    api_version?: string;  // ✅ New field
  };
}

export interface AudioRecording {
  blob: Blob | File;
  url: string;
  duration: number;
}
