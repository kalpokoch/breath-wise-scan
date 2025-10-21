import React, { useState } from 'react';
import { AlertTriangle, Mic, Upload, RotateCcw, Sparkles, CheckCircle2, Search, Target, BarChart3, Zap } from 'lucide-react';
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


      // Call the API
      const analysisData = await analyzeAudio(audioFile, filename);
      
      console.log('=== 🔍 ENHANCED DATA DEBUG ===');
      console.log('Raw analysisData:', analysisData);
      console.log('Health classification:', analysisData.health_classification);
      console.log('Summary status:', analysisData.summary?.status);
      console.log('Summary status message:', analysisData.summary?.status_message);
      console.log('Weights status:', analysisData.summary?.weights_status);
      console.log('Detected symptoms count:', analysisData.detected_symptoms?.length);
      console.log('Processing info:', analysisData.processing_info);
      console.log('===============================');
      
      // Enhanced validation for new fields
      if (!analysisData) {
        throw new Error('No analysis data received from server');
      }
      
      // Create enhanced safe analysis data with all new fields
      const safeAnalysisData: AnalysisData = {
        detected_symptoms: Array.isArray(analysisData.detected_symptoms) 
          ? analysisData.detected_symptoms 
          : [],
        
        all_symptoms: analysisData.all_symptoms && typeof analysisData.all_symptoms === 'object' 
          ? analysisData.all_symptoms 
          : {},
        
        summary: {
          total_detected: analysisData.summary?.total_detected || 0,
          highest_confidence: analysisData.summary?.highest_confidence || 0,
          max_overall_confidence: analysisData.summary?.max_overall_confidence || 0,
          status: analysisData.summary?.status || 'inconclusive',
          status_message: analysisData.summary?.status_message || 'Analysis completed',
          neutral_threshold: analysisData.summary?.neutral_threshold || 0.35,
          weights_status: analysisData.summary?.weights_status || 'random'
        },
        
        recommendations: Array.isArray(analysisData.recommendations) 
          ? analysisData.recommendations 
          : ['Analysis completed successfully.'],
        
        processing_info: {
          preprocessing_time_ms: analysisData.processing_info?.preprocessing_time_ms || 0,
          inference_time_ms: analysisData.processing_info?.inference_time_ms || 0,
          total_time_ms: analysisData.processing_info?.total_time_ms || 0,
          model_weights_loaded: analysisData.processing_info?.model_weights_loaded || false,
          neutral_threshold: analysisData.processing_info?.neutral_threshold || 0.35,
          max_confidence: analysisData.processing_info?.max_confidence || 0
        },
        
        health_classification: analysisData.health_classification || 'inconclusive'
      };
      
      console.log('✅ Enhanced safe analysis data:', safeAnalysisData);
      console.log('✅ Health classification:', safeAnalysisData.health_classification);
      console.log('✅ Status message:', safeAnalysisData.summary.status_message);
      
      // Enhanced result handling based on health classification
      setResults(safeAnalysisData);
      
      // Enhanced toast messages based on health status (with icons)
      if (safeAnalysisData.health_classification === 'healthy') {
        toast.success('Analysis complete - Healthy!', {
          description: 'No significant symptoms detected',
          icon: <CheckCircle2 className="h-5 w-5" />,
        });
      } else if (safeAnalysisData.health_classification === 'symptoms_detected') {
        toast.success('Analysis complete - Symptoms detected', {
          description: `Found ${safeAnalysisData.summary.total_detected} symptom(s)`,
          icon: <Search className="h-5 w-5" />,
        });
      } else {
        toast.info('Analysis complete - Inconclusive', {
          description: 'Some patterns detected but below threshold',
          icon: <AlertTriangle className="h-5 w-5" />,
        });
      }
      
      // Show model status warning if using random weights
      if (safeAnalysisData.summary.weights_status === 'random') {
        setTimeout(() => {
          toast.warning('Development Mode Active', {
            description: 'Using random weights - results are for testing only',
            duration: 4000
          });
        }, 1000);
      }
      
    } catch (error) {
      console.error('=== 🚨 ENHANCED ERROR DEBUG ===');
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
          <div className="flex justify-center mb-6">
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI Respiratory Health Analyzer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Advanced AI-powered respiratory health screening with intelligent symptom detection and health classification
          </p>
        </div>


        {/* Enhanced Medical Disclaimer */}
        {!disclaimerDismissed && (
          <Alert className="mb-8 border-warning bg-warning/5 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDescription className="text-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Medical Disclaimer:</strong> This is an AI-powered health screening tool for educational and testing purposes only. 
                    Not medically validated or approved. Results should never replace professional medical diagnosis or treatment. 
                    Always consult qualified healthcare providers for medical concerns and before making health-related decisions.
                  </div>
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


            {/* Enhanced Info Cards */}
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
                      Record or upload a clear cough audio sample (3-10 seconds)
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <p className="text-muted-foreground">
                      AI analyzes audio patterns and applies dual-threshold classification
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <p className="text-muted-foreground">
                      Get health classification (Healthy/Symptoms/Inconclusive) with detailed analysis
                    </p>
                  </div>
                </div>
              </Card>


              <Card className="medical-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Features
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Intelligent health classification system</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Search className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Multi-symptom detection with confidence scoring</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <BarChart3 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span>Advanced threshold-based analysis</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Real-time processing with detailed reporting</span>
                  </li>
                </ul>
              </Card>


              <Card className="medical-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Best Practices
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Record in a quiet environment for best accuracy</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Cough naturally - avoid forcing or suppressing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Maintain consistent distance from microphone</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Use results as screening only, not diagnosis</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Analysis Results</h2>
                <p className="text-muted-foreground">
                  Health Classification: <span className={`font-semibold ${
                    results.health_classification === 'healthy' ? 'text-green-600' :
                    results.health_classification === 'symptoms_detected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {results.health_classification === 'healthy' ? 'Healthy' :
                     results.health_classification === 'symptoms_detected' ? 'Symptoms Detected' :
                     'Inconclusive'}
                  </span>
                </p>
              </div>
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


        {/* Enhanced Loading State */}
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
                  AI is processing your audio sample for respiratory patterns...
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Processing: {currentFilename}</p>
                  <p>• Audio preprocessing</p>
                  <p>• Feature extraction</p>
                  <p>• Health classification</p>
                </div>
              </div>
            </Card>
          </div>
        )}


        {/* Footer */}
        <footer className="mt-16 text-center text-muted-foreground">
          <p className="text-sm">
            AI Respiratory Health Analyzer • Enhanced with Health Classification • For educational and testing purposes only
          </p>
        </footer>
      </div>
    </div>
  );
};


export default Index;
