const path = require('path')
const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')
module.exports = defineConfig({
  transpileDependencies: true,
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
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false, // 👈 关键就在这里
      }),
    ],
  },

  devServer: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000/',
        changeOrigin: true,
        onProxyReq: function (proxyReq, req) {
          // If the original request had an authorization header, copy it
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization)
          }
        },
      },
    },
  },
})
