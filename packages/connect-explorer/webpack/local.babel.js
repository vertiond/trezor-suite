import { 
    TREZOR_CONNECT_ROOT,
    TREZOR_CONNECT_HTML,
    TREZOR_CONNECT_FILES,
    TREZOR_CONNECT, TREZOR_IFRAME, TREZOR_POPUP,
    SRC, 
    BUILD,
    PORT 
} from './constants';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

module.exports = {
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        'trezor-connect-npm': `${TREZOR_CONNECT}.js`,
        'iframe': `${TREZOR_IFRAME}`,
        'popup': `${TREZOR_POPUP}`,
        'extensionPermissions': `${TREZOR_CONNECT_ROOT}src/js/webusb/extensionPermissions.js`,
        'index': [`${SRC}js/index.js` ]
    },
    output: {
        filename: '[name].[hash].js',
        path: BUILD,
        // globalObject: 'this', // fix for HMR inside WebWorker from 'hd-wallet'
    },
    devServer: {
        contentBase: SRC,
        hot: false,
        https: true,
        port: PORT,
        stats: 'minimal',
        inline: true,
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
        ]
    },
    resolve: {
        modules: [SRC, 'node_modules', `${TREZOR_CONNECT_ROOT}/node_modules`],
        alias: {
            'trezor-connect': `${TREZOR_CONNECT}`,
        }
    },
    performance: {
        hints: false
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(/.blake2b$/, './blake2b.js'),
        new webpack.NormalModuleReplacementPlugin(/env\/node$/, './env/browser'),
        new webpack.NormalModuleReplacementPlugin(/env\/node\/workers$/, '../env/browser/workers'),
        new webpack.NormalModuleReplacementPlugin(/env\/node\/networkUtils$/, '../env/browser/networkUtils'),

        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        
        new HtmlWebpackPlugin({
            chunks: ['index'],
            template: `${SRC}index.html`,
            filename: 'index.html',
            inject: true
        }),

        new HtmlWebpackPlugin({
            chunks: ['iframe'],
            filename: `iframe.html`,
            template: `${TREZOR_CONNECT_HTML}iframe.html`,
            inject: false
        }),
        new HtmlWebpackPlugin({
            chunks: ['popup'],
            filename: 'popup.html',
            template: `${TREZOR_CONNECT_HTML}popup.html`,
            inject: false
        }),
        new HtmlWebpackPlugin({
            chunks: ['extensionPermissions'],
            filename: `extension-permissions.html`,
            template: `${TREZOR_CONNECT_HTML}extension-permissions.html`,
            inject: true
        }),

        new CopyWebpackPlugin([
            { from: TREZOR_CONNECT_FILES, to: 'data' },
        ]),

        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),

        new webpack.DefinePlugin({
            LOCAL: JSON.stringify(`https://localhost:${PORT}/`),
        }),
    ],

    // ignoring "fs" import in fastxpub
    node: {
        fs: "empty",
        path: "empty",
        net: "empty",
        tls: "empty",
    }
}
