/**
 * TRADEVERSE desktop launcher — spawns backend/collector and opens the UI.
 * Requires Python 3.11+ and Node.js. For a native window, install Rust and run npm run tauri:build.
 */
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mode = process.argv[2] ?? "participant";

const isWin = process.platform === "win32";
const python = isWin ? "python" : "python3";
const backendDir = join(root, "backend");
const venvPython = isWin
  ? join(backendDir, ".venv", "Scripts", "python.exe")
  : join(backendDir, ".venv", "bin", "python");

async function ensureBackendVenv() {
  if (!existsSync(venvPython)) {
    console.log("Creating backend virtualenv…");
    await run(python, ["-m", "venv", join(backendDir, ".venv")]);
    await run(venvPython, ["-m", "pip", "install", "-q", "-r", join(backendDir, "requirements.txt")]);
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: isWin, ...opts });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function waitForHealth(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  return false;
}

async function startParticipant() {
  await ensureBackendVenv();
  const dataDir = join(
    process.env.LOCALAPPDATA || join(process.env.HOME || "", ".tradeverse"),
    "Tradeverse",
    "data",
  );
  mkdirSync(dataDir, { recursive: true });
  const dbPath = join(dataDir, "trader.db").replace(/\\/g, "/");

  const env = {
    ...process.env,
    PYTHONPATH: backendDir,
    LOCAL_INSTANCE_MODE: "true",
    AUTO_INIT_DB: "true",
    BACKEND_HOST: "127.0.0.1",
    BACKEND_PORT: "8765",
    DATABASE_URL: `sqlite+pysqlite:///${dbPath}`,
    CORS_ORIGINS: "http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:8765",
    HIDE_ADMIN_UI: "true",
  };

  const log = createWriteStream(join(dataDir, "backend.log"), { flags: "a" });
  const backend = spawn(
    venvPython,
    ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8765"],
    { cwd: backendDir, env, stdio: ["ignore", log, log] },
  );

  const ok = await waitForHealth("http://127.0.0.1:8765/api/v1/health");
  if (!ok) {
    console.error("Backend failed to start. See", join(dataDir, "backend.log"));
    backend.kill();
    process.exit(1);
  }

  console.log("Backend ready at http://127.0.0.1:8765");
  console.log("Open http://127.0.0.1:3000/terminal (run frontend dev) or build static UI.");

  const frontendDir = join(root, "frontend");
  if (existsSync(join(frontendDir, "node_modules"))) {
    spawn(isWin ? "npm.cmd" : "npm", ["run", "dev", "--", "--hostname", "127.0.0.1"], {
      cwd: frontendDir,
      stdio: "inherit",
      shell: isWin,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:8765",
        NEXT_PUBLIC_WS_URL: "ws://127.0.0.1:8765",
        NEXT_PUBLIC_LOCAL_INSTANCE: "true",
      },
    });
  }

  process.on("SIGINT", () => {
    backend.kill();
    process.exit(0);
  });
}

async function startOrganizer() {
  const collectorDir = join(root, "leaderboard-collector");
  const venvPy = isWin
    ? join(collectorDir, ".venv", "Scripts", "python.exe")
    : join(collectorDir, ".venv", "bin", "python");
  if (!existsSync(venvPy)) {
    await run(python, ["-m", "venv", join(collectorDir, ".venv")]);
    await run(venvPy, ["-m", "pip", "install", "-q", "-r", join(collectorDir, "requirements.txt")]);
  }
  const dataDir = join(root, "leaderboard-data");
  mkdirSync(dataDir, { recursive: true });
  await run(venvPy, [join(collectorDir, "main.py")], {
    env: { ...process.env, TRADEVERSE_COLLECTOR_DATA: dataDir, COLLECTOR_PORT: "9000" },
  });
}

if (mode === "organizer") {
  startOrganizer().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  startParticipant().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
