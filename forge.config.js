const path = require("path");
const packageJson = require("./package.json");

const platformIcons = {
  darwin: path.resolve(__dirname, "assets/icons/mac/icon.icns"),
  win32: path.resolve(__dirname, "assets/icons/win/icon.ico"),
  linux: path.resolve(__dirname, "assets/icons/linux/icon.png"),
};

const resolvedIcon =
  platformIcons[process.platform] || platformIcons.darwin;

module.exports = {
  packagerConfig: {
    asar: {
      unpack: "**/{*.node,*.dll}",
    },
    icon: resolvedIcon,
    appBundleId: "com.sqltemple.app",
    appCategoryType: "public.app-category.developer-tools",
    name: "SQLTemple",
    executableName: "SQLTemple",
    appVersion: packageJson.version,
    buildVersion: process.env.BUILD_NUMBER || Date.now().toString(),
    extendInfo: {
      CFBundleShortVersionString: packageJson.version,
      CFBundleVersion: process.env.BUILD_NUMBER || Date.now().toString(),
      CFBundleName: "SQLTemple",
      CFBundleDisplayName: "SQLTemple",
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
        icon: platformIcons.darwin,
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
        setupIcon: platformIcons.win32,
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
          icon: platformIcons.linux,
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
          icon: platformIcons.linux,
        },
      },
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "vicotrbb",
          name: "sqltemple",
        },
        prerelease: false,
        draft: false,
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
        externalModules: ["better-sqlite3", "pg"],
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
    {
      name: "@timfish/forge-externals-plugin",
      config: {
        externals: ["better-sqlite3", "pg"],
      },
    },
  ],
};
