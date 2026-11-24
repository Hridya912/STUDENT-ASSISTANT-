/**
 * Automated Test Suite for Grok Student Assistant
 * Tests file integrity, serverless function edge cases, input validation, and API contracts.
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

// Mock helper for req / res
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
    'style.css',
    'script.js',
    'api/chat.js',
    'package.json',
    'vercel.json',
    '.env.example',
    '.gitignore',
    'README.md',
    'build.md',
    'flow.md',
    'frontend.md'
  ];

  for (const f of files) {
    const fullPath = path.join(__dirname, f);
    assert.ok(fs.existsSync(fullPath), `File ${f} must exist`);
  }
});

runTest('index.html contains semantic structure and no hardcoded API keys', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes('<header'), 'Contains semantic <header>');
  assert.ok(html.includes('<main'), 'Contains semantic <main>');
  assert.ok(html.includes('<footer'), 'Contains semantic <footer>');
  assert.ok(html.includes('style.css'), 'Links to style.css');
  assert.ok(html.includes('script.js'), 'Links to script.js');
  assert.ok(!html.includes('xai-'), 'No secret keys hardcoded');
  assert.ok(!html.includes('sk-'), 'No secret keys hardcoded');
});

runTest('style.css defines required color palette and dark theme', () => {
  const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
  assert.ok(css.includes('--bg: #08090D'), 'Contains near black background #08090D');
  assert.ok(css.includes('--surface: #101116'), 'Contains surface #101116');
  assert.ok(css.includes('--violet: #8B5CF6'), 'Contains violet #8B5CF6');
  assert.ok(css.includes('--blue: #3B82F6'), 'Contains blue #3B82F6');
  assert.ok(css.includes('--cyan: #22D3EE'), 'Contains cyan #22D3EE');
  assert.ok(css.includes('chat-panel'), 'Contains chat-panel styling');
  assert.ok(css.includes(':focus-visible'), 'Contains accessible focus-visible styles');
});

runTest('script.js does not contain hardcoded keys and points to /api/chat', () => {
  const js = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
  assert.ok(js.includes('/api/chat'), 'Calls serverless route /api/chat');
  assert.ok(!js.includes('api.x.ai'), 'Never calls xAI directly from browser');
  assert.ok(!js.includes('xai-'), 'No hardcoded xAI API key');
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

await runAsyncTest('Rejects whitespace-only message with HTTP 400', async () => {
  const req = { method: 'POST', body: { message: '    \n\t   ' } };
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

await runAsyncTest('Successfully parses structured output array from Responses API', async () => {
  const originalFetch = globalThis.fetch;
  process.env.XAI_API_KEY = 'mock-key-for-test';

  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        output: [
          {
            type: 'message',
            content: [
              { type: 'output_text', text: 'IaaS provides virtualized hardware resources.' }
            ]
          }
        ]
      })
    };
  };

  try {
    const req = { method: 'POST', body: { message: 'What is IaaS?' } };
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.answer, 'IaaS provides virtualized hardware resources.');
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
