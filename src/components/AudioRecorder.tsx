import React from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob, filename: string) => void;
  disabled?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, disabled }) => {
  const {
    recording,
    isRecording,
    duration,
    error,
    startRecording,
    stopRecording,
    clearRecording
  } = useAudioRecorder();
  
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast.info('Recording started');
    } catch (err) {
      toast.error('Failed to start recording');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    toast.success('Recording completed');
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !recording) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleUseRecording = () => {
    if (recording) {
      const filename = `recording_${Date.now()}.webm`;
      onAudioReady(recording.blob, filename);
      toast.success('Recording ready for analysis');
    }
  };

  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="medical-card p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">Record Cough Audio</h3>
        <p className="text-muted-foreground">
          Record a clear cough sample for analysis. Ensure you're in a quiet environment.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center space-x-4">
          {!isRecording && !recording && (
            <Button
              onClick={handleStartRecording}
              disabled={disabled}
              className="btn-primary flex items-center space-x-2"
            >
              <Mic className="h-5 w-5" />
              <span>Start Recording</span>
            </Button>
          )}
          
          {isRecording && (
            <Button
              onClick={handleStopRecording}
              className="btn-primary bg-destructive hover:bg-destructive/90 flex items-center space-x-2"
            >
              <Square className="h-5 w-5" />
              <span>Stop Recording</span>
            </Button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center space-x-3 animate-fade-in">
            <div className="w-4 h-4 bg-destructive rounded-full recording-pulse"></div>
            <span className="text-lg font-medium text-foreground">
              {formatDuration(duration)}
            </span>
          </div>
        )}

        {/* Playback Controls */}
        {recording && (
          <div className="w-full space-y-4 animate-fade-in">
            <audio
              ref={audioRef}
              src={recording.url}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="flex items-center space-x-2"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearRecording}
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Duration: {formatDuration(recording.duration)}
              </p>
              <Button
                onClick={handleUseRecording}
                disabled={disabled}
                className="btn-primary flex items-center space-x-2"
              >
                <Upload className="h-5 w-5" />
                <span>Use This Recording</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;