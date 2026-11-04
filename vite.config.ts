import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: process.env.VITE_PUBLIC === '1' ? '/All-in-one/' : '/',
    plugins: [react(), tailwindcss()],
    server: {port: 5182, strictPort: true},
  };
});
