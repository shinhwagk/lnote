const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const extConfig = {
    target: 'node',
    entry: './src/extension.ts',
    output: {
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        path: path.resolve(__dirname, 'out'),
    },
    resolve: { extensions: ['.ts', '.js'] },
    module: { rules: [{ test: /\.ts$/, loader: 'ts-loader', options: { configFile: '../tsconfig.json' } }] },
    externals: { vscode: 'vscode' },
};

const webConfig = {
    target: 'web',
    entry: './web/main.ts',
    output: { filename: '[name].js', path: path.resolve(__dirname, 'out') },
    module: {
        rules: [{ test: /\.ts$/, loader: 'ts-loader', options: { configFile: './tsconfig.json' } }],
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: './web/main.css' }],
        }),
    ],
};
module.exports = [webConfig, extConfig];
// export default [webviewConfig];
