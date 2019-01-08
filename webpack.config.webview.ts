import * as path from 'path';

import * as webpack from 'webpack';

import * as CleanWebpackPlugin from "clean-webpack-plugin";
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';

const config: webpack.Configuration = {
    target: "web",
    entry: "./webview/src/index.tsx",
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "out-webview"),
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
    devtool: "source-map",
    plugins: [
        new CleanWebpackPlugin("out-webview"),
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "webview/assets/template.html"
        }),
        new CopyWebpackPlugin(['webview/assets/note.svg'])
    ]
};

export default config;