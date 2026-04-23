import puppeteer from 'puppeteer';
import { InteractionEngine } from '../interaction/interaction.engine';
import { PayloadMutator } from '../payload/payload.mutator';
import { VulnResult } from '../vuln.types';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export class DomXssCheck {
  private mutator = new PayloadMutator();
  private interaction = new InteractionEngine();

  async test(url: string, params: string[]): Promise<VulnResult[]> {
    const results: VulnResult[] = [];

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();

    const marker = this.mutator.generateMarker();
    const payload = this.mutator.buildDynamicPayload(marker);

    await page.exposeFunction('reportSink', (data: any) => {
      results.push(data);
    });

    await page.evaluateOnNewDocument((marker) => {
      const report = (sink: string, value: string) => {
        if (value.includes(marker)) {
          // @ts-ignore
          window.reportSink({
            type: 'DOM XSS',
            payload: value,
            evidence: `${sink} recebeu payload`,
          });
        }
      };

      const wrap = (obj: any, prop: string) => {
        const original = obj[prop];
        if (!original) return;

        obj[prop] = function (...args: any[]) {
          const arg = args[0];
          if (typeof arg === 'string') {
            report(prop, arg);
          }
          return original.apply(this, args);
        };
      };

      wrap(document, 'write');
      wrap(window, 'eval');
      wrap(window, 'setTimeout');
      wrap(window, 'setInterval');

      const hookSetter = (proto: any, prop: string) => {
        const desc = Object.getOwnPropertyDescriptor(proto, prop);
        if (!desc || !desc.set) return;

        Object.defineProperty(proto, prop, {
          set(value) {
            if (typeof value === 'string') {
              report(prop, value);
            }
            // @ts-ignore
            return desc.set.call(this, value);
          },
        });
      };

      hookSetter(Element.prototype, 'innerHTML');
      hookSetter(Element.prototype, 'outerHTML');

      const originalInsert = Element.prototype.insertAdjacentHTML;
      Element.prototype.insertAdjacentHTML = function (pos, html) {
        report('insertAdjacentHTML', html);
        return originalInsert.call(this, pos, html);
      };
    }, marker);

    for (const param of params) {
      const testUrl = `${url}?${param}=${encodeURIComponent(payload)}`;

      try {
        await page.goto(testUrl, {
          waitUntil: 'networkidle2',
          timeout: 8000,
        });

        await this.interaction.simulate(page);

        await sleep(1500);
      } catch {}
    }

    await browser.close();

    return results.map(r => ({
      type: r.type,
      url,
      param: 'unknown',
      payload: r.payload,
      evidence: r.evidence,
    }));
  }
}