export interface Symptom {
  symptom: string;
  display_name: string;
  confidence: number;
  color: string;
}

// ✅ FIXED: AllSymptoms should match backend structure
export interface AllSymptoms {
  [key: string]: {
    display_name: string;
    confidence: number;
    detected: boolean;
    threshold: number;
    color: string;
  };
}

export interface Summary {
  total_detected: number;
  highest_confidence: number;
  status: string;
}

// ✅ FIXED: Added missing fields from backend
export interface ProcessingInfo {
  preprocessing_time_ms: number;
  inference_time_ms: number;
  total_time_ms: number;
  model_status?: string; // ✅ Added this field
}

export interface AnalysisData {
  detected_symptoms: Symptom[];
  all_symptoms: AllSymptoms;
  summary: Summary;
  recommendations: string[];
  processing_info: ProcessingInfo;
}

export interface AnalysisResponse {
  success: boolean;
  data: AnalysisData;
  metadata: {
    filename: string;
    file_size_bytes: number;
    content_type?: string; // ✅ Added optional field
    timestamp: number;
  };
}

export interface AudioRecording {
  blob: Blob | File; // ✅ Allow File objects too
  url: string;
  duration: number;
}
