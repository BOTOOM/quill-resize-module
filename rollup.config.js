import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";

export default [
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
