module.exports = {
    module: {
        rules: [
            { test: /\.wgsl$/i, loader: "ts-shader-loader" }
        ]
    },
    devServer: {
        allowedHosts: 'all',
    },
};
