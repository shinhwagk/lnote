import * as path from 'path';

import * as webpack from 'webpack';

import * as CleanWebpackPlugin from "clean-webpack-plugin";

const config: webpack.Configuration = {
  target: "node",
  entry: "./src/extension.ts",
  output: {
    filename: "extension.js",
    path: path.resolve(__dirname, "out"),
  },
  resolve: { extensions: [".ts", ".js"] },
  module: { rules: [{ test: /\.ts$/, loader: "ts-loader" }] },
  externals: { vscode: "vscode" },
  devtool: "source-map",
  plugins: [new CleanWebpackPlugin(["out"])]
};

export default config;