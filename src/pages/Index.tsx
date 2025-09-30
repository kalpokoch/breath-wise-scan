import React, { useState } from 'react';
import { AlertTriangle, Mic, Upload, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AudioRecorder from '../components/AudioRecorder';
import FileUploader from '../components/FileUploader';
import ResultsDisplay from '../components/ResultsDisplay';
import { analyzeAudio } from '../services/api';
import { AnalysisData } from '../types/api';
import { toast } from 'sonner';
import heroBackground from '@/assets/hero-background.png';

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisData | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false);

  const handleAudioSubmission = async (audioFile: File | Blob, filename: string) => {
    setIsAnalyzing(true);
    setCurrentFilename(filename);
    
    toast.info('Processing audio...', {
      description: 'Analyzing your audio for respiratory symptoms',
      duration: 3000,
    });

    try {
      console.log('🚀 Starting audio analysis for:', filename);
      console.log('📁 File details:', {
        name: filename,
        size: audioFile.size,
        type: audioFile.type
      });

      // ✅ Call the API
      const analysisData = await analyzeAudio(audioFile, filename);
      
      console.log('=== 🔍 RECEIVED DATA DEBUG ===');
      console.log('Raw analysisData:', analysisData);
      console.log('Type of analysisData:', typeof analysisData);
      console.log('Is analysisData null/undefined?', analysisData == null);
      
      if (analysisData) {
        console.log('analysisData keys:', Object.keys(analysisData));
        console.log('detected_symptoms exists?', 'detected_symptoms' in analysisData);
        console.log('detected_symptoms value:', analysisData.detected_symptoms);
        console.log('detected_symptoms type:', typeof analysisData.detected_symptoms);
        console.log('all_symptoms exists?', 'all_symptoms' in analysisData);
        console.log('summary exists?', 'summary' in analysisData);
        console.log('recommendations exists?', 'recommendations' in analysisData);
        console.log('processing_info exists?', 'processing_info' in analysisData);
      }
      console.log('===============================');
      
      // ✅ CRITICAL: Validate and sanitize the response
      if (!analysisData) {
        throw new Error('No analysis data received from server');
      }
      
      // ✅ Create a safe, fully validated analysis data object
      const safeAnalysisData: AnalysisData = {
        detected_symptoms: (() => {
          if (Array.isArray(analysisData.detected_symptoms)) {
            return analysisData.detected_symptoms;
          } else {
            console.warn('⚠️ detected_symptoms is not an array:', analysisData.detected_symptoms);
            return [];
          }
        })(),
        
        all_symptoms: (() => {
          if (analysisData.all_symptoms && typeof analysisData.all_symptoms === 'object') {
            return analysisData.all_symptoms;
          } else {
            console.warn('⚠️ all_symptoms is not an object:', analysisData.all_symptoms);
            return {};
          }
        })(),
        
        summary: (() => {
          if (analysisData.summary && typeof analysisData.summary === 'object') {
            return {
              total_detected: analysisData.summary.total_detected || 0,
              highest_confidence: analysisData.summary.highest_confidence || 0,
              status: analysisData.summary.status || 'no_symptoms'
            };
          } else {
            console.warn('⚠️ summary is missing, creating default');
            const detectedCount = Array.isArray(analysisData.detected_symptoms) 
              ? analysisData.detected_symptoms.length 
              : 0;
            return {
              total_detected: detectedCount,
              highest_confidence: detectedCount > 0 
                ? Math.max(...(analysisData.detected_symptoms || []).map((s: any) => s.confidence || 0))
                : 0,
              status: detectedCount > 0 ? 'symptoms_detected' : 'no_symptoms'
            };
          }
        })(),
        
        recommendations: (() => {
          if (Array.isArray(analysisData.recommendations)) {
            return analysisData.recommendations;
          } else {
            console.warn('⚠️ recommendations is not an array:', analysisData.recommendations);
            return ['Analysis completed successfully.'];
          }
        })(),
        
        processing_info: (() => {
          if (analysisData.processing_info && typeof analysisData.processing_info === 'object') {
            return {
              preprocessing_time_ms: analysisData.processing_info.preprocessing_time_ms || 0,
              inference_time_ms: analysisData.processing_info.inference_time_ms || 0,
              total_time_ms: analysisData.processing_info.total_time_ms || 0,
              model_status: analysisData.processing_info.model_status
            };
          } else {
            console.warn('⚠️ processing_info is missing, creating default');
            return {
              preprocessing_time_ms: 0,
              inference_time_ms: 0,
              total_time_ms: 0
            };
          }
        })()
      };
      
      console.log('✅ Safe analysis data created:', safeAnalysisData);
      console.log('✅ Detected symptoms count:', safeAnalysisData.detected_symptoms.length);
      console.log('✅ Summary total detected:', safeAnalysisData.summary.total_detected);
      
      // ✅ Display results based on detected symptoms
      if (safeAnalysisData.detected_symptoms.length > 0) {
        setResults(safeAnalysisData);
        toast.success('Analysis complete!', {
          description: `Found ${safeAnalysisData.summary.total_detected} symptoms`,
        });
      } else {
        toast.info('No significant symptoms detected', {
          description: 'The analysis did not identify any symptoms above the confidence threshold',
        });
        setResults(safeAnalysisData); // Still show results even if no symptoms
      }
      
    } catch (error) {
      console.error('=== 🚨 ANALYSIS ERROR DEBUG ===');
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Full error object:', error);
      console.error('===================================');
      
      toast.error('Analysis failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setCurrentFilename('');
    setIsAnalyzing(false);
    console.log('🔄 Analysis reset');
  };

  return (
    <div className="min-h-screen medical-gradient relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI Respiratory Symptom Analyzer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Analyze cough sounds for potential respiratory symptoms using advanced AI technology
          </p>
        </div>

        {/* Medical Disclaimer */}
        {!disclaimerDismissed && (
          <Alert className="mb-8 border-warning bg-warning/5 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDescription className="text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <strong>⚠️ Medical Disclaimer:</strong> This is an AI-powered screening tool for testing purposes only. 
                  Not medically validated. Not a substitute for professional medical diagnosis. 
                  Consult healthcare providers for medical advice.
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisclaimerDismissed(true)}
                  className="ml-4 text-warning hover:text-warning/80"
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {!results ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Tabs defaultValue="record" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="record" 
                  className="flex items-center space-x-2"
                  disabled={isAnalyzing}
                >
                  <Mic className="h-4 w-4" />
                  <span>Record Audio</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center space-x-2"
                  disabled={isAnalyzing}
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload File</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="record">
                <AudioRecorder 
                  onAudioReady={handleAudioSubmission}
                  disabled={isAnalyzing}
                />
              </TabsContent>
              
              <TabsContent value="upload">
                <FileUploader 
                  onFileSelected={handleAudioSubmission}
                  disabled={isAnalyzing}
                />
              </TabsContent>
            </Tabs>

            {/* Info Cards */}
            <div className="space-y-6">
              <Card className="medical-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  How It Works
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <p className="text-muted-foreground">
                      Record or upload a clear cough audio sample
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <p className="text-muted-foreground">
                      Our AI analyzes the audio for respiratory patterns
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <p className="text-muted-foreground">
                      Get detailed results with confidence levels and recommendations
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="medical-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Best Practices
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Record in a quiet environment</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Cough naturally, don't force it</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Keep the microphone at arm's length</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Use uncompressed formats when possible</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Analysis Results</h2>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>New Analysis</span>
              </Button>
            </div>
            
            <ResultsDisplay 
              results={results} 
              filename={currentFilename}
            />
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="medical-card p-8 max-w-md mx-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Analyzing Audio
                </h3>
                <p className="text-muted-foreground">
                  Please wait while our AI processes your audio sample...
                </p>
                <p className="text-xs text-muted-foreground">
                  Processing: {currentFilename}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-muted-foreground">
          <p className="text-sm">
            AI Respiratory Symptom Analyzer • For testing and educational purposes only
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
