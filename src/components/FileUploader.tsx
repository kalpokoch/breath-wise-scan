import React, { useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileSelected: (file: File, filename: string) => void;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, disabled }) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/flac', 'audio/ogg', 'audio/m4a'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().match(/\.(wav|mp3|flac|ogg|m4a)$/)) {
      toast.error('Please upload a valid audio file (WAV, MP3, FLAC, OGG, M4A)');
      return false;
    }
    
    if (file.size > MAX_SIZE) {
      toast.error('File size must be less than 10MB');
      return false;
    }
    
    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      toast.success('Audio file selected successfully');
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleUploadClick = () => {
    if (selectedFile) {
      onFileSelected(selectedFile, selectedFile.name);
      toast.success('File ready for analysis');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="medical-card p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">Upload Audio File</h3>
        <p className="text-muted-foreground">
          Upload a cough audio file (WAV, MP3, FLAC, OGG, M4A) up to 10MB
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-8 transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {!selectedFile ? (
          <div className="text-center space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-lg font-medium text-foreground">
                Drag and drop your audio file here
              </p>
              <p className="text-muted-foreground">or click to browse</p>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="btn-secondary"
            >
              Browse Files
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4 animate-fade-in">
            <File className="h-12 w-12 text-primary mx-auto" />
            <div>
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <div className="flex justify-center space-x-3">
              <Button
                onClick={handleUploadClick}
                disabled={disabled}
                className="btn-primary flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Use This File</span>
              </Button>
              <Button
                variant="outline"
                onClick={clearFile}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Remove</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,.mp3,.flac,.ogg,.m4a,audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Supported formats: WAV, MP3, FLAC, OGG, M4A</p>
        <p>• Maximum file size: 10MB</p>
        <p>• For best results, use clear, uncompressed audio</p>
      </div>
    </div>
  );
};

export default FileUploader;