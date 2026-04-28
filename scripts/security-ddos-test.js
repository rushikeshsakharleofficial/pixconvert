#!/usr/bin/env node

import assert from 'assert/strict';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const root = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pixconvert-security-'));
const port = 4300 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;

function request(pathname, options = {}) {
  return fetch(`${baseUrl}${pathname}`, options);
}

async function waitForServer(child) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited before becoming ready (${child.exitCode})`);
    }
    try {
      const res = await request('/api/v1/health');
      if (res.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error('Timed out waiting for server');
}

async function run() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: {
      ...process.env,
      API_PORT: String(port),
      FRONTEND_PORT: String(port),
      API_RATE_LIMIT: '5',
      MAX_METRICS_COUNT: '10',
      MAX_METRICS_EVENTS: '100',
      UPLOADS_DIR: path.join(tmp, 'uploads'),
      DOWNLOADS_DIR: path.join(tmp, 'downloads'),
      METRICS_FILE: path.join(tmp, 'data', 'metrics.json'),
      ALLOWED_ORIGINS: baseUrl,
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(child);

    const uploadProbe = await request('/uploads/does-not-exist.pdf');
    assert.equal(uploadProbe.status, 404, 'raw uploads should not be publicly served');

    const privateFetch = await request('/api/v1/jpg-to-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `${baseUrl}/api/v1/health` }),
    });
    assert.equal(privateFetch.status, 403, 'URL ingestion should block private hosts');

    const privateHtml = await request('/api/v1/html-to-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ htmlUrl: `${baseUrl}/api/v1/health` }),
    });
    assert.equal(privateHtml.status, 403, 'HTML renderer should block private hosts before launch');

    const hugeBody = await request('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'x'.repeat(12_000) }),
    });
    assert.equal(hugeBody.status, 413, 'oversized JSON bodies should be rejected');

    const metricWrite = await request('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'ddos-test', count: 1000 }),
    });
    assert.equal(metricWrite.status, 200, 'metrics write should remain available');

    const stats = await request('/api/metrics/stats?period=daily');
    const statsBody = await stats.json();
    assert.equal(statsBody.totalAllTime, 10, 'metrics count should be capped per request');

    const burst = await Promise.all(
      Array.from({ length: 12 }, () => request('/api/v1/health'))
    );
    assert.ok(
      burst.some((res) => res.status === 429),
      'API rate limiter should return 429 during a burst'
    );

    console.log('Security/DDOS checks passed');
  } catch (err) {
    if (stderr) process.stderr.write(stderr);
    throw err;
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
