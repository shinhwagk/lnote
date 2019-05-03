const path = require("path");

module.exports = {
  target: "node",
  entry: "./main.ts",
  output: {
    path: path.resolve(__dirname, "lib"),
    libraryTarget: 'commonjs2',
    filename: "lib.js"
  },
  resolve: {
    extensions: [".js", ".ts"]
  },
  module: {
    rules: [{ test: /\.ts$/, loader: "ts-loader" }]
  }
};
