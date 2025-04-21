/**
 * Centralized constants for the physics simulation
 */
const Constants = {
	// Canvas dimensions
	CANVAS: {
		WIDTH: 640,
		HEIGHT: 480
	},

	// Physics settings
	PHYSICS: {
		GRAVITY: 1.0,
		SLEEP_ENABLED: true
	},

	// Colors
	COLORS: {
		BACKGROUND: '#ffffff',
		BLOCK: 'blue',
		DEFAULT_OBJECT: 0x4444ff,
		SAND: [
			'#E6C288',
			'#D4B16A',
			'#C19A53',
			'#B3894D',
			'#F0D6A7'
		]
	},

	// Renderer types
	RENDERER: {
		WEBGL: 'webgl',
		CANVAS_2D: '2d'
	}
};

// Make it available globally and as a module export
if (typeof window !== 'undefined') {
	window.Constants = Constants;
}

// For module systems
if (typeof module !== 'undefined' && module.exports) {
	module.exports = Constants;
}