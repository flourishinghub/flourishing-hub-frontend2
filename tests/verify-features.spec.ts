import { test, expect, request as playwrightRequest } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000/api/v1';

const CREDS = {
  admin:      { email: 'admin@iitb.ac.in',                password: 'Admin@123',     frontendRole: 'admin' },
  student:    { email: 'rahul.sharma@iitb.ac.in',         password: 'Rahul@123',     frontendRole: 'student' },
  assoc:      { email: 'associate.instructor@iitb.ac.in', password: 'Associate@123', frontendRole: 'associate-instructor' },
  volunteer:  { email: 'volunteer@iitb.ac.in',            password: 'Volunteer@123', frontendRole: 'volunteer' },
  instructor: { email: 'instructor@iitb.ac.in',           password: 'Instructor@123',frontendRole: 'instructor' },
};

const tokens: Record<string, string> = {};
const users: Record<string, any> = {};

test.describe('Flourishing Hub Feature Verification', () => {

  test.beforeAll(async () => {
    const ctx = await playwrightRequest.newContext();
    for (const [role, cred] of Object.entries(CREDS)) {
      try {
        const resp = await ctx.post(`${API_URL}/auth/login`, {
          data: { email: cred.email, password: cred.password }
        });
        const body = await resp.json();
        if (resp.status() === 200 && body.data?.accessToken) {
          tokens[role] = body.data.accessToken;
          users[role] = body.data.user || {};
          console.log(`[beforeAll] ${role} ✅`);
        } else {
          console.warn(`[beforeAll] ${role} FAIL: ${resp.status()} ${body.message}`);
        }
      } catch (e: any) {
        console.warn(`[beforeAll] ${role} ERROR: ${e.message}`);
      }
    }
    await ctx.dispose();
  }, 60000);

  // Inject session via addInitScript (runs BEFORE React hydrates)
  async function injectAndNavigate(page: any, role: keyof typeof CREDS, path: string) {
    const token = tokens[role];
    const user = users[role];
    const { frontendRole } = CREDS[role];
    expect(token, `Token for ${role} must exist from beforeAll`).toBeTruthy();

    // addInitScript runs before page scripts — localStorage is ready when React reads it
    await page.addInitScript(({ token, user, frontendRole }: any) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...user, role: frontendRole }));
    }, { token, user, frontendRole });

    // Cookie for middleware (use url for localhost compatibility)
    await page.context().addCookies([{
      name: 'token',
      value: token,
      url: 'http://localhost:3000',
    }]);

    await page.goto(`${BASE_URL}${path}`);

    // Wait for initial page render, then wait for loading spinners to disappear
    await page.waitForLoadState('domcontentloaded');
    // Wait up to 20s for ANY button to appear (tabs render after data load)
    await page.waitForSelector('button', { timeout: 20000 });
    // Extra buffer for sequential API calls to complete
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return !text.includes('Loading dashboard...');
    }, { timeout: 20000 });

    const url = page.url();
    console.log(`[session:${role}] URL after load: ${url}`);
  }

  // ─────────────────────────────────────────────
  // BACKEND TESTS
  // ─────────────────────────────────────────────
  test('Backend: All 5 role logins return valid JWT tokens', async () => {
    for (const role of Object.keys(CREDS)) {
      const token = tokens[role];
      expect(token, `${role} must have token`).toBeTruthy();
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log(`✅ ${role} — JWT role=${payload.role}`);
    }
  });

  test('Backend: ASSOCIATE_INSTRUCTOR role fixed in DB and JWT', async ({ page }) => {
    const token = tokens['assoc'];
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    expect(payload.role).toBe('ASSOCIATE_INSTRUCTOR');
    expect(users['assoc']?.role).toBe('ASSOCIATE_INSTRUCTOR');
    console.log(`✅ JWT role: ${payload.role}, DB role: ${users['assoc']?.role}`);

    const resp = await page.request.get(`${API_URL}/users?role=ASSOCIATE_INSTRUCTOR`, {
      headers: { Authorization: `Bearer ${tokens['admin']}` }
    });
    const body = await resp.json();
    expect(resp.status()).toBe(200);
    expect(body.success).toBe(true);
    console.log(`✅ Filter API: found ${body.data?.items?.length ?? 0} user(s) with ASSOCIATE_INSTRUCTOR`);
  });

  test('Backend: GET /notifications returns valid structure', async ({ page }) => {
    const resp = await page.request.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokens['student']}` }
    });
    const body = await resp.json();
    expect(resp.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.notifications)).toBe(true);
    expect(typeof body.data.unreadCount).toBe('number');
    console.log(`✅ Notifications API — unreadCount=${body.data.unreadCount}`);
  });

  test('Backend: GET /admin/analytics/workshops returns array', async ({ page }) => {
    const resp = await page.request.get(`${API_URL}/admin/analytics/workshops`, {
      headers: { Authorization: `Bearer ${tokens['admin']}` }
    });
    const body = await resp.json();
    console.log(`[analytics] count=${Array.isArray(body.data) ? body.data.length : 'N/A'} status=${resp.status()}`);
    expect(resp.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    console.log('✅ Analytics API OK');
  });

  test('Backend: Registration endpoint — auth gate and event lookup', async ({ page }) => {
    const unauth = await page.request.post(`${API_URL}/registrations`, {
      data: { eventId: 'fake', asVolunteer: false }
    });
    expect(unauth.status()).toBe(401);
    console.log(`✅ Unauthenticated → 401`);

    const auth = await page.request.post(`${API_URL}/registrations`, {
      data: { eventId: 'nonexistent-id-xyz', asVolunteer: false },
      headers: { Authorization: `Bearer ${tokens['student']}` }
    });
    const authBody = await auth.json();
    console.log(`[reg-auth] status=${auth.status()} msg=${authBody.message}`);
    expect(auth.status()).not.toBe(401);
    console.log(`✅ Auth passes, event lookup runs → ${auth.status()}`);
  });

  // ─────────────────────────────────────────────
  // FRONTEND TESTS
  // ─────────────────────────────────────────────
  test('Frontend: Admin page loads with Analytics tab', async ({ page }) => {
    // Capture console errors for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[browser error] ${msg.text().substring(0, 100)}`);
    });

    await injectAndNavigate(page, 'admin', '/admin');
    await page.screenshot({ path: 'tests/screenshots/admin-loaded.png' });

    // Print all button texts for debug
    const allBtns = await page.locator('button').allTextContents();
    console.log('[admin buttons]', allBtns.map(t => t.trim()).filter(Boolean).slice(0, 20));

    const analyticsTab = page.locator('button').filter({ hasText: 'Analytics' });
    await expect(analyticsTab).toBeVisible({ timeout: 10000 });
    console.log('✅ Analytics tab visible');

    await analyticsTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/admin-analytics.png' });

    const analyticsContent = page.getByText(/Workshop Analytics|No completed workshops/i).first();
    await expect(analyticsContent).toBeVisible({ timeout: 8000 });
    console.log('✅ Analytics content rendered');
  });

  test('Frontend: Admin Events tab has Drafts and Bulk Import', async ({ page }) => {
    await injectAndNavigate(page, 'admin', '/admin');

    // exact match — "Events" tab, not "New Events" or "Event Status"
    const eventsTab = page.getByRole('button', { name: /^Events$/ });
    await expect(eventsTab).toBeVisible({ timeout: 10000 });
    await eventsTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/admin-events-tab.png' });

    const allBtns = await page.locator('button').allTextContents();
    console.log('[events-tab btns]', allBtns.map(t => t.trim()).filter(Boolean).slice(0, 20));

    const draftsBtn = page.locator('button').filter({ hasText: /Drafts/i }).first();
    await expect(draftsBtn).toBeVisible({ timeout: 8000 });
    console.log('✅ Drafts button visible');

    const bulkBtn = page.locator('button').filter({ hasText: /Bulk Import/i }).first();
    await expect(bulkBtn).toBeVisible({ timeout: 8000 });
    console.log('✅ Bulk Import button visible');

    await bulkBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'tests/screenshots/admin-bulk-import.png' });
    await expect(page.getByText(/Bulk Import/i).first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Bulk Import modal opens');
  });

  test('Frontend: Student event page has My History sidebar', async ({ page }) => {
    await injectAndNavigate(page, 'student', '/student/events');
    await page.screenshot({ path: 'tests/screenshots/student-events.png' });

    const eventLinks = page.locator('a[href*="/student/events/"]');
    const count = await eventLinks.count();
    console.log(`[student-events] ${count} event cards found`);

    if (count > 0) {
      await eventLinks.first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/student-event-detail.png' });

      const historySection = page.getByText(/My History/i).first();
      await expect(historySection).toBeVisible({ timeout: 8000 });
      console.log('✅ My History sidebar visible');
    } else {
      console.log('⚠️ No events in DB — feature code present, nothing to display');
      test.skip(true, 'No events in DB');
    }
  });

  test('Frontend: All role dashboards load successfully', async ({ page }) => {
    const checks: Array<[keyof typeof CREDS, string, string]> = [
      ['student',    '/student/events', 'student'],
      ['admin',      '/admin',          'admin'],
      ['instructor', '/instructor',     'instructor'],
    ];

    for (const [role, path, _fr] of checks) {
      // Re-add initScript for each role iteration
      await page.addInitScript(({ token, user, frontendRole }: any) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ ...user, role: frontendRole }));
      }, { token: tokens[role], user: users[role], frontendRole: CREDS[role].frontendRole });

      await page.context().addCookies([{
        name: 'token', value: tokens[role], url: 'http://localhost:3000'
      }]);

      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const url = page.url();
      const bodyText = await page.textContent('body') ?? '';
      console.log(`[${role}] URL=${url} bodyLen=${bodyText.length}`);
      expect(bodyText.length, `${role} dashboard should have content`).toBeGreaterThan(100);
      await page.screenshot({ path: `tests/screenshots/dashboard-${role}.png` });
      console.log(`✅ ${role} dashboard loaded`);
    }
  });
});
