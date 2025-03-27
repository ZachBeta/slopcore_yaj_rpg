const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/debug/multiplayer-debug.ts',
  output: {
    filename: 'multiplayer-debug.bundle.js',
    path: path.resolve(__dirname, 'dist/debug'),
    library: {
      name: 'MultiplayerDebugger',
      type: 'umd',
      export: ['createMultiplayerDebugger', 'MultiplayerDebugger']
    }
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    // Use our standalone HTML file instead of generating a new one
    new HtmlWebpackPlugin({
      template: './public/debug/multiplayer-debug.html',
      filename: 'index.html',
      inject: 'body'
    })
  ]
}; 