const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './webflow-bundle.js',
  output: {
    filename: 'chatbot-widget.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NEXT_PUBLIC_CHATBOT_API_URL': JSON.stringify('http://localhost:8000/chatbot/'),
    }),
  ],
  externals: {}, // Remove this line or set it to an empty object
};