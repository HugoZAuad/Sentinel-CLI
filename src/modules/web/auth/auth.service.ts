import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';
import { AuthCredentials, AuthResult, LoginForm } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly http: HttpService) {}

  async detectLoginForm(url: string): Promise<LoginForm | null> {
    try {
      const res = await this.http.get(url);
      if (!res) return null;

      return this.parseLoginForm(res.data, url);
    } catch {
      return null;
    }
  }

  async tryLogin(form: LoginForm, credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const data: Record<string, string> = {
        [form.usernameField]: credentials.username,
        [form.passwordField]: credentials.password,
      };

      const res =
        form.method === 'POST'
          ? await this.http.post(form.action, data)
          : await this.http.get(
              `${form.action}?${new URLSearchParams(data).toString()}`
            );

      if (!res) {
        return {
          url: form.action,
          success: false,
          error: 'Sem resposta',
        };
      }

      const success = this.detectLoginSuccess(res.data, res.status);

      return {
        url: form.action,
        success,
        credentials: success ? credentials : undefined,
      };
    } catch {
      return {
        url: form.action,
        success: false,
        error: 'Falha ao tentar autenticação',
      };
    }
  }

  private parseLoginForm(body: string, baseUrl: string): LoginForm | null {
    const hasPassword = body.includes('type="password"');
    if (!hasPassword) return null;

    return {
      action: baseUrl,
      method: 'POST',
      usernameField: 'username',
      passwordField: 'password',
    };
  }

  private detectLoginSuccess(body: string, status: number): boolean {
    if (status === 302) return true;

    const lower = body.toLowerCase();

    return ![
      'invalid',
      'incorrect',
      'error',
      'failed',
    ].some(i => lower.includes(i));
  }
}