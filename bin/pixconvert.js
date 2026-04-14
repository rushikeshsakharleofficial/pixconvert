#!/usr/bin/env node

// PixConvert CLI
// Usage:
//   npx pixconvert                  — start server directly
//   sudo npx pixconvert --install   — install systemd service
//   sudo npx pixconvert --uninstall — remove systemd service

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '..', 'server.js');

const args = process.argv.slice(2);

if (args.includes('--install')) {
  install();
} else if (args.includes('--uninstall')) {
  uninstall();
} else {
  await import(serverPath);
}

function install() {
  if (process.getuid && process.getuid() !== 0) {
    console.error('Error: --install requires root. Run: sudo npx pixconvert --install');
    process.exit(1);
  }

  const LOG_DIR = '/var/log/pixconvert';
  const SERVICE_PATH = '/etc/systemd/system/pixconvert.service';
  const nodeBin = process.execPath;

  // Create log directory
  mkdirSync(LOG_DIR, { recursive: true });
  console.log(`Created ${LOG_DIR}`);

  const service = `[Unit]
Description=PixConvert API Server
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=${nodeBin} ${serverPath}
ExecStartPre=/bin/mkdir -p ${LOG_DIR}
Restart=on-failure
RestartSec=5

# Environment — edit as needed
Environment=PORT=3001
Environment=API_RATE_LIMIT=10
Environment=FILE_SIZE_LIMIT_MB=50
Environment=FILE_TTL_HOURS=1

# Logging
StandardOutput=append:${LOG_DIR}/pixconvert_access.log
StandardError=append:${LOG_DIR}/pixconvert_error.log
SyslogIdentifier=pixconvert

[Install]
WantedBy=multi-user.target
`;

  writeFileSync(SERVICE_PATH, service);
  console.log(`Written ${SERVICE_PATH}`);

  execSync('systemctl daemon-reload');
  execSync('systemctl enable pixconvert');
  console.log('Service enabled (auto-start on boot)');

  console.log(`
PixConvert service installed successfully!

  Start:    sudo systemctl start pixconvert
  Stop:     sudo systemctl stop pixconvert
  Restart:  sudo systemctl restart pixconvert
  Status:   sudo systemctl status pixconvert

  Access log:  tail -f ${LOG_DIR}/pixconvert_access.log
  Error log:   tail -f ${LOG_DIR}/pixconvert_error.log
`);
}

function uninstall() {
  if (process.getuid && process.getuid() !== 0) {
    console.error('Error: --uninstall requires root. Run: sudo npx pixconvert --uninstall');
    process.exit(1);
  }

  const SERVICE_PATH = '/etc/systemd/system/pixconvert.service';

  try { execSync('systemctl stop pixconvert'); } catch {}
  try { execSync('systemctl disable pixconvert'); } catch {}

  if (existsSync(SERVICE_PATH)) {
    unlinkSync(SERVICE_PATH);
    console.log(`Removed ${SERVICE_PATH}`);
  }

  execSync('systemctl daemon-reload');
  console.log('PixConvert service uninstalled.');
}
