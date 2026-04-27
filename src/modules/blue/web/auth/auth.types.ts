export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthAudit {
  hasHttps: boolean;
  hasCsrfToken: boolean;
  isPasswordVisible: boolean;
  cookieSecurity: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None' | 'Unknown';
    analyzedCookies: number;
  };
}

export interface AuthResult {
  url: string;
  success: boolean;
  audit: AuthAudit;
  credentials?: AuthCredentials;
  error?: string;
}

export interface LoginForm {
  action: string;
  method: string;
  inputs: string[];
  hasPasswordField: boolean;
}