import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const serviceName = process.env.AUTOSCALE_SERVICE || 'app';
const minReplicas = Number(process.env.APP_MIN_REPLICAS || 1);
const maxReplicas = Number(process.env.APP_MAX_REPLICAS || 10);
const cpuScaleUp = Number(process.env.AUTOSCALE_CPU_SCALE_UP || 75);
const cpuScaleDown = Number(process.env.AUTOSCALE_CPU_SCALE_DOWN || 25);
const memScaleUp = Number(process.env.AUTOSCALE_MEM_SCALE_UP || 80);
const memScaleDown = Number(process.env.AUTOSCALE_MEM_SCALE_DOWN || 35);
const pollMs = Number(process.env.AUTOSCALE_POLL_MS || 30000);
const cooldownMs = Number(process.env.AUTOSCALE_COOLDOWN_MS || 120000);

let lastScaleAt = 0;

const run = async (file, args) => {
  const { stdout } = await execFileAsync(file, args, { windowsHide: true, maxBuffer: 1024 * 1024 * 4 });
  return stdout.trim();
};

const parseComposePs = (raw) => {
  if (!raw) return [];
  if (raw.startsWith('[')) return JSON.parse(raw);
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
};

const parseStats = (raw) =>
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));

const toNumber = (value) => Number(String(value || '0').replace('%', '').trim()) || 0;

const getRunningContainers = async () => {
  const output = await run('docker', ['compose', 'ps', '--format', 'json']);
  const rows = parseComposePs(output);
  return rows.filter((row) => row.Service === serviceName && String(row.State || '').toLowerCase() === 'running');
};

const getUsage = async (containerNames) => {
  if (!containerNames.length) return { cpu: 0, mem: 0 };

  const output = await run('docker', ['stats', '--no-stream', '--format', '{{json .}}']);
  const stats = parseStats(output).filter((row) => containerNames.includes(row.Name));
  if (!stats.length) return { cpu: 0, mem: 0 };

  const cpu = stats.reduce((sum, row) => sum + toNumber(row.CPUPerc), 0) / stats.length;
  const mem = stats.reduce((sum, row) => sum + toNumber(row.MemPerc), 0) / stats.length;
  return { cpu, mem };
};

const scaleTo = async (replicas) => {
  await execFileAsync('docker', ['compose', 'up', '-d', '--scale', `${serviceName}=${replicas}`], {
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 8,
  });
  lastScaleAt = Date.now();
  console.log(`[autoscale] scaled ${serviceName} to ${replicas}`);
};

const tick = async () => {
  try {
    const containers = await getRunningContainers();
    const currentReplicas = containers.length || minReplicas;
    const names = containers.map((row) => row.Name);
    const usage = await getUsage(names);

    console.log(
      `[autoscale] replicas=${currentReplicas} cpu=${usage.cpu.toFixed(1)}% mem=${usage.mem.toFixed(1)}%`,
    );

    if (Date.now() - lastScaleAt < cooldownMs) return;

    if ((usage.cpu >= cpuScaleUp || usage.mem >= memScaleUp) && currentReplicas < maxReplicas) {
      await scaleTo(currentReplicas + 1);
      return;
    }

    if (usage.cpu <= cpuScaleDown && usage.mem <= memScaleDown && currentReplicas > minReplicas) {
      await scaleTo(currentReplicas - 1);
    }
  } catch (error) {
    console.error('[autoscale] tick failed:', error.message);
  }
};

console.log(
  `[autoscale] watching service=${serviceName} min=${minReplicas} max=${maxReplicas} cpuUp=${cpuScaleUp} cpuDown=${cpuScaleDown} memUp=${memScaleUp} memDown=${memScaleDown}`,
);

await tick();
setInterval(tick, pollMs);
