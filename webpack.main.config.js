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
    fallback: {
      "cloudflare:sockets": false,
    },
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^(pg-native|cloudflare:sockets|pg-cloudflare)$/,
    }),
  ],
  externals: [
    {
      "better-sqlite3": "commonjs better-sqlite3",
      openai: "commonjs openai",
      pg: "commonjs pg",
    },
  ],
};
