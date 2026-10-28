// Starts the Vite dev server, then opens it in Electron with hot reload.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import electronPath from 'electron';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root });
await server.listen();
const url = server.resolvedUrls.local[0];

// Terminals inside VS Code export ELECTRON_RUN_AS_NODE, which would start Electron as plain Node.
const { ELECTRON_RUN_AS_NODE: _, ...env } = process.env;
const child = spawn(electronPath, ['.'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...env, VITE_DEV_SERVER_URL: url },
});

child.on('exit', async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
