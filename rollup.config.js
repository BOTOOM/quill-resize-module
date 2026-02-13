const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const typescript = require("@rollup/plugin-typescript");
const terser = require("@rollup/plugin-terser");
const postcss = require("rollup-plugin-postcss");

module.exports = [
  {
    input: "src/main.ts",
    output: {
      name: "QuillResizeModule",
      file: "dist/quill-resize-module.js",
      format: "umd",
      sourcemap: true
    },
    plugins: [
      nodeResolve({ 
        preferBuiltins: false,
        browser: true 
      }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.rollup.json",
        declaration: false,
        sourceMap: true
      }),
      postcss({ 
        inject: true,
        minimize: false
      })
    ]
  },
  {
    input: "src/main.ts",
    output: {
      name: "QuillResizeModule",
      file: "dist/quill-resize-module.min.js",
      format: "umd",
      sourcemap: false
    },
    plugins: [
      nodeResolve({ 
        preferBuiltins: false,
        browser: true 
      }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.rollup.json",
        declaration: false,
        sourceMap: false
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log'],
          passes: 2
        },
        mangle: {
          properties: {
            regex: /^_/
          }
        },
        format: {
          comments: false
        }
      }),
      postcss({ 
        inject: true,
        minimize: {
          preset: ['default', {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            minifySelectors: true
          }]
        }
      })
    ]
  }
];
