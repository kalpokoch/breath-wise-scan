import React from 'react';
import { Download, Copy, FileText, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnalysisData } from '../types/api';
import SymptomChart from './SymptomChart';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResultsDisplayProps {
  results: AnalysisData;
  filename: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, filename }) => {
  const chartRef = React.useRef<HTMLDivElement>(null);

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
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('Respiratory Symptom Analysis Report', 20, 30);
      
      // Add filename and timestamp
      pdf.setFontSize(12);
      pdf.text(`File: ${filename}`, 20, 45);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 55);
      pdf.text(`Health Status: ${results.summary.status_message}`, 20, 65);
      
      // Add chart image
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 80, imgWidth, imgHeight);
      
      // Add enhanced summary
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
      yPosition += 8;
      pdf.text(`Model status: ${results.summary.weights_status} weights`, 20, yPosition);
      
      // Add recommendations if they fit
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
      toast.success('Results downloaded as PDF');
    } catch (error) {
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
- Model status: ${results.summary.weights_status} weights
- Neutral threshold: ${Math.round(results.summary.neutral_threshold * 100)}%

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

  return (
    <div className="space-y-6 animate-fade-in" ref={chartRef}>
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Classification Card - NEW */}
        <Card className={`medical-card p-4 ${
          results.health_classification === 'healthy' 
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
            : results.health_classification === 'symptoms_detected'
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
        }`}>
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
                {results.health_classification === 'healthy' ? 'Healthy' :
                 results.health_classification === 'symptoms_detected' ? 'Symptoms' : 'Inconclusive'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="medical-card p-4">
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
        
        <Card className="medical-card p-4">
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
        
        <Card className="medical-card p-4">
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
      </div>

      {/* Model Status Warning - NEW */}
      {results.summary.weights_status === 'random' && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>⚠️ Development Mode:</strong> The model is currently using random weights. 
            For accurate medical predictions, trained model weights need to be properly loaded.
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              Current results are for testing purposes only and should not be used for medical decisions.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Details Card - NEW */}
      <Card className="medical-card p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Analysis Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
      </Card>

      {/* Chart */}
      {results.detected_symptoms.length > 0 && (
        <SymptomChart symptoms={results.detected_symptoms} />
      )}

      {/* Health Status Message - NEW */}
      <Card className="medical-card p-6">
        <div className="text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
            results.health_classification === 'healthy' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : results.health_classification === 'symptoms_detected'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {results.health_classification === 'healthy' ? (
              <CheckCircle className="h-4 w-4" />
            ) : results.health_classification === 'symptoms_detected' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            <span>{results.summary.status_message}</span>
          </div>
        </div>
      </Card>

      {/* Detected Symptoms List */}
      {results.detected_symptoms.length > 0 && (
        <Card className="medical-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Detected Symptoms
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.detected_symptoms
              .sort((a, b) => b.confidence - a.confidence)
              .map((symptom, index) => (
                <div
                  key={symptom.symptom}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: symptom.color }}
                    />
                    <span className="font-medium text-foreground">
                      {symptom.display_name}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-background">
                    {Math.round(symptom.confidence * 100)}%
                  </Badge>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {results.recommendations.length > 0 && (
        <Card className="medical-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recommendations
          </h3>
          <ul className="space-y-3">
            {results.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  recommendation.includes('⚠️') ? 'bg-orange-500' :
                  recommendation.includes('✅') ? 'bg-green-500' :
                  recommendation.includes('🚨') ? 'bg-red-500' :
                  'bg-primary'
                }`} />
                <p className="text-foreground leading-relaxed">{recommendation}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          onClick={downloadJSON}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download JSON</span>
        </Button>
        
        <Button
          onClick={downloadPDF}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Save as PDF</span>
        </Button>
        
        <Button
          onClick={copyToClipboard}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Copy className="h-4 w-4" />
          <span>Copy Results</span>
        </Button>
      </div>
    </div>
  );
};

export default ResultsDisplay;
