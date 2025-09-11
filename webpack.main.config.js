const webpack = require("webpack");

module.exports = {
  entry: "./src/main/main.ts",
  target: "electron-main",
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    preferRelative: false,
    fallback: {
      "cloudflare:sockets": false,
    },
    mainFields: ["module", "main"],
    conditionNames: ["node", "require"],
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^(pg-native|cloudflare:sockets|pg-cloudflare)$/,
    }),
  ],
  externals: [
    {
      "better-sqlite3": "commonjs better-sqlite3",
      pg: "commonjs pg",
    },
  ],
};
