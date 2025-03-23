import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import { GameServer } from './server/game-server';
import type { Configuration as WebpackConfig } from 'webpack';
import type { Configuration as DevServerConfig } from 'webpack-dev-server';

interface WebpackConfigWithDevServer extends WebpackConfig {
  devServer?: DevServerConfig;
}

const config: WebpackConfigWithDevServer = {
  entry: {
    main: './src/index.ts',
    game: './src/game.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: 'tsconfig.json'
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      chunks: ['main', 'game']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.SOCKET_SERVER_URL': JSON.stringify('http://localhost:8080')
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/',
      },
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      }
    ],
    compress: true,
    port: 8080,
    host: '0.0.0.0',
    hot: true,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },
    onListening: function(devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      const server = devServer.server;
      if (!server) {
        throw new Error('webpack-dev-server HTTP server is not defined');
      }

      console.log('Attaching Socket.IO server...');
      new GameServer(server, 8080);
      console.log('Socket.IO server attached successfully');
    }
  },
  optimization: {
    moduleIds: 'named',
    runtimeChunk: 'single'
  }
};

export default config; 