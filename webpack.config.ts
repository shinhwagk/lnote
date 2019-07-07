import * as path from 'path';
import * as webpack from 'webpack';
const CopyPlugin = require('copy-webpack-plugin');

const extConfig: webpack.Configuration = {
    target: 'node',
    entry: './src-ext/extension.ts',
    output: {
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        path: path.resolve(__dirname, 'out')
    },
    resolve: { extensions: ['.ts', '.js'] },
    module: { rules: [{ test: /\.ts$/, loader: 'ts-loader' }] },
    externals: { vscode: 'vscode' }
};

const webviewConfig: webpack.Configuration = {
    target: 'web',
    entry: './src-webview/index.tsx',
    output: {
        filename: '[name].wv.js',
        path: path.resolve(__dirname, 'out')
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx', 'scss']
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loaders: ['babel-loader', 'ts-loader'] },
            { test: /\.s?css$/, loaders: ['style-loader', 'css-loader', 'sass-loader'] }
        ]
    },
    externals: { 'react': 'React', 'react-dom': 'ReactDOM' },
    plugins: [new CopyPlugin([{ from: 'react' }])],
};

export default [webviewConfig, extConfig];
