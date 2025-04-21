const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

// Determine if this is a production build
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--mode=production');

module.exports = {
	mode: isProduction ? "production" : "development",
	entry: "./src/ts/app.ts",
	devtool: isProduction ? "source-map" : "inline-source-map",
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"]
	},
	output: {
		filename: '[name].[contenthash].js',
		chunkFilename: '[name].[contenthash].js',
		path: path.resolve(__dirname, 'dist'),
		clean: true
	},
	optimization: {
		minimize: isProduction,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: isProduction,
						drop_debugger: isProduction
					},
					output: {
						comments: false
					}
				},
				extractComments: false
			})
		],
		splitChunks: {
			chunks: 'all',
			maxInitialRequests: Infinity,
			minSize: 20000,
			cacheGroups: {
				matterjs: {
					test: /[\\/]node_modules[\\/]matter-js[\\/]/,
					name: 'matter-vendor',
					priority: 20
				},
				three: {
					test: /[\\/]node_modules[\\/]three[\\/]/,
					name: 'three-vendor',
					priority: 20
				},
				vendors: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					priority: 10
				}
			}
		}
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'src/index.html',
			inject: 'body',
			minify: isProduction ? {
				collapseWhitespace: true,
				removeComments: true,
				removeRedundantAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				useShortDoctype: true
			} : false
		}),
		new CopyWebpackPlugin({
			patterns: [
				{ from: 'src/css', to: 'css' },
				{ from: 'src/assets', to: 'assets', noErrorOnMissing: true }
			]
		}),
		...(isProduction ? [
			new CompressionPlugin({
				algorithm: 'gzip',
				test: /\.(js|css|html|svg)$/,
				threshold: 10240,
				minRatio: 0.8
			})
		] : [])
	],
	devServer: {
		static: {
			directory: path.join(__dirname, 'dist'),
		},
		port: 9000,
		open: true,
		hot: true
	}
};
