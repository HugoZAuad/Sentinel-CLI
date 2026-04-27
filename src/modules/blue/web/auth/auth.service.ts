import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
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
      await page.goto(url, { waitUntil: 'networkidle2' });

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

      return { url, success: loginSuccess, audit };

    } catch (error) {
      this.logger.error('Erro durante auditoria de Auth', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async checkCsrfPresence(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="hidden"]'));
      return inputs.some(input => {
        const name = (input as HTMLInputElement).name.toLowerCase();
        return name.includes('csrf') || name.includes('token') || name.includes('hash');
      });
    });
  }

  private analyzeCookies(cookies: any[]): AuthAudit['cookieSecurity'] {
    const sessionCookie = cookies.find((cookie) => cookie.httpOnly || cookie.secure) || cookies[0] || {};
    const sameSiteValue = sessionCookie.sameSite;

    return {
      httpOnly: cookies.some((cookie) => cookie.httpOnly),
      secure: cookies.some((cookie) => cookie.secure),
      sameSite: sameSiteValue === 'Strict' || sameSiteValue === 'Lax' || sameSiteValue === 'None'
        ? sameSiteValue
        : 'Unknown',
      analyzedCookies: cookies.length,
    };
  }

  private async attemptLogin(page: Page, creds: AuthCredentials): Promise<boolean> {
    try {
      const startUrl = page.url();
      await page.type('input[type="password"]', creds.password);
      
      const userField = await page.$('input[type="text"], input[type="email"]');
      if (userField) await userField.type(creds.username);

      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}),
      ]);

      const currentUrl = page.url();
      return currentUrl !== startUrl;
    } catch {
      return false;
    }
  }
}