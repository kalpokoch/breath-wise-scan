import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Copy, FileText, AlertTriangle, CheckCircle, Clock, Activity, 
  XCircle, Info, ThumbsUp, ThumbsDown, ChevronDown, Share2, Mail, 
  Printer, TrendingUp, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { AnalysisData } from '../types/api';
import SymptomChart from './SymptomChart';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResultsDisplayProps {
  results: AnalysisData;
  filename: string;
}

interface FeedbackData {
  sessionId: string;
  timestamp: string;
  filename: string;
  feedback: 'correct' | 'incorrect';
  analysisResults: AnalysisData;
  healthClassification: string;
  symptomsDetected: number;
  highestConfidence: number;
}

interface HistoricalAnalysis {
  timestamp: string;
  filename: string;
  results: AnalysisData;
  id: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, filename }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [hoveredSymptom, setHoveredSymptom] = useState<string | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [historicalData, setHistoricalData] = useState<HistoricalAnalysis[]>([]);
  const [selectedComparison, setSelectedComparison] = useState<HistoricalAnalysis | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Generate or retrieve session ID
  const getSessionId = (): string => {
    let sessionId = localStorage.getItem('respiratory_session_id');
    
    if (!sessionId) {
      sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      localStorage.setItem('respiratory_session_id', sessionId);
    }
    
    return sessionId;
  };

  // Load historical data
  useEffect(() => {
    const historyKey = 'analysis_history';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    setHistoricalData(history);

    // Store current analysis
    const newEntry: HistoricalAnalysis = {
      timestamp: new Date().toISOString(),
      filename,
      results,
      id: `analysis_${Date.now()}`
    };
    const updatedHistory = [...history, newEntry].slice(-10); // Keep last 10
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
  }, [results, filename]);

  // Chart loading simulation
  useEffect(() => {
    const timer = setTimeout(() => setChartLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Check if feedback already submitted
  useEffect(() => {
    const feedbackKey = `feedback_${filename}_${results.processing_info.total_time_ms}`;
    const existingFeedback = localStorage.getItem(feedbackKey);
    
    if (existingFeedback) {
      const parsed = JSON.parse(existingFeedback);
      setFeedbackSubmitted(true);
      setSubmittedFeedback(parsed.feedback);
    }
  }, [filename, results.processing_info.total_time_ms]);

  // Toggle expandable sections
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Handle feedback submission
  const handleFeedback = (feedbackType: 'correct' | 'incorrect') => {
    const sessionId = getSessionId();
    
    const feedbackData: FeedbackData = {
      sessionId,
      timestamp: new Date().toISOString(),
      filename,
      feedback: feedbackType,
      analysisResults: results,
      healthClassification: results.health_classification,
      symptomsDetected: results.summary.total_detected,
      highestConfidence: results.summary.highest_confidence,
    };

    const feedbackKey = `feedback_${filename}_${results.processing_info.total_time_ms}`;
    localStorage.setItem(feedbackKey, JSON.stringify(feedbackData));

    const historyKey = 'respiratory_feedback_history';
    const existingHistory = localStorage.getItem(historyKey);
    const history: FeedbackData[] = existingHistory ? JSON.parse(existingHistory) : [];
    history.push(feedbackData);
    localStorage.setItem(historyKey, JSON.stringify(history));

    setFeedbackSubmitted(true);
    setSubmittedFeedback(feedbackType);

    toast.success(
      feedbackType === 'correct' 
        ? '✓ Thank you! Your feedback helps improve our model.' 
        : '✓ Thank you for your feedback. We\'ll use this to enhance accuracy.',
      { duration: 4000 }
    );
  };

  // Download functions
  const downloadJSON = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_${filename}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Results downloaded as JSON');
  };

  const downloadPDF = async () => {
    if (!chartRef.current) return;
    
    try {
      toast.loading('Generating PDF...');
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      pdf.setFontSize(20);
      pdf.text('Respiratory Symptom Analysis Report', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text(`File: ${filename}`, 20, 45);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 55);
      pdf.text(`Health Status: ${results.summary.status_message}`, 20, 65);
      
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 80, imgWidth, imgHeight);
      
      let yPosition = 80 + imgHeight + 20;
      pdf.setFontSize(14);
      pdf.text('Summary:', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(11);
      pdf.text(`Health Classification: ${results.health_classification}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Total symptoms detected: ${results.summary.total_detected}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Highest confidence: ${Math.round(results.summary.highest_confidence * 100)}%`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Processing time: ${results.processing_info.total_time_ms.toFixed(1)}ms`, 20, yPosition);
      
      if (results.recommendations.length > 0 && yPosition < 220) {
        yPosition += 15;
        pdf.setFontSize(14);
        pdf.text('Recommendations:', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(10);
        results.recommendations.forEach((rec) => {
          const lines = pdf.splitTextToSize(rec, 170);
          lines.forEach((line: string) => {
            if (yPosition < 270) {
              pdf.text(line, 20, yPosition);
              yPosition += 5;
            }
          });
          yPosition += 3;
        });
      }
      
      pdf.save(`analysis_${filename}_${Date.now()}.pdf`);
      toast.dismiss();
      toast.success('Results downloaded as PDF');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };

  const copyToClipboard = () => {
    const text = `
Respiratory Symptom Analysis Results
File: ${filename}
Generated: ${new Date().toLocaleString()}

Health Classification: ${results.health_classification}
Status: ${results.summary.status_message}

Summary:
- Total symptoms detected: ${results.summary.total_detected}
- Highest confidence: ${Math.round(results.summary.highest_confidence * 100)}%
- Max overall confidence: ${Math.round(results.summary.max_overall_confidence * 100)}%
- Processing time: ${results.processing_info.total_time_ms.toFixed(1)}ms

Detected Symptoms:
${results.detected_symptoms
  .map(s => `- ${s.display_name}: ${Math.round(s.confidence * 100)}%`)
  .join('\n') || '- None detected'}

Recommendations:
${results.recommendations.map(rec => `- ${rec}`).join('\n')}

Note: This is an AI-powered screening tool for informational purposes only.
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast.success('Results copied to clipboard');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Respiratory Analysis Results - ${filename}`);
    const body = encodeURIComponent(`
Health Status: ${results.health_classification}
Symptoms Detected: ${results.summary.total_detected}
Confidence: ${Math.round(results.summary.highest_confidence * 100)}%

Please see the attached detailed report.
    `);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success('Opening email client...');
  };

  // Helper functions
  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.includes('⚠️') || recommendation.toLowerCase().includes('warning')) {
      return <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />;
    }
    if (recommendation.includes('✅') || recommendation.toLowerCase().includes('good') || recommendation.toLowerCase().includes('healthy')) {
      return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
    }
    if (recommendation.includes('🚨') || recommendation.toLowerCase().includes('urgent') || recommendation.toLowerCase().includes('consult')) {
      return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    }
    return <Info className="h-4 w-4 text-primary flex-shrink-0" />;
  };

  const cleanRecommendationText = (text: string) => {
    return text.replace(/[⚠️✅🚨]/g, '').trim();
  };

  const getHealthGradient = () => {
    if (results.health_classification === 'healthy') {
      return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950';
    } else if (results.health_classification === 'symptoms_detected') {
      return 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950';
    }
    return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return 'text-red-600 dark:text-red-400';
    if (confidence > 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 0.7) return 'High confidence';
    if (confidence > 0.4) return 'Moderate confidence';
    return 'Low confidence';
  };

  return (
    <TooltipProvider>
      <motion.div 
        className="space-y-6"
        ref={chartRef}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Health Status Banner */}
        <motion.div variants={itemVariants}>
          <div className={`p-6 rounded-lg ${getHealthGradient()} border-l-4 ${
            results.health_classification === 'healthy' ? 'border-green-500' :
            results.health_classification === 'symptoms_detected' ? 'border-red-500' : 'border-yellow-500'
          } shadow-sm`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {results.health_classification === 'healthy' ? (
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                ) : results.health_classification === 'symptoms_detected' ? (
                  <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                ) : (
                  <Activity className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {results.summary.status_message}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analysis completed for {filename}
                  </p>
                </div>
              </div>
              <Badge 
                variant={results.health_classification === 'healthy' ? 'default' : 'destructive'}
                className="text-lg px-4 py-2"
              >
                {results.health_classification === 'healthy' ? 'Healthy' :
                 results.health_classification === 'symptoms_detected' ? 'Symptoms Detected' : 'Inconclusive'}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Card className="medical-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  results.health_classification === 'healthy' 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : results.health_classification === 'symptoms_detected'
                    ? 'bg-red-100 dark:bg-red-900'
                    : 'bg-yellow-100 dark:bg-yellow-900'
                }`}>
                  {results.health_classification === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : results.health_classification === 'symptoms_detected' ? (
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <Activity className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Health Status</p>
                  <p className={`text-lg font-bold ${
                    results.health_classification === 'healthy' 
                      ? 'text-green-700 dark:text-green-300' 
                      : results.health_classification === 'symptoms_detected'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {results.health_classification === 'healthy' ? 'Clear' :
                     results.health_classification === 'symptoms_detected' ? 'Warning' : 'Uncertain'}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="medical-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Symptoms Detected</p>
                  <p className="text-2xl font-bold text-foreground">
                    {results.summary.total_detected}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="medical-card p-4 hover:shadow-md transition-shadow cursor-help">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Highest Confidence</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(results.summary.highest_confidence * 100)}%
                      </p>
                    </div>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-semibold mb-1">Confidence Score Explained</p>
                <p className="text-xs">
                  This represents the model's certainty in detecting the primary symptom. 
                  Higher values indicate stronger detection signals.
                </p>
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Threshold: {Math.round(results.summary.neutral_threshold * 100)}%
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="medical-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Clock className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Processing Time</p>
                  <p className="text-2xl font-bold text-foreground">
                    {results.processing_info.total_time_ms.toFixed(1)}ms
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Model Status Warning */}
        {results.summary.weights_status === 'random' && (
          <motion.div variants={itemVariants}>
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <strong>Development Mode:</strong> The model is currently using random weights. 
                For accurate medical predictions, trained model weights need to be properly loaded.
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  Current results are for testing purposes only and should not be used for medical decisions.
                </span>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Expandable Analysis Details */}
        <motion.div variants={itemVariants}>
          <Card className="medical-card overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
              onClick={() => toggleSection('details')}
              role="button"
              tabIndex={0}
              aria-expanded={expandedSections.has('details')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSection('details');
                }
              }}
            >
              <h4 className="text-sm font-semibold text-foreground">Analysis Details</h4>
              <motion.div
                animate={{ rotate: expandedSections.has('details') ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </div>
            <AnimatePresence>
              {expandedSections.has('details') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-4 pb-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="font-medium">{results.summary.status_message}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Neutral Threshold:</span>
                        <p className="font-medium">{Math.round(results.summary.neutral_threshold * 100)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Confidence:</span>
                        <p className="font-medium">{Math.round(results.summary.max_overall_confidence * 100)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model Weights:</span>
                        <p className={`font-medium ${results.summary.weights_status === 'trained' ? 'text-green-600' : 'text-orange-600'}`}>
                          {results.summary.weights_status === 'trained' ? 'Trained' : 'Random (Dev)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Detected Symptoms with Progress Bars */}
        {results.detected_symptoms.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="medical-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Detected Symptoms
              </h3>
              <div className="space-y-4">
                {results.detected_symptoms.map((symptom, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    onHoverStart={() => setHoveredSymptom(symptom.display_name)}
                    onHoverEnd={() => setHoveredSymptom(null)}
                    className="relative p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-foreground">{symptom.display_name}</p>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-xs">
                                Detection confidence for this respiratory symptom based on audio analysis
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Badge 
                          variant={symptom.confidence > 0.7 ? 'destructive' : symptom.confidence > 0.4 ? 'secondary' : 'outline'}
                          className="ml-2"
                        >
                          {Math.round(symptom.confidence * 100)}%
                        </Badge>
                      </div>
                      <Progress 
                        value={symptom.confidence * 100} 
                        className="h-2"
                      />
                      <p className={`text-xs ${getConfidenceColor(symptom.confidence)}`}>
                        {getConfidenceLabel(symptom.confidence)}
                      </p>
                    </div>

                    <AnimatePresence>
                      {hoveredSymptom === symptom.display_name && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 top-full left-0 right-0 mt-2 p-3 bg-popover rounded-lg shadow-xl border"
                        >
                          <p className="text-xs font-semibold mb-1">Additional Information:</p>
                          <p className="text-xs text-muted-foreground">
                            This symptom was detected with {Math.round(symptom.confidence * 100)}% confidence. 
                            {symptom.confidence > 0.7 && ' Consider consulting a healthcare professional.'}
                            {symptom.confidence <= 0.7 && symptom.confidence > 0.4 && ' Monitor for changes.'}
                            {symptom.confidence <= 0.4 && ' Low confidence detection.'}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Chart with Loading State */}
        {results.detected_symptoms.length > 0 && (
          <motion.div variants={itemVariants}>
            {chartLoading ? (
              <Card className="medical-card p-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </Card>
            ) : (
              <SymptomChart symptoms={results.detected_symptoms} />
            )}
          </motion.div>
        )}

        {/* Historical Comparison */}
        {historicalData.length > 1 && (
          <motion.div variants={itemVariants}>
            <Card className="medical-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">Historical Comparison</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setComparisonMode(!comparisonMode)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {comparisonMode ? 'Exit' : 'Compare'}
                </Button>
              </div>
              
              <AnimatePresence>
                {comparisonMode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {historicalData.slice(-5).reverse().map((item, idx) => (
                        <Button
                          key={item.id}
                          variant={selectedComparison?.id === item.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedComparison(item)}
                          className="whitespace-nowrap"
                        >
                          {new Date(item.timestamp).toLocaleDateString()} {idx === 0 && '(Current)'}
                        </Button>
                      ))}
                    </div>

                    {selectedComparison && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-xs font-medium mb-2 text-muted-foreground">Current Analysis</p>
                          <p className="text-sm">Symptoms: <span className="font-bold">{results.summary.total_detected}</span></p>
                          <p className="text-sm">Confidence: <span className="font-bold">{Math.round(results.summary.highest_confidence * 100)}%</span></p>
                          <p className="text-sm">Status: <span className="font-bold">{results.health_classification}</span></p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-2 text-muted-foreground">Selected Analysis</p>
                          <p className="text-sm">Symptoms: <span className="font-bold">{selectedComparison.results.summary.total_detected}</span></p>
                          <p className="text-sm">Confidence: <span className="font-bold">{Math.round(selectedComparison.results.summary.highest_confidence * 100)}%</span></p>
                          <p className="text-sm">Status: <span className="font-bold">{selectedComparison.results.health_classification}</span></p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}

        {/* Recommendations */}
        {results.recommendations.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="medical-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recommendations
              </h3>
              <ul className="space-y-3">
                {results.recommendations.map((recommendation, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {getRecommendationIcon(recommendation)}
                    <p className="text-foreground leading-relaxed">
                      {cleanRecommendationText(recommendation)}
                    </p>
                  </motion.li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {/* Feedback Section */}
        <motion.div variants={itemVariants}>
          <Card className="medical-card p-6 border-2 border-primary/20">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Was this analysis accurate?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your feedback helps us improve the model's accuracy and reliability
                </p>
              </div>
              
              {!feedbackSubmitted ? (
                <motion.div 
                  className="flex justify-center gap-4"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={() => handleFeedback('correct')}
                    variant="outline"
                    size="lg"
                    className="flex items-center space-x-2 border-green-300 hover:bg-green-50 hover:border-green-400 dark:border-green-700 dark:hover:bg-green-950 transition-all"
                  >
                    <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium">Correct</span>
                  </Button>
                  
                  <Button
                    onClick={() => handleFeedback('incorrect')}
                    variant="outline"
                    size="lg"
                    className="flex items-center space-x-2 border-red-300 hover:bg-red-50 hover:border-red-400 dark:border-red-700 dark:hover:bg-red-950 transition-all"
                  >
                    <ThumbsDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="font-medium">Incorrect</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-lg ${
                    submittedFeedback === 'correct'
                      ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {submittedFeedback === 'correct' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-700 dark:text-green-300">
                        Thank you! Feedback recorded as Correct
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="font-medium text-red-700 dark:text-red-300">
                        Thank you! Feedback recorded as Incorrect
                      </span>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Export Dialog */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-wrap gap-3 justify-center">
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
              <DialogTrigger asChild>
                <Button variant="default" size="lg" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Export & Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Export Analysis Results</DialogTitle>
                  <DialogDescription>
                    Choose how you'd like to export or share your analysis
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button 
                    onClick={() => {
                      downloadPDF();
                      setShowExportDialog(false);
                    }} 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                  >
                    <FileText className="h-8 w-8" />
                    <div className="text-center">
                      <span className="font-medium">PDF Report</span>
                      <p className="text-xs text-muted-foreground">Full report</p>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      downloadJSON();
                      setShowExportDialog(false);
                    }} 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                  >
                    <Download className="h-8 w-8" />
                    <div className="text-center">
                      <span className="font-medium">JSON Data</span>
                      <p className="text-xs text-muted-foreground">Raw data</p>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      copyToClipboard();
                      setShowExportDialog(false);
                    }} 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                  >
                    <Copy className="h-8 w-8" />
                    <div className="text-center">
                      <span className="font-medium">Copy Text</span>
                      <p className="text-xs text-muted-foreground">Plain text</p>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      shareViaEmail();
                      setShowExportDialog(false);
                    }} 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                  >
                    <Mail className="h-8 w-8" />
                    <div className="text-center">
                      <span className="font-medium">Email</span>
                      <p className="text-xs text-muted-foreground">Send via email</p>
                    </div>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => window.print()}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </motion.div>

        {/* Floating Quick Actions (Optional - shows on scroll) */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 hidden md:flex bg-background rounded-full shadow-2xl border px-6 py-3 gap-1"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={downloadPDF}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download PDF</TooltipContent>
          </Tooltip>
          
          <div className="h-6 w-px bg-border" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy to Clipboard</TooltipContent>
          </Tooltip>
          
          <div className="h-6 w-px bg-border" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print</TooltipContent>
          </Tooltip>
          
          <div className="h-6 w-px bg-border" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={shareViaEmail}>
                <Mail className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share via Email</TooltipContent>
          </Tooltip>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
};

export default ResultsDisplay;
