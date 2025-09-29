export interface Symptom {
  symptom: string;
  display_name: string;
  confidence: number;
  color: string;
}

export interface AllSymptoms {
  fever: number;
  cold: number;
  sorethroat: number;
  lossofsmell: number;
  fatigue: number;
  cough: number;
}

export interface Summary {
  total_detected: number;
  highest_confidence: number;
  status: string;
}

export interface ProcessingInfo {
  preprocessing_time_ms: number;
  inference_time_ms: number;
  total_time_ms: number;
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
    timestamp: number;
  };
}

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}