export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Confidence = 'low' | 'medium' | 'high';

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 50,
};

export const CONFIDENCE_WEIGHT: Record<Confidence, number> = {
  low: 0.5,
  medium: 0.8,
  high: 1,
};

export const VULN_SEVERITY: Record<string, Severity> = {
  'XSS': 'high',
  'SQLi': 'critical',
  'Open Redirect': 'medium',
  'LFI': 'high',
  'Brute Force': 'medium',
};