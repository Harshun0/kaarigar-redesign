import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

// Mirrors the /api/contact.js Vercel serverless function so the contact
// form also works against `npm run dev` / `vite preview`, not just on Vercel.
function localApiPlugin() {
  return {
    name: "local-api-middleware",
    async configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      process.env.MONGODB_URI = process.env.MONGODB_URI || env.MONGODB_URI;
      process.env.MONGODB_DB = process.env.MONGODB_DB || env.MONGODB_DB;

      const { default: contactHandler } = await import("./api/contact.js");

      server.middlewares.use("/api/contact", (req, res) => {
        let raw = "";
        req.on("data", (chunk) => (raw += chunk));
        req.on("end", async () => {
          try {
            req.body = raw ? JSON.parse(raw) : {};
          } catch {
            req.body = {};
          }
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          };
          try {
            await contactHandler(req, res);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Local dev server error" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [localApiPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        contact: resolve(__dirname, "contact.html"),
      },
    },
    assetsInclude: [
      "**/*.jpeg",
      "**/*.jpg",
      "**/*.png",
      "**/*.svg",
      "**/*.gif",
    ],
    copyPublicDir: true,
  },
});
