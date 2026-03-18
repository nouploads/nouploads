import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  prerender: [
    "/",
    "/about",
    "/image/heic-to-jpg",
    "/image/compress",
    "/image/convert",
    "/image/resize",
    "/image/exif",
    "/image/to-pdf",
  ],
} satisfies Config;
