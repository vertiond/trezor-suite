const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const { WebpackPluginServe } from 'webpack-plugin-serve';
// import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

const { SRC, BUILD, PORT } = require('./constants');

console.group('SRC, BUILD, PORT', SRC, BUILD, PORT);
const isDev = true;
const baseDir = '.';

module.exports = {
    target: 'web',
    mode: 'development',
    devtool: 'inline-source-map',
    entry: `${SRC}/index.ts`,

    // entry: ['webpack-plugin-serve/client'],

    output: {
        // filename: '[name]-[hash].js',
        path: BUILD,
    },

    // entry: [path.join(baseDir, 'src', 'index.ts')],
    // output: {
    //     path: path.join(baseDir, 'build'),
    // },
    stats: {
        children: true,
    },
    devServer: {
        static: {
            directory: `${SRC}`,
        },
        hot: false,
        https: false,
        port: PORT,
    },
    module: {
        rules: [
            // TypeScript/JavaScript
            {
                test: /\.(t)sx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        // cacheDirectory: true,
                        presets: ['@babel/preset-react', '@babel/preset-typescript'],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            [
                                'babel-plugin-styled-components',
                                {
                                    displayName: true,
                                    preprocess: true,
                                },
                            ],
                            // todo: for some reason does not work 
                            // ...(isDev ? ['react-refresh/babel'] : []),
                        ],
                    },
                },
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    performance: {
        hints: false,
    },
    plugins: [
        // provide fallback plugins
        new HtmlWebpackPlugin({
            minify: !isDev,
            // templateParameters: {
            //     assetPrefix,
            //     isOnionLocation: FLAGS.ONION_LOCATION_META,
            // },
            inject: 'body',
            scriptLoading: 'blocking',
            template: path.join(SRC, 'static', 'index.html'),
            filename: path.join(BUILD, 'index.html'),
        }),
        // new WebpackPluginServe({
        //     port: PORT+1,
        //     hmr: true,
        //     static: BUILD,
        //     progress: true,
        //     historyFallback: {
        //         htmlAcceptHeaders: ['text/html', '*/*'],
        //         rewrites: [],
        //     },
        //     client: {
        //         address: `localhost:${PORT+1}`,
        //         protocol: 'ws',
        //     },
        // }),
        // new ReactRefreshWebpackPlugin({
        //     overlay: false,
        // }),
    ],
    optimization: {
        emitOnErrors: true,
        moduleIds: 'named',
    },
};
