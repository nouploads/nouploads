# Third-Party Notices

The `nouploads` package bundles or depends on the following open-source software. Each retains its own license; the combined work is distributed under the [MIT License](LICENSE).

## Runtime dependencies

| Package | Version | License | Source |
|---|---|---|---|
| [@clack/prompts](https://github.com/bombshell-dev/clack) | 1.1.0 | MIT | https://github.com/bombshell-dev/clack |
| [@webtoon/psd](https://github.com/webtoon/psd) | 0.4.0 | MIT | https://github.com/webtoon/psd |
| [commander](https://github.com/tj/commander.js) | 14.0.3 | MIT | https://github.com/tj/commander.js |
| [exifr](https://github.com/MikeKovarik/exifr) | 7.1.3 | MIT | https://github.com/MikeKovarik/exifr |
| [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) | 5.6.0 | MIT | https://github.com/NaturalIntelligence/fast-xml-parser |
| [fflate](https://github.com/101arrowz/fflate) | 0.8.2 | MIT | https://github.com/101arrowz/fflate |
| [js-beautify](https://github.com/beautifier/js-beautify) | 1.15.4 | MIT | https://github.com/beautifier/js-beautify |
| [js-yaml](https://github.com/nodeca/js-yaml) | 4.1.1 | MIT | https://github.com/nodeca/js-yaml |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | 1.17.1 | MIT | https://github.com/Hopding/pdf-lib |
| [qrcode](https://github.com/soldair/node-qrcode) | 1.5.4 | MIT | https://github.com/soldair/node-qrcode |
| [sharp](https://github.com/lovell/sharp) | 0.34.5 | Apache-2.0 | https://github.com/lovell/sharp |
| [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) | 15.7.3 | MIT | https://github.com/sql-formatter-org/sql-formatter |
| [svgo](https://github.com/svg/svgo) | 4.0.1 | MIT | https://github.com/svg/svgo |
| [utif2](https://github.com/photopea/UTIF.js) | 4.1.0 | MIT | https://github.com/photopea/UTIF.js |

## Inlined source (built into dist/)

The following packages from the [nouploads/nouploads](https://github.com/nouploads/nouploads) monorepo are inlined into the published `nouploads` tarball at build time and not declared as runtime dependencies:

- `@nouploads/core` — MIT
- `@nouploads/backend-sharp` — MIT

## Native binary dependencies

[sharp](https://github.com/lovell/sharp) installs platform-specific prebuilt binaries (libvips). Each prebuilt binary contains compiled libraries with their own licenses; see [sharp's release notes](https://github.com/lovell/sharp/blob/main/.changeset) and [libvips license](https://github.com/libvips/libvips/blob/master/COPYING) (LGPL-2.1-or-later).
