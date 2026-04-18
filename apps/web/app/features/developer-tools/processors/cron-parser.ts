/**
 * CRON expression parser — web adapter. Single source of truth lives in
 * @nouploads/core/tools/cron-parser.
 */
export {
	type CronField,
	type CronParsed,
	type CronValidationResult,
	describeCron,
	getNextRuns,
	parseCronExpression,
	validateCronExpression,
} from "@nouploads/core/tools/cron-parser";
