import React from 'react';
import { InvestmentScheme } from '../types';
import { ProjectionCalculator } from './ProjectionCalculator';

interface NPSCalculatorProps {
  schemes: InvestmentScheme[];
  onApplyScheme?: (schemeName: string, amount: number) => void;
  customerName?: string;
}

export const NPSCalculator: React.FC<NPSCalculatorProps> = (props) => (
  <ProjectionCalculator kind="nps" {...props} />
);
