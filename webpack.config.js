const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",

  entry: "./src/main.jsx",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    publicPath: "/", // ✅ REQUIRED for Netlify
    clean: true,
  },

  resolve: {
    extensions: [".js", ".jsx"],
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),

    // ✅ Copy Netlify redirects into dist (use .txt source and ignore if missing)
    new CopyWebpackPlugin({
      patterns: [
        { from: "public/_redirects.txt", to: "_redirects", toType: "file", noErrorOnMissing: true },
      ],
    }),
  ],

  devServer: {
    historyApiFallback: true, // ✅ SPA routing locally
    static: {
      directory: path.join(__dirname, "public"),
    },
    port: 5173,
    hot: true,
  },
};
