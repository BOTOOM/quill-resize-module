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
      format: "umd"
    },
    plugins: [nodeResolve(), commonjs(), typescript(), postcss({ inject: true })]
  },
  {
    input: "src/main.ts",
    output: {
      name: "QuillResizeModule",
      file: "dist/quill-resize-module.min.js",
      format: "umd"
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript(),
      terser(),
      postcss({ inject: true })
    ]
  }
];
