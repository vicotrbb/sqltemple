const packageJson = require('./package.json');

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
    appVersion: packageJson.version,
    buildVersion: process.env.BUILD_NUMBER || Date.now().toString(),
    extendInfo: {
      CFBundleShortVersionString: packageJson.version,
      CFBundleVersion: process.env.BUILD_NUMBER || Date.now().toString(),
    },
    win32metadata: {
      FileVersion: packageJson.version,
      ProductVersion: packageJson.version,
      CompanyName: "SQLTemple",
      FileDescription: "Modern SQL IDE",
      ProductName: "SQLTemple",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: `SQLTemple-${packageJson.version}`,
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
      config: {
        name: "SQLTemple",
        setupExe: `SQLTemple-${packageJson.version}-Setup.exe`,
        setupMsi: `SQLTemple-${packageJson.version}-Setup.msi`,
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          name: "sqltemple",
          productName: "SQLTemple",
          version: packageJson.version,
          description: "Modern SQL IDE",
          maintainer: "SQLTemple Team",
          homepage: "https://github.com/sqltemple/sqltemple",
          bin: "SQLTemple",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          name: "sqltemple",
          productName: "SQLTemple",
          version: packageJson.version,
          description: "Modern SQL IDE",
          maintainer: "SQLTemple Team",
          homepage: "https://github.com/sqltemple/sqltemple",
          bin: "SQLTemple",
        },
      },
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
