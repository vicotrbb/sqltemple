module.exports = {
  packagerConfig: {
    asar: {
      unpack: "**/{*.node,*.dll}",
    },
    icon: "./assets/icon",
    appBundleId: "com.sqltemple.app",
    appCategoryType: "public.app-category.developer-tools",
    name: "SQLTemple",
    executableName: "SQLTemple",
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "SQLTemple",
        title: "SQLTemple",
        format: "ULFO",
        overwrite: true,
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./src/renderer/index.html",
              js: "./src/renderer/index.tsx",
              name: "main_window",
              preload: {
                js: "./src/main/preload.ts",
              },
            },
          ],
        },
      },
    },
  ],
};
