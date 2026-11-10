// Source: docs/features/homepage.md, section e2e-test-suites (E2E-1, E2E-3, E2E-4, E2E-8).
// Written from the ticket only. Assertions are copied from each case's Expected line.
import { test, expect } from '@playwright/test';

const H1 = 'Every little moment deserves a home.';

const H2S = [
  'A little corner of the internet for everyone who loves each other.',
  'From a pile of photos to a page, in four easy steps.',
  'Start simple, or tell the whole story.',
  'Moments worth keeping',
  'Your family name first, then a page for each memory.',
  'Start with the memory everyone keeps telling.',
];

// Preconditions of the suite: fresh profile, not signed in, 1440 x 900 (config),
// reduced motion off, wait 3 s after load for entrance animations.
async function openHome(page: import('@playwright/test').Page, path = '/') {
  await page.goto(path);
  await page.waitForTimeout(3000);
}

test.describe('Homepage', () => {
  test('homepage E2E-1 structure, headings, ids', async ({ page }) => {
    await openHome(page);

    const step2 = await page.evaluate(() => [
      document.querySelectorAll('header').length,
      !!document.querySelector('main header'),
      document.querySelectorAll('main').length,
      !!document.querySelector('main footer'),
      document.querySelector('h1')?.textContent,
      document.querySelectorAll('h1').length,
      [...document.querySelectorAll('h2')].map((h) => h.textContent),
    ]);
    expect(step2).toEqual([1, false, 1, false, H1, 1, H2S]);

    const tops = await page.evaluate(() =>
      ['who', 'how', 'templates'].map(
        (id) => (document.getElementById(id)?.getBoundingClientRect().top ?? NaN) + scrollY,
      ),
    );
    expect(tops).toHaveLength(3);
    expect(tops.every((n) => Number.isFinite(n))).toBe(true);
    expect(tops[0]).toBeLessThan(tops[1]);
    expect(tops[1]).toBeLessThan(tops[2]);

    const footer = await page.evaluate(() => document.querySelector('footer')?.textContent ?? '');
    expect(footer).toContain('SweetMemories');
    expect(footer).toContain('Small pages for the moments worth keeping.');

    await openHome(page, '/anything');
    expect(await page.evaluate(() => document.querySelector('h1')?.textContent)).toBe(H1);
  });

  test('homepage E2E-3 spot computed values', async ({ page }) => {
    await openHome(page);

    const values = await page.evaluate(() => {
      const h1 = getComputedStyle(document.querySelector('h1')!);
      const band = getComputedStyle(document.querySelector('header')!);
      const tpl = getComputedStyle(document.getElementById('templates')!.parentElement!);
      const cta = [...document.querySelectorAll('a')].find((a) => a.textContent === 'Start with Google');
      const c = cta ? getComputedStyle(cta) : undefined;
      const close = getComputedStyle([...document.querySelectorAll('h2')].at(-1)!.closest('section')!);
      return [
        h1.fontSize,
        h1.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
        h1.fontWeight,
        band.backgroundColor,
        band.borderBottomLeftRadius,
        band.borderBottomRightRadius,
        tpl.backgroundColor,
        tpl.borderTopLeftRadius,
        close.backgroundColor,
        c?.backgroundColor,
        c?.boxShadow,
      ];
    });
    expect(values).toEqual([
      '76px',
      'Fredoka',
      '700',
      'rgb(255, 233, 168)',
      '64px',
      '64px',
      'rgb(255, 255, 255)',
      '64px',
      'rgb(255, 194, 209)',
      'rgb(255, 165, 186)',
      'rgb(229, 126, 152) 0px 6px 0px 0px',
    ]);
  });

  test('homepage E2E-4 in-page links', async ({ page }) => {
    await openHome(page);

    const state = (id: string) =>
      page.evaluate(
        (target) => [
          location.hash,
          (document.getElementById(target)?.getBoundingClientRect().top ?? Infinity) < innerHeight,
        ],
        id,
      );

    await page.getByRole('link', { name: 'Who it is for', exact: true }).click();
    expect(await state('who')).toEqual(['#who', true]);

    await page.getByRole('link', { name: 'How it works', exact: true }).click();
    expect(await state('how')).toEqual(['#how', true]);

    await page.getByRole('link', { name: 'Templates', exact: true }).click();
    expect(await state('templates')).toEqual(['#templates', true]);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole('link', { name: 'See how it works', exact: true }).click();
    expect(await page.evaluate(() => location.hash)).toBe('#how');
  });

  test('homepage E2E-8 responsive', async ({ page }) => {
    await openHome(page);
    for (const width of [320, 375, 768, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await page.reload();
      await page.waitForTimeout(3000);
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(fits, `no horizontal scrollbar at ${width}px`).toBe(true);
    }

    const collageDisplay = (width: number) =>
      page
        .setViewportSize({ width, height: 800 })
        .then(() => page.reload())
        .then(() => page.waitForTimeout(3000))
        .then(() =>
          page.evaluate(() => {
            const el = document.querySelector('[data-testid="hero-collage"]');
            return el ? getComputedStyle(el).display : null;
          }),
        );

    expect(await collageDisplay(559)).toBe('none');
    const at560 = await collageDisplay(560);
    expect(at560).not.toBeNull();
    expect(at560).not.toBe('none');
  });
});
