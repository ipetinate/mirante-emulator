const path = require("path");
const { ensureAll, getRunningVvd, manager } = require("./sdk");
const { resolveAdb } = require("./adb");
const { ADB_PORT } = require("./config");

function augmentPath() {
  const adbBin = resolveAdb();
  const adbDir = path.dirname(adbBin);
  if (!(process.env.PATH || "").split(path.delimiter).includes(adbDir)) {
    process.env.PATH = `${adbDir}${path.delimiter}${process.env.PATH || ""}`;
  }
}

async function start(argv) {
  await ensureAll();
  const already = await getRunningVvd();
  if (already) {
    console.log(`[emu] ${already["avd.name"]} já está rodando (adb ${already["port.adb"]}, grpc ${already["grpc.port"]})`);
    return { started: false };
  }
  augmentPath();
  const { VVD_NAME } = require("./config");
  const { startVvd } = manager();
  const { coldBoot, emulatorInstance } = await startVvd({
    vvdName: VVD_NAME,
    verbose: argv.verbose !== false,
    stdoutCallback: (m) => console.log("[emu]", String(m).trimEnd()),
    stderrCallback: (m) => console.error("[emu]", String(m).trimEnd()),
  });
  console.log(`[emu] ${VVD_NAME} iniciado (coldBoot=${coldBoot})`);
  console.log(`[emu] adb na porta ${ADB_PORT}; mantenha este processo aberto.`);
  setInterval(() => {}, 1 << 30);
}

async function stop() {
  const { killEmulator } = require("./adb");
  const conf = await getRunningVvd();
  if (!conf) {
    console.log("[emu] emulador não está rodando");
    return;
  }
  const serial = conf["port.serial"] ? `emulator-${conf["port.serial"]}` : null;
  await killEmulator(serial);
  console.log("[emu] emulador parado");
}

async function status() {
  const conf = await getRunningVvd();
  if (conf) {
    console.log("rodando:", conf["avd.name"], "| adb:", conf["port.adb"], "| grpc:", conf["grpc.port"]);
  } else {
    console.log("rodando: nenhum VVD ativo");
  }
}

module.exports = { start, stop, status, augmentPath };