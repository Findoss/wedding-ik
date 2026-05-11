import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import CleanCSS from "clean-css";
import { minify as minifyHtml } from "html-minifier-terser";
import { watch } from "fs";

const OUT_DIR = "./docs";
const IS_WATCH = process.argv.includes("--watch");

// Храним сокеты и статус билда во внешних переменных для Hot Reload
if (!(globalThis as any).sockets) {
  (globalThis as any).sockets = new Set();
}
const sockets: Set<any> = (globalThis as any).sockets;
let isBuilding = false;

async function build() {
  if (isBuilding) return;
  isBuilding = true;

  try {
    console.log("🚀 Запуск сборки...");

    // 1. Подготовка папок
    // В режиме разработки НЕ удаляем всю папку docs, чтобы не было ошибок EBUSY (ресурс занят)
    if (!IS_WATCH) {
      await fs.rm(OUT_DIR, { recursive: true, force: true });
    }
    await fs.mkdir(path.join(OUT_DIR, "img"), { recursive: true });

    const files = await fs.readdir("./");
    const sourceImages = await fs.readdir("./img");

    // 2. Обработка изображений (Пропускаем в dev-режиме, если они уже есть)
    const imageFiles = sourceImages.filter((f) => f.match(/\.(png|jpg|jpeg)$/i));
    for (const imgName of imageFiles) {
      const srcPath = path.join("img", imgName);
      const name = path.parse(imgName).name;
      const webpPath = path.join(OUT_DIR, "img", `${name}.webp`);
      const origPath = path.join(OUT_DIR, "img", imgName);

      // Проверка существования (чтобы не пересжимать каждый раз в dev-режиме)
      let exists = false;
      if (IS_WATCH) {
        try {
          await fs.access(webpPath);
          await fs.access(origPath);
          exists = true;
        } catch {}
      }

      if (!exists) {
        console.log(`🖼️ Обработка: ${imgName}`);
        await sharp(srcPath)
          .webp({ quality: 80, effort: 6 })
          .toFile(webpPath);
        await fs.copyFile(srcPath, origPath);
      }
    }

    // 3. Обработка JS
    const jsFiles = files.filter(
      (f) => f.endsWith(".js") && !f.includes(".min.") && f !== "build.ts"
    );
    for (const js of jsFiles) {
      await Bun.build({
        entrypoints: [js],
        outdir: OUT_DIR,
        minify: true,
        naming: "[name].[ext]",
      });
    }

    // Копирование библиотек и аудио
    const copyTasks = [
      ...files.filter(f => f.endsWith(".min.js")),
      ...files.filter(f => f.endsWith(".mp3"))
    ];
    for (const file of copyTasks) {
      await fs.copyFile(file, path.join(OUT_DIR, file));
    }

    // 4. Обработка CSS
    const cssFiles = files.filter((f) => f.endsWith(".css"));
    const cleanCss = new CleanCSS();
    for (const css of cssFiles) {
      let content = await fs.readFile(css, "utf-8");
      content = content.replace(
        /(background(?:-image)?:\s*)url\(['"]?(img\/.*?)\.(png|jpg|jpeg)['"]?\)/gi,
        '$1url("$2.$3"); $1-webkit-image-set(url("$2.webp") type("image/webp")); $1image-set(url("$2.webp") type("image/webp"))'
      );
      
      const minified = cleanCss.minify(content).styles;
      await fs.writeFile(path.join(OUT_DIR, css), minified);
    }

    // 5. Обработка HTML
    const htmlFiles = files.filter((f) => f.endsWith(".html"));
    for (const html of htmlFiles) {
      let content = await fs.readFile(html, "utf-8");

      if (IS_WATCH) {
        content = content.replace("</body>", `
          <script>
            (function() {
              const socket = new WebSocket('ws://' + window.location.host);
              socket.onmessage = (msg) => { if (msg.data === 'reload') window.location.reload(); };
              socket.onopen = () => console.log('🚀 Hot Reload active');
              socket.onclose = () => setTimeout(() => window.location.reload(), 1000);
            })();
          </script>
          </body>
        `);
      }

      const minified = await minifyHtml(content, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        removeAttributeQuotes: true,
      });
      
      await fs.writeFile(path.join(OUT_DIR, html), minified);
    }

    console.log("✅ Сборка готова!");
    if (IS_WATCH) {
      for (const ws of sockets) ws.send("reload");
    }
  } catch (err) {
    console.error("❌ Ошибка при сборке:", err);
  } finally {
    isBuilding = false;
  }
}

// ЗАПУСК
if (IS_WATCH) {
  console.log("🔥 Режим разработки (Hot Reload) запущен...");
  
  await build();

  // Предотвращаем повторный запуск сервера при hot-reload самого скрипта build.ts
  if (!(globalThis as any).server) {
    (globalThis as any).server = Bun.serve({
      port: 3000,
      async fetch(req, server) {
        if (server.upgrade(req)) return;
        let path = new URL(req.url).pathname;
        if (path === "/") path = "/index.html";
        const file = Bun.file(`./docs${path}`);
        if (!(await file.exists())) return new Response("Not Found", { status: 404 });
        return new Response(file);
      },
      websocket: {
        open(ws) { sockets.add(ws); },
        close(ws) { sockets.delete(ws); },
        message() {}
      }
    });
    console.log(`🌍 Сервер запущен: http://localhost:3000`);
  }

  let debounceTimer: any = null;
  watch("./", { recursive: true }, (event, filename) => {
    if (!filename) return;
    if (filename.startsWith("docs") || filename.startsWith("node_modules") || filename.startsWith(".git") || filename.includes("bun.lock")) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => build(), 200);
  });
} else {
  await build();
  process.exit(0);
}
