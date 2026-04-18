/**
 * XML ↔ JSON — web adapter. Single source of truth lives in
 * @nouploads/core/tools/xml-json.
 */
export {
	type ConversionResult,
	detectFormat,
	jsonToXml,
	MAX_INPUT_SIZE,
	normalizeSmartQuotes,
	validateJson,
	validateXml,
	xmlToJson,
} from "@nouploads/core/tools/xml-json";
