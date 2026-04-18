/**
 * YAML ↔ JSON — web adapter. Single source of truth lives in
 * @nouploads/core/tools/yaml-json.
 */
export {
	type ConversionResult,
	detectFormat,
	jsonToYaml,
	MAX_INPUT_SIZE,
	validateJson,
	validateYaml,
	yamlToJson,
} from "@nouploads/core/tools/yaml-json";
