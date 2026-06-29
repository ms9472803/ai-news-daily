import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// When deploying to a GitHub Pages subpath (https://<user>.github.io/<repo>/),
// set the BASE_PATH=/<repo>/ environment variable.
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [vue()],
});
