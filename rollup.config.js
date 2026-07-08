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
    // Real ES module build (native `export`/`import` syntax), so Node's
    // ESM loader and modern bundlers (Vite, Webpack 5, Rollup) can resolve
    // this package's "import" condition to actual ESM instead of a UMD
    // bundle wrapped in a CommonJS/AMD/global detector. The ".mjs"
    // extension makes Node treat it as ESM unambiguously, regardless of
    // this package's (CommonJS-default) "type" field.
    input: "src/main.ts",
    output: {
      file: "dist/quill-resize-module.esm.mjs",
      format: "es",
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
