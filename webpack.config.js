module.exports = {
  entry: "./test/entry.js",
  output: {
    path: "test",
    filename: "out.js"
  },
  target: "node",
  resolve: {
    extensions: ["", ".js", ".ts"]
  },
  module: {
    loaders: [
      {test: /\.emc\.(j|t)s$/, loader: "./../index.js"},
      {test: /\.ts$/, loader: "awesome-typescript-loader"}
    ]
  }
}