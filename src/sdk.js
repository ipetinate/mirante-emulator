const os = require("os");
const fs = require("fs");
const path = require("path");
const {
  VvdManager,
  defaultSDKHome,
  defaultVvdHome,
  IVvdArchType,
} = require("@aiot-toolkit/emulator");

const { VVD_NAME, IMAGE_TYPE, SKIN_NAME } = require("./config");

let cachedManager = null;

function manager() {
  if (!cachedManager) {
    cachedManager = new VvdManager({ sdkHome: defaultSDKHome, vvdHome: defaultVvdHome });
  }
  return cachedManager;
}

async function ensureSDK() {
  const mgr = manager();
  const downloader = await mgr.downloadSDK({
    force: false,
    cliProgress: !process.env.QUIET,
    parallelDownloads: Math.min(3, os.cpus().length),
  });
  downloader.on("progress", (p) => {
    if (!process.env.QUIET) {
      console.log(`[sdk] ${p.formattedSpeed} ${p.formattedPercentage} ${p.formatTotal}`);
    }
  });
  await downloader.downlodPromise;
  console.log("[sdk] SDK Vela pronto em", defaultSDKHome);
}

async function ensureVVD() {
  const mgr = manager();
  const vvdDir = path.resolve(defaultVvdHome, VVD_NAME);
  const configIni = path.join(vvdDir, "config.ini");
  if (fs.existsSync(configIni)) {
    console.log(`[vvd] ${VVD_NAME} já existe`);
    return;
  }
  const skinList = await mgr.getVelaSkinList();
  const skin = skinList.find((s) => s.name === SKIN_NAME);
  if (!skin) {
    throw new Error(
      `Skin "${SKIN_NAME}" não encontrada. Disponíveis: ${skinList.map((s) => s.name).join(", ")}`
    );
  }
  mgr.createVvd({
    name: VVD_NAME,
    skin: skin.name,
    "skin.path": skin.path,
    arch: IVvdArchType.arm,
    imageDir: path.resolve(defaultSDKHome, "system-images", IMAGE_TYPE),
    imageType: IMAGE_TYPE,
  });
  console.log(`[vvd] ${VVD_NAME} criado com skin "${SKIN_NAME}"`);
}

async function getRunningVvd() {
  const { getRunningVvds } = require("@aiot-toolkit/emulator/lib/emulatorutil");
  const running = await getRunningVvds();
  return running.find((e) => e["avd.name"] === VVD_NAME) || null;
}

async function ensureAll() {
  await ensureSDK();
  await ensureVVD();
}

module.exports = {
  manager,
  ensureSDK,
  ensureVVD,
  ensureAll,
  getRunningVvd,
  defaultSDKHome,
  defaultVvdHome,
};