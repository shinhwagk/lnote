import * as path from 'path';

import * as webpack from 'webpack';

const extConfig: webpack.Configuration = {
    target: 'node',
    entry: './src/extension.ts',
    output: {
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        path: path.resolve(__dirname, 'out')
    },
    resolve: { extensions: ['.ts', '.js'] },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: {
                    loader: 'ts-loader',
                    options: { configFile: 'tsconfig.prod.json', transpileOnly: true }
                }
            }
        ]
    },
    externals: { vscode: 'vscode' }
};

const webviewConfig: webpack.Configuration = {
    target: 'web',
    entry: './src/webview/index.tsx',
    output: {
        filename: '[name].wv.js',
        path: path.resolve(__dirname, 'out')
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loaders: [
                    'babel-loader',
                    {
                        loader: 'ts-loader',
                        options: { configFile: 'tsconfig.prod.json', transpileOnly: true }
                    }
                ]
            },
            { test: /\.scss$/, loaders: ['style-loader', 'css-loader', 'sass-loader'] }
        ]
    },
    externals: {
        react: 'React',
        'react-dom': 'ReactDOM'
    }
};
export default [webviewConfig, extConfig];
