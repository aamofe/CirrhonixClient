const path = require('path')
const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: '/',
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      }),
    ],
  },

  devServer: {
    port: 8091,
    proxy: {
      '/api': {
        target: 'http://125.122.39.119:8090/',
        changeOrigin: true,
        onProxyReq: function (proxyReq, req) {
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization)
          }
        },
      },
    },
  },
})
