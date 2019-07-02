const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  entry: ["@babel/polyfill", path.resolve(__dirname, "src", "index.js")],
  mode: "development",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /.obj$/,
        use: {
          loader: "file-loader"
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      templateContent: `
      <!DOCTYPE html>
      <html lang="en">
      <style>
      *, *::after, *::before {
        margin: 0;
        border: 0;
        padding: 0;
        overflow: hidden;
      }
        #canvas {
          height: 100vh;
          width: 100vw;
        }
      </style>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta http-equiv="X-UA-Compatible" content="ie=edge"/>
        <title>Document</title>
      </head>
      <body>
        <div id="canvas"></div>
      </body>
      </html>
    `
    }),
    new webpack.ProvidePlugin({
      THREE: "three",
      BAS: "three-bas"
    })
  ],
  devServer: {
    hot: true,
    open: true,
    contentBase: "/dist",
    port: 3000
  },
  devtool: "source-map"
};
