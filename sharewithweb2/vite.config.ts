import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ command, mode }) => {

  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.pem')),
      },
      port: 3000,
      host: 'localhost',
    },
    define: {
      __APP_ENV__: env.APP_ENV,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
