const fs = require("fs");
const path = require("path");
const { createGrpcClient } = require("@aiot-toolkit/emulator/lib/vvd/grpc");

const { VVD_NAME } = require("./config");

async function captureAvatarTo(conf, outPath) {
  conf["grpc.token"] = conf["grpc.token"] || "";
  const agent = createGrpcClient(conf);
  await agent.waitForReady();
  const image = await agent.getScreenshot();
  await fs.promises.writeFile(outPath, image);
  agent.close();
  return image.length;
}

async function screenshot(outPath) {
  const { getRunningVvd } = require("./sdk");
  const conf = await getRunningVvd();
  if (!conf) throw new Error(`Emulador ${VVD_NAME} não está rodando; rode \`mirante-emulator start\`.`);
  const bytes = await captureAvatarTo(conf, outPath);
  console.log(`[shot] salvo em ${outPath} (${bytes} bytes)`);
  return outPath;
}

module.exports = { screenshot, captureAvatarTo };