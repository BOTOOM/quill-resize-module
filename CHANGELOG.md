## 2.2.0 (2026-07-08)

* Merge pull request #16 from BOTOOM/feat/new-version ([1dcaa14](https://github.com/BOTOOM/quill-resize-module/commit/1dcaa14)), closes [#16](https://github.com/BOTOOM/quill-resize-module/issues/16)
* fix(build): use ES2017 target so native class extension works in browsers ([aa6afbc](https://github.com/BOTOOM/quill-resize-module/commit/aa6afbc))
* fix(ci): repair out-of-sync lock file and modernize workflow actions/Node ([06c58bf](https://github.com/BOTOOM/quill-resize-module/commit/06c58bf)), closes [#16](https://github.com/BOTOOM/quill-resize-module/issues/16)
* fix(deps): remediate dependency vulnerabilities conservatively ([c08678b](https://github.com/BOTOOM/quill-resize-module/commit/c08678b)), closes [hi#severity](https://github.com/hi/issues/severity)
* fix(main): correct quill text-change handler signature ([4639469](https://github.com/BOTOOM/quill-resize-module/commit/4639469))
* fix(packaging): publish a real ESM build and fix exports/module resolution ([344228a](https://github.com/BOTOOM/quill-resize-module/commit/344228a))
* docs: add library improvement analysis ([1bae473](https://github.com/BOTOOM/quill-resize-module/commit/1bae473))
* docs(demo): update demo to stable Quill and add per-framework examples ([751e4d2](https://github.com/BOTOOM/quill-resize-module/commit/751e4d2)), closes [#pages](https://github.com/BOTOOM/quill-resize-module/issues/pages)
* docs(seo): expand package metadata and README to reflect v2.1 features ([1acd11e](https://github.com/BOTOOM/quill-resize-module/commit/1acd11e))
* feat(a11y): make overlay keyboard-operable with real buttons and shortcuts ([0104c5e](https://github.com/BOTOOM/quill-resize-module/commit/0104c5e))
* feat(api): add typed public callbacks and ResizeChangeEvent ([bce4488](https://github.com/BOTOOM/quill-resize-module/commit/bce4488))
* feat(constraints): add resize bounds, aspect-ratio lock, and px/percent modes ([7a1bb4e](https://github.com/BOTOOM/quill-resize-module/commit/7a1bb4e))
* feat(embeds): support custom embed tags and a resolver for wrapper elements ([717bff8](https://github.com/BOTOOM/quill-resize-module/commit/717bff8))
* feat(media): add alt text and title editing panel with Delta persistence ([7d7305a](https://github.com/BOTOOM/quill-resize-module/commit/7d7305a))
* feat(persistence): persist width/height/align through Quill's Delta model ([285349e](https://github.com/BOTOOM/quill-resize-module/commit/285349e)), closes [#13](https://github.com/BOTOOM/quill-resize-module/issues/13) [#14](https://github.com/BOTOOM/quill-resize-module/issues/14)
* feat(resize): add pinch-to-resize for touch devices ([5025af5](https://github.com/BOTOOM/quill-resize-module/commit/5025af5)), closes [#editor-resizer](https://github.com/BOTOOM/quill-resize-module/issues/editor-resizer)
* feat(toolbar): implement documented showToolbar/showSize/toolbar options ([bf912e3](https://github.com/BOTOOM/quill-resize-module/commit/bf912e3))
* feat(touch): migrate resize drag and outside-click to Pointer Events ([a912f60](https://github.com/BOTOOM/quill-resize-module/commit/a912f60))
* feat(upload): add opt-in paste/drop image upload hooks with optional compression ([8e40225](https://github.com/BOTOOM/quill-resize-module/commit/8e40225))
* refactor(lifecycle): add module-level destroy() and fix listener/timer leaks ([271079b](https://github.com/BOTOOM/quill-resize-module/commit/271079b))
* ci: enforce lint and test execution in CI and release workflows ([3958eeb](https://github.com/BOTOOM/quill-resize-module/commit/3958eeb))
* test: add vitest + jsdom test suite and migrate eslint to flat config ([b84b8a1](https://github.com/BOTOOM/quill-resize-module/commit/b84b8a1))

## 2.1.0 (2026-02-13)

* chore: add ESLint configuration and improve build artifacts ([a3f0945](https://github.com/BOTOOM/quill-resize-module/commit/a3f0945))
* chore: convert rollup config to CommonJS and refine audit settings ([472846d](https://github.com/BOTOOM/quill-resize-module/commit/472846d))
* chore: enhance semantic-release configuration and update release workflow ([c60b9a5](https://github.com/BOTOOM/quill-resize-module/commit/c60b9a5))
* chore: fix package json ([0ad86ac](https://github.com/BOTOOM/quill-resize-module/commit/0ad86ac))
* chore: migrate from bundlesize to size-limit and update semantic-release dependencies ([6e64f50](https://github.com/BOTOOM/quill-resize-module/commit/6e64f50))
* chore: remove package-lock.json from gitignore and fix file ending ([83d05b6](https://github.com/BOTOOM/quill-resize-module/commit/83d05b6))
* chore: restructure CI/CD workflows and add semantic release automation ([ea8d108](https://github.com/BOTOOM/quill-resize-module/commit/ea8d108))
* chore: update CI workflow and changelog configuration ([1bb916c](https://github.com/BOTOOM/quill-resize-module/commit/1bb916c))
* chore: update demo with new video embeds and refresh demo.gif ([ff8da34](https://github.com/BOTOOM/quill-resize-module/commit/ff8da34))
* chore: upgrade build tooling and update TypeScript configuration ([5834f78](https://github.com/BOTOOM/quill-resize-module/commit/5834f78))
* fix positioning of resizer when nested inside relative elements (list items) ([048abc8](https://github.com/BOTOOM/quill-resize-module/commit/048abc8))
* Merge pull request #12 from guilds-finance/master ([6db6843](https://github.com/BOTOOM/quill-resize-module/commit/6db6843)), closes [#12](https://github.com/BOTOOM/quill-resize-module/issues/12)
* Merge pull request #15 from BOTOOM/develop ([c9ba2fc](https://github.com/BOTOOM/quill-resize-module/commit/c9ba2fc)), closes [#15](https://github.com/BOTOOM/quill-resize-module/issues/15)
* feat: enhance toolbar UI with responsive design and improved controls ([15d55e4](https://github.com/BOTOOM/quill-resize-module/commit/15d55e4))
* feat: improve iframe tracking and add YouTube embed normalization ([23328cd](https://github.com/BOTOOM/quill-resize-module/commit/23328cd))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.1](https://github.com/BOTOOM/quill-resize-module/compare/v2.0.0...v2.0.1) (2024-05-23)


### Bug Fixes

* **dependencies:** fix security dependencies abput rollup plugins ([0e09f97](https://github.com/BOTOOM/quill-resize-module/commit/0e09f971ca2791c8d94584f756fd4fca7690db30))

### [2.0.0](https://github.com/BOTOOM/quill-resize-module/compare/v1.1.1...v2.0.0) (2021-12-09)


### Features

* For resizing, the `style` HTML property is no longer used.
* Added the ability to display the size of the image or video.
* The toolbar can be disabled totally or partially.
* Update in the documentation.

### [1.1.1](https://github.com/BOTOOM/quill-resize-module/compare/v1.1.0...v1.1.1) (2021-12-02)


### Documentation

* Update Documentation

### [1.1.0](https://github.com/BOTOOM/quill-resize-module/compare/v1.0.0...v1.1.0) (2021-12-02)


### Features

* Add option to hidden toolbar
* Add option to ignore use style and use html attributes
* Update readme
