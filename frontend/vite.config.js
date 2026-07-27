/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// Import Vite's defineConfig helper for typed configuration and IDE hints.
import { defineConfig } from 'vite';
// Official React plugin: enables Fast Refresh and JSX transform for Vite.
import react from '@vitejs/plugin-react';
// resolve builds absolute paths to files on disk from this config file's directory.
import { resolve } from 'path';
// Node fs helpers to stream sample audio files and check existence synchronously.
import { existsSync, createReadStream, statSync } from 'fs';

// Default export is read by the Vite CLI when running `vite` or `vite build`.
export default defineConfig({
  // plugins array registers transform and dev-server extensions.
  plugins: [
    // React plugin must run so .jsx files compile correctly.
    react(),
    // Inline plugin object: custom dev middleware for static audio samples.
    {
      // Human-readable name shown in Vite debug logs for this plugin.
      name: 'serve-samples',
      // configureServer runs once when the dev server starts.
      configureServer(server) {
        // Attach middleware at /Samples so URLs match frontend getAudioUrl paths.
        server.middlewares.use('/Samples', (req, res, next) => {
          // Decode URL-encoded filenames (spaces, special chars) from the request path.
          const filename = decodeURIComponent(req.url.replace(/^\//, ''));
          // Resolve absolute path: repo root Samples folder + requested filename.
          const filePath = resolve(__dirname, '..', 'Samples', filename);
          // Only serve if file exists to avoid leaking arbitrary path reads.
          if (existsSync(filePath)) {
            // Tell browser this is MPEG-4 audio (m4a container).
            res.setHeader('Content-Type', 'audio/mp4');
            // Content-Length enables range requests and progress display.
            res.setHeader('Content-Length', statSync(filePath).size);
            // Accept-Ranges allows seeking/scrubbing in the audio element.
            res.setHeader('Accept-Ranges', 'bytes');
            // Stream file bytes to response without loading whole file into RAM.
            createReadStream(filePath).pipe(res);
          } else {
            // Missing file: return 404 plain text for debugging in Network tab.
            res.statusCode = 404;
            res.end('Not found: ' + filename);
          }
        });
      },
    },
  ],
  // server block configures dev-only behavior (not applied to production build output).
  server: {
    // proxy forwards API calls from Vite dev origin to Java ScaleServer on 8080.
    proxy: {
      // Any path starting with /api is forwarded to the backend target.
      '/api': {
        // Java HTTP server address where ScaleServer listens.
        target: 'http://localhost:8080',
        // changeOrigin rewrites Host header so backend sees expected host.
        changeOrigin: true,
      },
    },
  },
});
