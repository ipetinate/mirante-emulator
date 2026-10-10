const fs = require("fs");
const path = require("path");
const { push, shell, requireSerial } = require("./adb");
const { WATCHFACE_DIR, MAGIC } = require("./config");

function validateMagic(filePath) {
  const fd = fs.openSync(filePath, "r");
  const head = Buffer.alloc(4);
  fs.readSync(fd, head, 0, 4);
  fs.closeSync(fd);
  if (!head.equals(MAGIC)) {
    throw new Error(
      `Cabeçalho inválido: ${head.toString("hex")} (esperado ${MAGIC.toString("hex")} — "CompiledFaceMagic").`
    );
  }
}

async function pushFace(facePath, name) {
  const local = path.resolve(facePath);
  if (!fs.existsSync(local)) throw new Error(`Arquivo não existe: ${local}`);
  validateMagic(local);

  const serial = requireSerial();
  const remoteName = name ? `${name}.bin` : path.basename(local);
  const remote = `${WATCHFACE_DIR}/${remoteName}`;

  const res = push(local, remote, { serial });
  if (res.status !== 0) {
    throw new Error(`adb push falhou: ${res.stderr || res.stdout}`);
  }
  console.log(`[face] enviado: ${remote} (${res.stdout || "ok"})`);

  const ls = shell(`ls ${WATCHFACE_DIR}`, { serial });
  console.log(`[face] /data/app/watchface agora contém:\n${ls.stdout}`);
  return { local, remote };
}

module.exports = { pushFace, validateMagic };