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
import { SiGithub } from '@icons-pack/react-simple-icons';
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
      
      if (!analysisData) {
        throw new Error('No analysis data received from server');
      }
      
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
      
      setResults(safeAnalysisData);
      
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
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl relative z-10">
        {/* Header - Enhanced Responsive */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 animate-fade-in">
          <div className="relative mb-4 sm:mb-6">
            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2 sm:px-0 leading-tight">
              AI Respiratory Health Analyzer
            </h1>
            
            {/* GitHub Link - Responsive Positioning */}
            <a
              href="https://github.com/kalpokoch/breath-wise-scan"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-0 right-0 sm:right-2 md:right-4 p-1.5 sm:p-2 hover:opacity-70 transition-opacity"
              aria-label="View source on GitHub"
            >
              <SiGithub size={32} className="text-foreground sm:w-10 sm:h-10 md:w-12 md:h-12" />
            </a>
          </div>
          
          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl sm:max-w-2xl mx-auto leading-relaxed px-4 sm:px-6">
            Advanced AI-powered respiratory health screening with intelligent symptom detection and health classification
          </p>
        </div>

        {/* Enhanced Medical Disclaimer - Responsive */}
        {!disclaimerDismissed && (
          <Alert className="mb-6 sm:mb-8 border-warning bg-warning/5 animate-fade-in">
            <AlertDescription className="text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-2 flex-1">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-xs sm:text-sm leading-relaxed">
                    <strong className="block sm:inline">Medical Disclaimer:</strong> This is an AI-powered health screening tool for educational and testing purposes only. 
                    Not medically validated or approved. Results should never replace professional medical diagnosis or treatment. 
                    Always consult qualified healthcare providers for medical concerns and before making health-related decisions.
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisclaimerDismissed(true)}
                  className="ml-auto sm:ml-4 text-warning hover:text-warning/80 text-xs sm:text-sm self-start sm:self-auto"
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content - Enhanced Responsive Grid */}
        {!results ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Input Section - Tabs */}
            <div className="w-full">
              <Tabs defaultValue="record" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-auto">
                  <TabsTrigger 
                    value="record" 
                    className="flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 text-xs sm:text-sm"
                    disabled={isAnalyzing}
                  >
                    <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline sm:inline">Record Audio</span>
                    <span className="xs:hidden">Record</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 text-xs sm:text-sm"
                    disabled={isAnalyzing}
                  >
                    <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline sm:inline">Upload File</span>
                    <span className="xs:hidden">Upload</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="record" className="mt-0">
                  <AudioRecorder 
                    onAudioReady={handleAudioSubmission}
                    disabled={isAnalyzing}
                  />
                </TabsContent>
                
                <TabsContent value="upload" className="mt-0">
                  <FileUploader 
                    onFileSelected={handleAudioSubmission}
                    disabled={isAnalyzing}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Info Cards - Enhanced Responsive */}
            <div className="space-y-4 sm:space-y-6">
              {/* How It Works Card */}
              <Card className="medical-card p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                  How It Works
                </h3>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-start space-x-2.5 sm:space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                      Record or upload a clear cough audio sample (3-10 seconds)
                    </p>
                  </div>
                  <div className="flex items-start space-x-2.5 sm:space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                      AI analyzes audio patterns and applies dual-threshold classification
                    </p>
                  </div>
                  <div className="flex items-start space-x-2.5 sm:space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                      Get health classification (Healthy/Symptoms/Inconclusive) with detailed analysis
                    </p>
                  </div>
                </div>
              </Card>

              {/* Features Card */}
              <Card className="medical-card p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                  Features
                </h3>
                <ul className="space-y-2 sm:space-y-2.5 text-muted-foreground">
                  <li className="flex items-start space-x-2 sm:space-x-2.5">
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mt-0.5 sm:mt-1 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base leading-relaxed">Intelligent health classification system</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-2.5">
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 mt-0.5 sm:mt-1 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base leading-relaxed">Multi-symptom detection with confidence scoring</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-2.5">
                    <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 mt-0.5 sm:mt-1 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base leading-relaxed">Advanced threshold-based analysis</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-2.5">
                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 mt-0.5 sm:mt-1 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base leading-relaxed">Real-time processing with detailed reporting</span>
                  </li>
                </ul>
              </Card>

              {/* Best Practices Card */}
              <Card className="medical-card p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                  Best Practices
                </h3>
                <ul className="space-y-2 sm:space-y-2.5 text-muted-foreground">
                  <li className="flex items-start space-x-2 sm:space-x-2.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base leading-relaxed">Record in a quiet environment for best accuracy</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-2.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base leading-relaxed">Cough naturally - avoid forcing or suppressing</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-2.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base leading-relaxed">Maintain consistent distance from microphone</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-2.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base leading-relaxed">Use results as screening only, not diagnosis</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        ) : (
          // Results Display - Enhanced Responsive
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                  Analysis Results
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
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
                className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm w-full sm:w-auto"
              >
                <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>New Analysis</span>
              </Button>
            </div>
            
            <ResultsDisplay 
              results={results} 
              filename={currentFilename}
            />
          </div>
        )}

        {/* Enhanced Loading State - Responsive */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="medical-card p-6 sm:p-8 max-w-sm sm:max-w-md mx-4 w-full">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-primary border-t-transparent"></div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Analyzing Audio
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  AI is processing your audio sample for respiratory patterns...
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="truncate px-2">Processing: {currentFilename}</p>
                  <p>• Audio preprocessing</p>
                  <p>• Feature extraction</p>
                  <p>• Health classification</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Footer - Responsive */}
        <footer className="mt-12 sm:mt-16 text-center text-muted-foreground px-4">
          <p className="text-xs sm:text-sm leading-relaxed">
            AI Respiratory Health Analyzer • Enhanced with Health Classification • For educational and testing purposes only
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
