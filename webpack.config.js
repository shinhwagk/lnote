// @ts-check

const path = require('path');
const copy = require('copy-webpack-plugin');

/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extConfig = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: '../tsconfig.json'
        }
      }
    ]
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log"
  },
};

const webConfig = {
  target: 'web',
  entry: './web/main.ts',
  output: { filename: '[name].js', path: path.resolve(__dirname, 'out') },
  module: {
    rules: [{ test: /\.ts$/, loader: 'ts-loader', options: { configFile: './tsconfig.json' } }]
  },
  plugins: [
    new copy({
      patterns: [{ from: './web/main.css' }]
    })
  ]
};

module.exports = [webConfig, extConfig];
