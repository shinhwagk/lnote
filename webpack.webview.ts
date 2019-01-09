import * as path from 'path';

import * as webpack from 'webpack';

import * as CleanWebpackPlugin from "clean-webpack-plugin";
import * as HtmlWebpackPlugin from 'html-webpack-plugin';

const config: webpack.Configuration = {
    target: "web",
    entry: "./webview/src/index.tsx",
    output: {
        filename: "[name].wv.js",
        path: path.resolve(__dirname, "out"),
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
    },
    module: {
        rules: [{
            test: /\.tsx?$/, use: [
                { loader: "babel-loader" },
                { loader: 'ts-loader', options: { configFile: "tsconfig.webview.json" } }],
        }]
    },
    plugins: [
        new CleanWebpackPlugin("out"),
        new HtmlWebpackPlugin({
            filename: "index.wv.html",
            template: "webview/assets/template.html"
        })
        
    ]
};

export default config;