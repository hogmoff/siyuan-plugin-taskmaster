/* eslint-disable node/prefer-global/process */
import { resolve } from "node:path"
import { promises as fs } from "node:fs"
import vue from "@vitejs/plugin-vue"
import fg from "fast-glob"
import minimist from "minimist"
import livereload from "rollup-plugin-livereload"
import {
  defineConfig,
  loadEnv,
} from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import zipPack from "vite-plugin-zip-pack"

const pluginInfo = require("./plugin.json")

export default defineConfig(({
  mode,
}) => {

  console.log('mode=>', mode)
  const env = loadEnv(mode, process.cwd())
  const {
    VITE_SIYUAN_WORKSPACE_PATH,
  } = env
  console.log('env=>', env)

  const siyuanWorkspacePath = VITE_SIYUAN_WORKSPACE_PATH
  let devDistDir = './dev'
  if (!siyuanWorkspacePath) {
    console.log("\nSiyuan workspace path is not set.")
  } else {
    console.log(`\nSiyuan workspace path is set:\n${siyuanWorkspacePath}`)
    devDistDir = `${siyuanWorkspacePath}/data/plugins/${pluginInfo.name}`
  }
  console.log(`\nPlugin will build to:\n${devDistDir}`)

  const args = minimist(process.argv.slice(2))
  const isWatch = args.watch || args.w || false
  const distDir = isWatch ? devDistDir : "./dist"

  console.log()
  console.log("isWatch=>", isWatch)
  console.log("distDir=>", distDir)

  // Zusätzliches Zielverzeichnis für den Build
  const customBuildPath = env.VITE_CUSTOM_BUILD_PATH || null
  console.log("customBuildPath=>", customBuildPath)

  // Funktion zum Kopieren der Build-Dateien
  async function copyBuildFiles() {
    if (!customBuildPath || isWatch) {
      console.log('Kein customBuildPath gesetzt oder Watch-Modus aktiv')
      return
    }
    
    try {
      console.log(`\n🔄 Kopiere Build-Dateien nach: ${customBuildPath}`)
      
      // Stelle sicher, dass das Zielverzeichnis existiert
      await fs.mkdir(customBuildPath, { recursive: true })
      console.log(`✅ Verzeichnis erstellt: ${customBuildPath}`)
      
      // Kopiere alle Dateien aus dem dist-Verzeichnis
      const files = await fg(["**/*"], { cwd: distDir, dot: true })
      console.log(`📋 Gefunden: ${files.length} Dateien zu kopieren`)
      
      for (const file of files) {
        const srcPath = resolve(distDir, file)
        const destPath = resolve(customBuildPath, file)
        
        // Erstelle Unterverzeichnisse falls nötig
        const destDir = resolve(destPath, "..")
        await fs.mkdir(destDir, { recursive: true })
        
        // Kopiere Datei
        await fs.copyFile(srcPath, destPath)
      }
      
      console.log(`✅ Erfolgreich ${files.length} Dateien nach ${customBuildPath} kopiert`)
      
      // Zeige kopierte Dateien
      const copiedFiles = await fs.readdir(customBuildPath)
      console.log(`📁 Kopierte Dateien:`, copiedFiles)
      
    } catch (error) {
      console.error("❌ Fehler beim Kopieren der Build-Dateien:", error)
      throw error // Re-throw damit der Build fehlschlägt und das Problem sichtbar wird
    }
  }

  return {
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },

    plugins: [
      vue(),
      viteStaticCopy({
        targets: [
          {
            src: "./README*.md",
            dest: "./",
          },
          {
            src: "./icon.png",
            dest: "./",
          },
          {
            src: "./preview.png",
            dest: "./",
          },
          {
            src: "./plugin.json",
            dest: "./",
          },
          {
            src: "./src/i18n/**",
            dest: "./i18n/",
          },
        ],
      }),
      {
        name: "copy-build-files",
        closeBundle: copyBuildFiles,
      },
    ],

    // https://github.com/vitejs/vite/issues/1930
    // https://vitejs.dev/guide/env-and-mode.html#env-files
    // https://github.com/vitejs/vite/discussions/3058#discussioncomment-2115319
    // 在这里自定义变量
    define: {
      "process.env.DEV_MODE": `"${isWatch}"`,
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },

    build: {
      // 输出路径
      outDir: distDir,
      emptyOutDir: !isWatch,

      // 构建后是否生成 source map 文件
      sourcemap: false,

      // 设置为 false 可以禁用最小化混淆
      // 或是用来指定是应用哪种混淆器
      // boolean | 'terser' | 'esbuild'
      // 不压缩，用于调试
      minify: !isWatch,

      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: resolve(__dirname, "src/index.ts"),
        // the proper extensions will be added
        fileName: "index",
        formats: ["cjs"],
      },
      rollupOptions: {
        plugins: [
          ...(isWatch
            ? [
                livereload(devDistDir),
                {
                  // 监听静态资源文件
                  name: "watch-external",
                  async buildStart() {
                    const files = await fg([
                      "src/i18n/*.json",
                      "./README*.md",
                      "./plugin.json",
                    ])
                    for (const file of files) {
                      this.addWatchFile(file)
                    }
                  },
                },
              ]
            : [
                zipPack({
                  inDir: "./dist",
                  outDir: "./",
                  outFileName: "package.zip",
                }),
              ]),
        ],

        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: ["siyuan", "process"],

        output: {
          entryFileNames: "[name].js",
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === "style.css") {
              return "index.css"
            }
            return assetInfo.name
          },
        },
      },
    },
  }
})