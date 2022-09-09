const WorkerPlugin = require('worker-plugin');

module.exports = {
    module: {
        rules: [
            { test: /\.wgsl$/i, loader: "ts-shader-loader" }
        ]
    },
    // plugins: [
    //     new WorkerPlugin()
    // ]
    resolve: {
        fallback: {
            "path": false,
            "fs": false,
            "crypto": false
        },
      },
};
