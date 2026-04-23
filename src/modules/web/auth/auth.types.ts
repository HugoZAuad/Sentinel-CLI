export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResult {
  url: string;
  success: boolean;
  credentials?: AuthCredentials;
  cookies?: Record<string, string>;
  error?: string;
}

export interface LoginForm {
  action: string;
  method: 'GET' | 'POST';
  usernameField: string;
  passwordField: string;
}