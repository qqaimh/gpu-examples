
module.exports = {
    module: {
        rules: [
            { test: /\.wgsl$/i, loader: "ts-shader-loader" }
        ]
    },
    resolve: {
        fallback: {
            "path": false,
            "fs": false,
            "crypto": false
        },
      },
};
