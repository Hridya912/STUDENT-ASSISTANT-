/**
 * Automated Test Suite for Grok Student Assistant
 * Tests file integrity, landing page requirements, chatbot functionality,
 * serverless function edge cases, input validation, and API contracts.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './api/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
  }
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

console.log('\n--- 1. STATIC FILES & INTEGRITY CHECKS ---');

runTest('Required project files exist', () => {
  const files = [
    'index.html',
    'app.html',
    'landing.css',
    'landing.js',
    'style.css',
    'script.js',
    'api/chat.js',
    'server.js',
    'package.json',
    'vercel.json',
    '.env.example',
    '.gitignore'
  ];

  for (const f of files) {
    const fullPath = path.join(__dirname, f);
    assert.ok(fs.existsSync(fullPath), `File ${f} must exist`);
  }
});

runTest('index.html contains all landing page sections and required copy', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes('Cloud Computing | CAT-3 Project'), 'Contains CAT-3 badge');
  assert.ok(html.includes('Your questions deserve'), 'Contains hero title start');
  assert.ok(html.includes('better answers.'), 'Contains hero title highlighted phrase');
  assert.ok(html.includes('Learning, made simpler.'), 'Contains Intro heading');
  assert.ok(html.includes('Instant AI Answers'), 'Contains Feature 1');
  assert.ok(html.includes('Simple Learning'), 'Contains Feature 2');
  assert.ok(html.includes('Cloud Powered'), 'Contains Feature 3');
  assert.ok(html.includes('Fast Content Delivery'), 'Contains Feature 4');
  assert.ok(html.includes('STEP 1'), 'Contains Step 1');
  assert.ok(html.includes('STEP 2'), 'Contains Step 2');
  assert.ok(html.includes('STEP 3'), 'Contains Step 3');
  assert.ok(html.includes('STEP 4'), 'Contains Step 4');
  assert.ok(html.includes('Powered by Cloud Technology'), 'Contains Architecture heading');
  assert.ok(html.includes('Grok AI model <strong>does not</strong> run inside the Vercel CDN'), 'Contains CDN clarification');
  assert.ok(html.includes('Ready to learn something new?'), 'Contains CTA heading');
  assert.ok(html.includes('Open AI Assistant'), 'Contains CTA button text');
  assert.ok(html.includes('app.html'), 'Links to chatbot app.html');
});

runTest('landing.css implements light SaaS theme with delicate gradients', () => {
  const css = fs.readFileSync(path.join(__dirname, 'landing.css'), 'utf8');
  assert.ok(css.includes('--bg-main: #FBFBFC'), 'Light off-white background');
  assert.ok(css.includes('--lavender'), 'Soft lavender variables defined');
  assert.ok(css.includes('--powder-blue'), 'Powder blue variables defined');
  assert.ok(css.includes('--mint'), 'Subtle mint green variables defined');
  assert.ok(css.includes('browser-window'), 'Browser window preview style');
});

runTest('app.html preserves chatbot interface and links back to home', () => {
  const appHtml = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
  assert.ok(appHtml.includes('chat-panel'), 'Contains chat panel');
  assert.ok(appHtml.includes('question-input'), 'Contains question input');
  assert.ok(appHtml.includes('href="/"'), 'Links back to home');
  assert.ok(appHtml.includes('script.js'), 'Links to script.js');
});

runTest('No API keys exposed in frontend code', () => {
  const files = ['index.html', 'app.html', 'landing.js', 'script.js'];
  for (const f of files) {
    const content = fs.readFileSync(path.join(__dirname, f), 'utf8');
    assert.ok(!content.includes('xai-'), `No key leaked in ${f}`);
    assert.ok(!content.includes('sk-'), `No key leaked in ${f}`);
  }
});

console.log('\n--- 2. SERVERLESS FUNCTION (api/chat.js) VALIDATION CHECKS ---');

await runAsyncTest('Rejects non-POST requests with HTTP 405', async () => {
  const req = { method: 'GET', body: {} };
  const res = createMockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.body?.error, 'Method not allowed. Please use POST.');
});

await runAsyncTest('Rejects empty message with HTTP 400', async () => {
  const req = { method: 'POST', body: { message: '' } };
  const res = createMockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.error, 'Please enter a question.');
});

await runAsyncTest('Rejects message exceeding 2000 characters with HTTP 400', async () => {
  const longMessage = 'A'.repeat(2001);
  const req = { method: 'POST', body: { message: longMessage } };
  const res = createMockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body?.error?.includes('2,000 characters'));
});

await runAsyncTest('Returns HTTP 500 when XAI_API_KEY is not configured', async () => {
  const oldKey = process.env.XAI_API_KEY;
  delete process.env.XAI_API_KEY;
  try {
    const req = { method: 'POST', body: { message: 'Explain cloud computing' } };
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body?.error, 'The AI service is not configured. Please contact the project owner.');
  } finally {
    if (oldKey) process.env.XAI_API_KEY = oldKey;
  }
});

console.log('\n--- 3. MOCKED xAI API SUCCESS & ERROR RESPONSES ---');

await runAsyncTest('Successfully parses output_text from xAI Responses API', async () => {
  const originalFetch = globalThis.fetch;
  process.env.XAI_API_KEY = 'mock-key-for-test';

  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.x.ai/v1/responses');
    assert.equal(options.headers['Authorization'], 'Bearer mock-key-for-test');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: 'Cloud computing delivers hosted services over the internet.'
      })
    };
  };

  try {
    const req = { method: 'POST', body: { message: 'What is cloud computing?' } };
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.answer, 'Cloud computing delivers hosted services over the internet.');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.XAI_API_KEY;
  }
});

await runAsyncTest('Returns HTTP 502 when xAI API returns an error', async () => {
  const originalFetch = globalThis.fetch;
  process.env.XAI_API_KEY = 'mock-key-for-test';

  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 401,
      json: async () => ({
        error: { message: 'Incorrect API key provided' }
      })
    };
  };

  try {
    const req = { method: 'POST', body: { message: 'Hello' } };
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 502);
    assert.ok(res.body?.error?.includes('AI service error: Incorrect API key provided'));
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.XAI_API_KEY;
  }
});

console.log(`\n======================================================`);
console.log(`Test Results: ${passedTests} / ${totalTests} passed`);
console.log(`======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
