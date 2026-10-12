import React from 'react';
import { InvestmentScheme } from '../types';
import { ProjectionCalculator } from './ProjectionCalculator';

interface MutualFundCalculatorProps {
  schemes: InvestmentScheme[];
  onApplyScheme?: (schemeName: string, amount: number) => void;
  customerName?: string;
}

export const MutualFundCalculator: React.FC<MutualFundCalculatorProps> = (props) => (
  <ProjectionCalculator kind="mutual_fund" {...props} />
);
