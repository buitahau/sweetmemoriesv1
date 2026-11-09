// @ts-ignore
import "does-not-exist";
// Cloudflare Workers entry. Port 3000 is a routing key, not a real port. Local Node entry is server.ts.
import { httpServerHandler } from 'cloudflare:node';
import { createApp } from './app.js';

createApp().listen(3000);

export default httpServerHandler({ port: 3000 });
