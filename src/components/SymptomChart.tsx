import React from 'react';
import { Symptom } from '../types/api';

interface SymptomChartProps {
  symptoms: Symptom[];
}

const SymptomChart: React.FC<SymptomChartProps> = ({ symptoms }) => {
  const sortedSymptoms = [...symptoms].sort((a, b) => b.confidence - a.confidence);

  if (sortedSymptoms.length === 0) {
    return (
      <div className="chart-container animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Detected Symptoms by Confidence
        </h3>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          No symptoms detected
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Detected Symptoms by Confidence
      </h3>
      
      {/* Chart Area */}
      <div className="space-y-4 p-6">
        {sortedSymptoms.map((symptom, index) => {
          const percentage = Math.round(symptom.confidence * 100);
          return (
            <div key={index} className="flex items-center space-x-4">
              {/* Symptom Label */}
              <div className="w-32 text-sm font-medium text-right text-foreground">
                {symptom.display_name}
              </div>
              
              {/* Bar Container - Full width track */}
              <div className="flex-1 relative">
                {/* Background Track - Full width */}
                <div className="w-full bg-muted rounded-lg h-8 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <div className="w-1/4 h-full border-r border-border/30"></div>
                    <div className="w-1/4 h-full border-r border-border/30"></div>
                    <div className="w-1/4 h-full border-r border-border/30"></div>
                    <div className="w-1/4 h-full"></div>
                  </div>
                  
                  {/* Animated Bar - Proportional width */}
                  <div
                    className="h-full rounded-lg flex items-center justify-center text-white text-sm font-medium absolute left-0 top-0 transition-all duration-1000 ease-out"
                    style={{
                      width: `${percentage}%`, // This should be the actual percentage
                      backgroundColor: symptom.color,
                      transitionDelay: `${index * 100}ms`
                    }}
                  >
                    {percentage >= 15 && (
                      <span className="drop-shadow-sm">{percentage}%</span>
                    )}
                  </div>
                  
                  {/* Text outside bar for small percentages */}
                  {percentage < 15 && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-foreground font-medium">
                      {percentage}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-Axis Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-6">
        <div className="w-32"></div>
        <div className="flex-1 flex justify-between px-4">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Confidence levels are shown as percentages (0-100%)</p>
      </div>
    </div>
  );
};

export default SymptomChart;
