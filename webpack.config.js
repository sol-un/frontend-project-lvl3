const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devServer: {
    contentBase: path.join(path.resolve(), 'dist'),
    compress: true,
    port: 3000
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [{
          loader: 'style-loader',
        }, {
          loader: 'css-loader',
        }, {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: ['precss', 'autoprefixer'],
            },
          },
        }],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/template.html',
    }),
  ],
};