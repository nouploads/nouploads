/**
 * JSON ↔ CSV converter — web adapter. Single source of truth lives in
 * @nouploads/core/tools/json-csv.
 */
export {
	type CsvToJsonOptions,
	csvToJson,
	escapeCSVField,
	flattenObject,
	type JsonToCsvOptions,
	jsonToCsv,
	MAX_INPUT_SIZE,
	parseCSVLine,
} from "@nouploads/core/tools/json-csv";
