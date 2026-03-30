# Batch 2: Next 10 Tools

| # | Tool | Status | Tests | Build | Notes |
|---|------|--------|-------|-------|-------|
| 1 | PDF Page Numbers | ✅ | 15/15 | ✅ | 7 core + 8 web |
| 2 | PDF Protect | ✅ | 18/18 | ✅ | 9 core + 9 web, RC4-128 encryption via pdf-lib PDFContext |
| 3 | PDF Unlock | ✅ | 11/11 | ✅ | 5 core + 6 web, ignoreEncryption approach |
| 4 | Image Filters | ✅ | 11/11 | ✅ | 5 core + 6 web, OffscreenCanvas + CSS filters |
| 5 | Regex Tester | ✅ | 20/20 | ✅ | 5 core + 15 web |
| 6 | Timestamp Converter | ✅ | 28/28 | ✅ | 7 core + 21 web |
| 7 | UUID Generator | ✅ | 24/24 | ✅ | 5 core + 19 web, v4 + v7 (RFC 9562) |
| 8 | URL Encoder/Decoder | ✅ | 31/31 | ✅ | 6 core + 25 web |
| 9 | Text Diff | ✅ | 17/17 | ✅ | 4 core + 13 web, LCS algorithm |
| 10 | Markdown Preview | ✅ | 36/36 | ✅ | 5 core + 31 web, uses marked@17.0.5 |

**Total: 211 new tests, all passing. Build succeeds. All 10 routes prerendered.**

New dependency: `marked@17.0.5` (Markdown Preview only).
