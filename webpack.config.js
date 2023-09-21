const path = require('path');

module.exports = {
    entry: {
        // server: './server/index.ts',
        admin: './client/entries/admin.ts',
        main: './client/entries/main.ts'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: ['/node_modules/', '/server/']
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../dist')
    }
}