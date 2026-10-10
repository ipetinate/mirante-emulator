const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let cachedBin = null;

function whichAdb() {
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    const candidate = path.join(dir, "adb");
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function resolveAdb() {
  if (cachedBin) return cachedBin;
  if (process.env.MIRANTE_ADB && fs.existsSync(process.env.MIRANTE_ADB)) {
    cachedBin = process.env.MIRANTE_ADB;
    return cachedBin;
  }
  const system = whichAdb();
  if (system) {
    cachedBin = system;
    return cachedBin;
  }
  const bundled = path.join(
    __dirname,
    "..",
    "node_modules",
    "@miwt",
    "adb",
    "bin",
    process.platform === "darwin" ? "mac" : process.platform === "win32" ? "windows" : "linux",
    "adb" + (process.platform === "win32" ? ".exe" : "")
  );
  if (fs.existsSync(bundled)) {
    cachedBin = bundled;
    return cachedBin;
  }
  throw new Error(
    "adb não encontrado. Instale o platform-tools ou defina MIRANTE_ADB para o binário adb."
  );
}

function adb(args, opts = {}) {
  const { serial } = opts;
  const full = serial ? ["-s", serial, ...args] : args;
  const res = spawnSync(resolveAdb(), full, { encoding: "utf8", timeout: opts.timeout || 60000 });
  return { stdout: (res.stdout || "").trim(), stderr: (res.stderr || "").trim(), status: res.status };
}

function adbDevices() {
  const { stdout, status } = adb(["devices"]);
  if (status !== 0) return [];
  return stdout
    .split("\n")
    .slice(1)
    .filter((l) => l.trim())
    .map((l) => l.trim().split(/\s+/)[0]);
}

function resolveSerial() {
  if (process.env.MIRANTE_SERIAL) return process.env.MIRANTE_SERIAL;
  const devices = adbDevices();
  const emulator = devices.find((d) => d.startsWith("emulator-"));
  if (emulator) return emulator;
  const tcp = devices.find((d) => d.includes("127.0.0.1:5555"));
  if (tcp) return tcp;
  return null;
}

function requireSerial() {
  const serial = resolveSerial();
  if (!serial) {
    throw new Error(
      "Nenhum emulador adb encontrado. Rode `mirante-emulator start` primeiro (ou `adb connect 127.0.0.1:5555`)."
    );
  }
  return serial;
}

function shell(cmd, opts = {}) {
  return adb(["shell", cmd], { serial: opts.serial || requireSerial(), timeout: opts.timeout });
}

function push(local, remote, opts = {}) {
  return adb(["push", local, remote], { serial: opts.serial || requireSerial(), timeout: opts.timeout });
}

function killEmulator(serial) {
  return adb(["-e", "emu", "kill"], { serial: serial || resolveSerial() });
}

function waitForGuest(serial, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = "";
  while (Date.now() < deadline) {
    const res = shell("ls /data/app/watchface", { serial, timeout: 15000 });
    if (res.status === 0) return true;
    lastErr = res.stderr || res.stdout;
    setTimeout(() => {}, 1500);
  }
  throw new Error(`Guest não ficou pronto: ${lastErr}`);
}

module.exports = {
  resolveAdb,
  adb,
  adbDevices,
  resolveSerial,
  requireSerial,
  shell,
  push,
  killEmulator,
  waitForGuest,
  whichAdb,
};