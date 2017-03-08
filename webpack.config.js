'use strict';

var webpack = require('webpack'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    CleanPlugin = require('clean-webpack-plugin'),
    path = require('path'),
    autoprefixer = require('autoprefixer'),
    glob = require('glob'),
    base = './';

var isProduction = function () {
    var env = process.env.NODE_ENV || "";
    var isRelease = env.trim() === "production";
    return isRelease;
};

var getLessLoader = function () {
    if (isProduction()) {
        return {
            test: /\.less?$/,
            loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
        };
    } else {
        return {
            test: /\.less?$/,
            loaders: ['style-loader', 'css-loader', 'less-loader?{"sourceMap":true}']
        };
    }
};

var getCssLoader = function () {
    if (isProduction()) {
        return {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract("style-loader", "css-loader")
        };
    } else {
        return {
            test: /\.css$/,
            loaders: ['style-loader', 'css-loader']
        };
    }
};

var plugins = [
    new webpack.ProvidePlugin({
        $: 'jquery', // 使jquery变成全局变量,不用在自己文件require('jquery')了
        jQuery: 'jquery',
        'window.jQuery': 'jquery'
    }),
    //清空输出目录
    new CleanPlugin(['build'], {
        root: path.resolve(__dirname),
        verbose: true,  //打印日志
        dry: false,
        // exclude: ["common"]//排除不删除的目录
    }),
    new webpack.DefinePlugin({
        '__DEV__': !isProduction(),
        'process.env.NODE_ENV': isProduction() ? '"production"' : '"development"'
    }),
    // new webpack.optimize.CommonsChunkPlugin('common', isProduction() ? 'common/common.[hash].js' : 'common/common.js'),
    new ExtractTextPlugin(isProduction() ? '[name]/[name].[hash].css' : '[name]/[name].css'),
    new webpack.HotModuleReplacementPlugin()
];

if (isProduction()) {
    plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.OccurenceOrderPlugin()
    )
}

// 获取指定路径下的入口文件
function getEntries(globPath) {
    var files = glob.sync(globPath),
        entries = {};

    files.forEach(function (filepath) {
        // 取倒数第二层(src下面的文件夹)做包名
        var split = filepath.split('/');
        var name = split[split.length - 2];

        entries[name] = './' + filepath;
    });
    return entries;
}

var entryJs = getEntries('src/pages/**/*.js');

//动态加载HtmlWebpackPlugin插件
Object.keys(entryJs).forEach(function (pageName) {
    // 每个页面生成一个html
    if (pageName === 'index') {
        plugins.push(
            new HtmlWebpackPlugin({
                // 生成出来的html文件名
                filename: pageName + '.html',
                // 每个html的模版，这里多个页面使用同一个模版
                template: './src/pages/' + pageName + '/' + pageName + '.html',
                // 自动将引用插入html
                inject: true,
                // 每个html引用的js模块，也可以在这里加上vendor等公用模块
                chunks: [pageName],
            })
        )
    } else {
        plugins.push(
            new HtmlWebpackPlugin({
                // 生成出来的html文件名
                filename: pageName + '/index.html',
                // 每个html的模版，这里多个页面使用同一个模版
                template: './src/pages/' + pageName + '/' + pageName + '.html',
                // 自动将引用插入html
                inject: true,
                // 每个html引用的js模块，也可以在这里加上vendor等公用模块
                chunks: [pageName],
            })
        )
    }


})

module.exports = {

    target: 'web',
    cache: true,

    entry: entryJs,

    output: {
        path: base + 'build',
        filename: isProduction() ? '[name]/[name].[hash].js' : '[name]/[name].js',
        chunkFilename: isProduction() ? '[name]/[name].[hash].chunk.js' : '[name]/[name].chunk.js'
    },

    module: {
        loaders: [
            {test: /\.js?$/, exclude: /node_modules/, loader: 'babel?cacheDirectory'},
            {test: /\.styl$/, loader: 'style-loader!css-loader!stylus-loader'},
            {test: /\.scss$/, loaders: ["style", "css", "sass"]},
            getLessLoader(), getCssLoader(),
            {test: /\.(jpg|png|jpeg|gif)$/, loader: 'url?limit=10000&name=./static/img/[name]-[hash].[ext]'},
            {test: /\.(woff|woff2|eot|ttf|svg)(\?.*)?/i, loader: 'file-loader?name=./static/fonts/[name]-[hash].[ext]'},
            {test: /\.rt/, loader: "react-templates-loader"},
            {
                test: require.resolve('jquery'),  // 此loader配置项的目标是NPM中的jquery
                loader: 'expose?$!expose?jQuery', // 先把jQuery对象声明成为全局变量`jQuery`，再通过管道进一步又声明成为全局变量`$`
            },
            {test: /\.html$/, loader: 'html-withimg-loader'}
        ],
        noParse: []
    },

    plugins: plugins,
    resolve: {
        extensions: ['', '.js', '.less', '.css', '.html']
    },
    debug: isProduction() ? false : true,
    devtool: isProduction() ? null : 'eval-cheap-module-source-map',
    devServer: {
        port: 8080,
        host: 'localhost',
        contentBase: base + 'build',
        historyApiFallback: true,
        inline: true,
        hot: true,
        // proxy: {
        //     '/api/v1/*': {
        //         //target: 'http://192.168.7.239:2324',  //测试环境
        //         //target: 'https://beta.itsomg.com',  //预发环境
        //         target: 'https://ida.itsomg.com',  //线上环境
        //         secure: false,
        //         changeOrigin: true
        //     }
        // }
    },

    postcss: function () {
        return [autoprefixer];
    }
}

