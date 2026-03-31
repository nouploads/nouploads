module.exports = {
	ci: {
		collect: {
			// Serve the prerendered static build
			staticDistDir: "./build/client",
			// Audit a representative set of pages (not all 79 — that would be slow)
			url: [
				"http://localhost/index.html",
				"http://localhost/image/index.html",
				"http://localhost/pdf/index.html",
				"http://localhost/developer/index.html",
				"http://localhost/image/heic-to-jpg/index.html",
				"http://localhost/pdf/split/index.html",
				"http://localhost/developer/json-formatter/index.html",
			],
			numberOfRuns: 1,
		},
		assert: {
			assertions: {
				// Performance: entry chunk is ~59KB gz, pages are lightweight
				"categories:performance": ["warn", { minScore: 0.8 }],
				// Accessibility: basic a11y rules
				"categories:accessibility": ["warn", { minScore: 0.9 }],
				// Best practices
				"categories:best-practices": ["warn", { minScore: 0.9 }],
				// SEO: meta tags, canonical, etc.
				"categories:seo": ["warn", { minScore: 0.9 }],
			},
		},
		upload: {
			// Store results locally (no external LHCI server)
			target: "filesystem",
			outputDir: "./.lighthouseci",
		},
	},
};
