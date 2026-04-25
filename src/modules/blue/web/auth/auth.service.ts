import { Injectable } from '@nestjs/common';
import { BrowserService } from '../../../../core/browser/browser.service';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';
import { AuthAudit, AuthCredentials, AuthResult } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly browser: BrowserService,
    private readonly logger: LoggerService,
  ) {}

  async auditAuthentication(url: string, credentials?: AuthCredentials): Promise<AuthResult> {
    const page = await this.browser.newPage();
    
    try {
      this.logger.info(`Auditando segurança de autenticação em: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle2' });

      const cookies = await page.cookies();
      const audit: AuthAudit = {
        hasHttps: url.startsWith('https'),
        hasCsrfToken: await this.checkCsrfPresence(page),
        isPasswordVisible: false,
        cookieSecurity: this.analyzeCookies(cookies),
      };

      const formExists = await page.$('input[type="password"]');
      
      if (!formExists) {
        return { url, success: false, audit, error: 'Nenhum formulário de senha detectado.' };
      }

      let loginSuccess = false;
      if (credentials) {
        loginSuccess = await this.attemptLogin(page, credentials);
      }

      await page.close();
      return { url, success: loginSuccess, audit };

    } catch (error) {
      this.logger.error('Erro durante auditoria de Auth', error);
      await page.close();
      throw error;
    }
  }

  private async checkCsrfPresence(page: any): Promise<boolean> {
    return await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="hidden"]'));
      return inputs.some(input => {
        const name = (input as HTMLInputElement).name.toLowerCase();
        return name.includes('csrf') || name.includes('token') || name.includes('hash');
      });
    });
  }

  private analyzeCookies(cookies: any[]): AuthAudit['cookieSecurity'] {
    const sessionCookie = cookies[0] || {};
    return {
      httpOnly: sessionCookie.httpOnly || false,
      secure: sessionCookie.secure || false,
      sameSite: sessionCookie.sameSite || 'None',
    };
  }

  private async attemptLogin(page: any, creds: AuthCredentials): Promise<boolean> {
    try {
      await page.type('input[type="password"]', creds.password);
      
      const userField = await page.$('input[type="text"], input[type="email"]');
      if (userField) await userField.type(creds.username);

      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}),
      ]);

      const currentUrl = page.url();
      return currentUrl !== page.url(); 
    } catch {
      return false;
    }
  }
}