const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { GameServer } = require('./server/game-server');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.SOCKET_SERVER_URL': JSON.stringify('http://localhost:8080')
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
    host: '0.0.0.0',
    hot: true,
    allowedHosts: 'all',
    onListening: function(devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      const server = devServer.server;
      if (!server) {
        throw new Error('webpack-dev-server HTTP server is not defined');
      }

      // Server is now guaranteed to exist and be listening
      console.log('Attaching Socket.IO server...');
      new GameServer(server, 8080);
      console.log('Socket.IO server attached successfully');
    }
  },
}; 