import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("about", "routes/about.tsx"),
	route("image/heic-to-jpg", "routes/image/heic-to-jpg.tsx"),
	route("image/compress", "routes/image/compress.tsx"),
	route("image/convert", "routes/image/convert.tsx"),
	route("image/resize", "routes/image/resize.tsx"),
	route("image/exif", "routes/image/exif.tsx"),
	route("image/to-pdf", "routes/image/to-pdf.tsx"),
] satisfies RouteConfig;
