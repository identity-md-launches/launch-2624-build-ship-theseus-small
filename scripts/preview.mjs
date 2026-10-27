import { createPreview } from './server.mjs';

const port = Number(process.argv[2] ?? 4173);
const server = createPreview('/');
server.listen(port, '127.0.0.1', () => {
  console.log(`Preview: http://127.0.0.1:${port}/ (Ctrl+C to stop)`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
