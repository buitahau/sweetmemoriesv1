import { createApp } from './app.js';
import { parsePort } from './config.js';

let port: number;
try {
  port = parsePort(process.env.PORT);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// No callback: Express 5 registers a listen callback as an 'error' listener too,
// which would print a false start line when the port is busy.
const server = createApp().listen(port);

server.on('listening', () => {
  console.log(`API listening on http://localhost:${port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
