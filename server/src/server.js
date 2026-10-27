import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function start() {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      console.info(`API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Could not start API:', error.name);
    process.exit(1);
  }
}

start();
