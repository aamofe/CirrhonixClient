const path = require("path");
const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  },

  devServer: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000/",
        changeOrigin: true,
        onProxyReq: function (proxyReq, req) {
          // If the original request had an authorization header, copy it
          if (req.headers.authorization) {
            proxyReq.setHeader("Authorization", req.headers.authorization);
          }
        },
      },
    },
  },
});
