import * as path from 'path';

import * as webpack from 'webpack';

const config: webpack.Configuration = {
    target: "node",
    entry: "./src/extension.ts",
    output: {
        filename: "extension.js",
        libraryTarget:"commonjs2",
        path: path.resolve(__dirname, "out"),
    },
    resolve: { extensions: [".ts", ".js"] },
    module: { rules: [{ test: /\.ts$/, loader: "ts-loader" }] },
    externals: { vscode: "vscode" },

};

export default config;