import { useState, useRef, useCallback } from 'react';
import { AudioRecording } from '../types/api';

export interface UseAudioRecorderReturn {
  recording: AudioRecording | null;
  isRecording: boolean;
  duration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);

  // ✅ WebM to WAV conversion function
  const convertWebMToWAV = useCallback(async (webmBlob: Blob): Promise<Blob> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Convert blob to array buffer
      const arrayBuffer = await webmBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert AudioBuffer to WAV
      const wavArrayBuffer = audioBufferToWav(audioBuffer);
      const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
      
      console.log('✅ Successfully converted WebM to WAV');
      return wavBlob;
      
    } catch (error) {
      console.error('⚠️ WebM to WAV conversion failed:', error);
      // Return original blob as fallback
      return webmBlob;
    }
  }, []);

  // ✅ Helper function to convert AudioBuffer to WAV format
  const audioBufferToWav = useCallback((buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const numberOfChannels = Math.min(buffer.numberOfChannels, 2); // Limit to stereo
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // Helper to write string to DataView
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // WAV file header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true); // Bits per sample
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert audio data to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        let sample = channelData[i];
        
        // Clamp sample to [-1, 1] and convert to 16-bit
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1 // Force mono for better compatibility
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // ✅ Try different MIME types for better browser compatibility
      let mimeType = 'audio/webm;codecs=opus';
      
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }
      
      console.log('Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing...');
        
        const originalBlob = new Blob(chunksRef.current, { type: mimeType });
        const finalDuration = Date.now() - startTimeRef.current;
        
        let processedBlob = originalBlob;
        let blobType = mimeType;
        
        // ✅ Convert WebM to WAV for backend compatibility
        if (mimeType.includes('webm') || mimeType.includes('ogg')) {
          console.log('Converting to WAV for backend compatibility...');
          try {
            processedBlob = await convertWebMToWAV(originalBlob);
            blobType = 'audio/wav';
            console.log('✅ Conversion completed');
          } catch (conversionError) {
            console.error('⚠️ Conversion failed, using original format:', conversionError);
            // Keep original blob if conversion fails
          }
        }
        
        // Create new File object with proper extension
        const filename = blobType.includes('wav') ? 
          `recording_${Date.now()}.wav` : 
          `recording_${Date.now()}.webm`;
          
        const file = new File([processedBlob], filename, { type: blobType });
        
        const url = URL.createObjectURL(processedBlob);
        
        setRecording({
          blob: file, // Use File object instead of Blob
          url,
          duration: finalDuration
        });
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        console.log('Recording processed:', {
          filename,
          type: blobType,
          size: processedBlob.size,
          duration: finalDuration
        });
      };
      
      startTimeRef.current = Date.now();
      setDuration(0);
      setIsRecording(true);
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Update duration every 100ms
      intervalRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current);
      }, 100);
      
    } catch (err) {
      console.error('Recording error:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
    }
  }, [convertWebMToWAV]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    if (recording?.url) {
      URL.revokeObjectURL(recording.url);
    }
    setRecording(null);
    setDuration(0);
    setError(null);
  }, [recording]);

  // ✅ Cleanup effect
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (recording?.url) {
      URL.revokeObjectURL(recording.url);
    }
  }, [recording]);

  // Cleanup on unmount
  useState(() => {
    return cleanup;
  });

  return {
    recording,
    isRecording,
    duration,
    error,
    startRecording,
    stopRecording,
    clearRecording
  };
};
