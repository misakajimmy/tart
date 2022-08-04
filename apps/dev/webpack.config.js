const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const development = true;
const outputPath = path.resolve(__dirname, 'dist');

module.exports = {
    entry: path.resolve(__dirname, 'src/main.tsx'),
    devtool: 'source-map',
    // devtool: 'hidden-nosources-source-map',
    output: {
        publicPath: "/",
        filename: 'bundle.js',
        path: outputPath,
    },
    devServer: {
        historyApiFallback: true,
        host: "0.0.0.0",
        port: 9008
    },
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".d.ts"],
        alias: {}
    },
    module: {
        rules: [
            // {
            //     // see https://github.com/eclipse-theia/theia/issues/556
            //     test: /source-map-support/,
            //     loader: 'ignore-loader'
            // },
            // {
            //     test: /\.(js)$/,
            //     enforce: 'pre',
            //     loader: 'source-map-loader',
            //     exclude: /node_modules|jsonc-parser|fast-plist|onigasm/
            // },
            {
                test: /\.less$/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "less-loader" // compiles Less to CSS
                }]
            },
            {
                test: /\.css$/,
                exclude: /materialcolors\.css$|\.useable\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /materialcolors\.css$|\.useable\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            esModule: false,
                            injectType: 'lazySingletonStyleTag',
                            attributes: {
                                id: 'wm-theme'
                            }
                        }
                    },
                    'css-loader'
                ]
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            "@babel/preset-env",
                            [
                                "@babel/preset-react",
                                {
                                    "runtime": "classic"
                                }
                            ]
                        ],
                        plugins: [
                            "@babel/plugin-transform-runtime"
                        ]
                    }
                },
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: ["ts-loader"],
            },

            {
                test: /\.png/,
                use: ['file-loader']
            },
            {
                test: /\.xml/,
                use: ['raw-loader']
            },
            {
                test: /\.(svg)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10000,
                    }
                },
                generator: {
                    dataUrl: {
                        mimetype: 'image/svg+xml'
                    }
                }
            },
            {
                test: /\.woff/,
                use: ['file-loader']
            },
            {
                test: /\.eot/,
                use: ['file-loader']
            },
            {
                test: /\.wasm$/,
                type: 'asset/resource'
            },
            {
                test: /\.ttf/,
                use: ['file-loader']
            },
            {
                test: /\.gif/,
                use: ['file-loader']
            },

            // {test: /\.css$/, use: ['style-loader', 'css-loader', 'sass-loader']}
        ]
    },
    plugins: [
        // new CopyWebpackPlugin({
        // patterns: [{
        //     from: monacoEditorCorePath,
        //     to: 'legend/vs'
        // },{
        //     from: blocklyEditorCorePath,
        //     to: 'legend/blockly'
        // }, {
        //     from: blocklyMirrorCorePath,
        //     to: 'legend/blocklymirror'
        // }]
        // }),
        new webpack.ProvidePlugin({
            // the Buffer class doesn't exist in the browser but some dependencies rely on it
            Buffer: ['buffer', 'Buffer']
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "index.html"),
            filename: "index.html"
        }),
    ],
};
