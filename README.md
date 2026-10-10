# mirante-emulator

Bridge entre o [Mirante](https://github.com/ipetinate/mirante) (editor de watchfaces para bandas Xiaomi no macOS) e o **emulador Vela oficial da Xiaomi**, rodando nativamente em Apple Silicon.

O Mirante fala BLE (GATT `FE95` + protocolo SPP da Xiaomi); o emulador oficial fala `adb`. Este repositório é a ponte: sobe o emulador, conecta via adb e instala faces compiladas direto no diretório de watchfaces do guest.

## Como funciona

O emulador oficial vem do pacote npm `@aiot-toolkit/emulator` (o mesmo que a ferramenta do m0tral reempacota para Windows). Ele baixa:

| peça | o quê é |
|---|---|
| `darwin-aarch64.zip` | binário do emulador para **Apple Silicon** (Mach-O arm64) |
| `vela-miwear-watch-5.0.zip` | imagem do sistema Vela (NuttX + HyperOS 3, `uname` → `NuttX Xiaomi Watch S4 12.3.0`) |
| `skins.zip` | skins — a do Band 10 Pro é `xiaomi_band_pro` (336×480) |
| `qa.zip` / `modem_simulator.zip` | fontes do quickapp e modem |

O download vem de uma CDN chinesa (`vela-ide.cnbj3-fusion.mi-fds.com`), então demora. Os downloads são resumíveis (extensão `.ipull`, pacote `ipull`).

Quando o emulador sobe, ele expõe:

- **adb** na porta TCP `5555` (`indispositivo` `127.0.0.1:5555` / `emulator-5554`);
- **gRPC** na porta `8554` (screenshot da tela da banda via `EmulatorController.getScreenshot`);
- filesystem do guest em `/data/app/`, com o diretório de faces em **`/data/app/watchface/`**.

## Uso

```bash
npm install
npm link   # opcional: expõe `mirante-emulator` na PATH

mirante-emulator setup         # baixa o SDK Vela (~650MB) e cria o VVD MiranteBand10Pro
mirante-emulator start         # sobe o emulador (janela da banda abre; mantenha aberto)
mirante-emulator devices       # lista devices adb
mirante-emulator push face.bin # valida o magic (5A A5 34 12) e envia para /data/app/watchface/
mirante-emulator screenshot    # captura a tela da banda (band-screen.png)
mirante-emulator stop          # derruba (adb emu kill)
```

### Variaveis de ambiente

- `MIRANTE_ADB` — path para um binário `adb` customizado (default: detecta na PATH, senão usa o embutido do `@miwt/adb`).
- `MIRANTE_SERIAL` — serial adb explícito (default: `emulator-*` offline, senão `127.0.0.1:5555`).
- `QUIET` — suprime o progresso do download.

## Notas do spike (validado em Apple Silicon, M5)

- O emulador é um fork do Android Emulator (reporta `32.1.15.0 (32.1.15-20241222)`), rodando **sem hypervisor** (`hypervisorType: NONE`, QEMU TCG), 16 vCPUs / 1GB.
- A imagem não é Android: `uname -a` → `NuttX Xiaomi Watch S4 12.3.0 463897d2c31 arm miwear`. O diretório de faces existe e é acessível por adb.
- O "mirante-emulator" não emula hardware do Band 10 Pro (SoC BES2700IMP/BEST1503); ele apenas usa o emulador oficial para renderização + o pipeline adb.
- A imagem do sistema é da Xiaomi — não é redistribuída por este repositório; o `setup` baixa em runtime.

## Estado

- [x] spike: emulador roda no Apple Silicon; adb e gRPC respondem; screencap 336×480 real.
- [x] bridge: CLI para setup/start/stop/push/screenshot.
- [ ] validar que uma face compilada pelo Mirante é carregada pelo guest após o push.
- [ ] integração do Mirante com este CLI (lançamento do emulador + push pós-compile).

## Licença

MIT. A imagem do sistema Vela pertence à Xiaomi.