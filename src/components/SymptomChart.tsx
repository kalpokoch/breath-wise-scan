import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Symptom } from '../types/api';

interface SymptomChartProps {
  symptoms: Symptom[];
}

const SymptomChart: React.FC<SymptomChartProps> = ({ symptoms }) => {
  // Sort symptoms by confidence (highest first)
  const sortedSymptoms = [...symptoms].sort((a, b) => b.confidence - a.confidence);
  
  const chartData = sortedSymptoms.map(symptom => ({
    name: symptom.display_name,
    confidence: Math.round(symptom.confidence * 100),
    color: symptom.color
  }));

  const CustomBar = (props: any) => {
    const { payload } = props;
    return <Bar {...props} fill={payload?.color || '#3b82f6'} />;
  };

  return (
    <div className="chart-container animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Detected Symptoms by Confidence
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={70}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Bar 
              dataKey="confidence" 
              radius={[0, 4, 4, 0]}
              animationDuration={1000}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Confidence levels are shown as percentages (0-100%)</p>
      </div>
    </div>
  );
};

export default SymptomChart;