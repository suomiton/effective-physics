/**
 * constants.js
 * 
 * Purpose: Centralized configuration values for the physics simulation.
 * This file defines all constants used throughout the application including
 * canvas dimensions, physics settings, colors, and renderer types.
 * It makes these constants available globally and as a module export.
 */

/**
 * Global Constants object containing all application configuration values
 * @namespace
 * @property {Object} CANVAS - Canvas dimension settings
 * @property {number} CANVAS.WIDTH - Width of the canvas in pixels
 * @property {number} CANVAS.HEIGHT - Height of the canvas in pixels
 * @property {Object} PHYSICS - Physics engine settings
 * @property {number} PHYSICS.GRAVITY - Gravity strength for the simulation
 * @property {boolean} PHYSICS.SLEEP_ENABLED - Whether bodies can sleep when inactive
 * @property {Object} BLOCK - Block object configuration
 * @property {number} BLOCK.SIZE - Default size (width/height) of the interactive block in pixels
 * @property {string} BLOCK.COLOR - Default color of the interactive block
 * @property {Object} SAND - Sand particles configuration
 * @property {number} SAND.GRAIN_SIZE - Size of each sand grain particle in pixels
 * @property {string[]} SAND.COLORS - Array of possible colors for sand particles
 * @property {Object} RENDERER - Renderer type definitions
 * @property {string} RENDERER.WEBGL - Identifier for WebGL renderer
 * @property {string} RENDERER.CANVAS_2D - Identifier for Canvas 2D renderer
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
		DEFAULT_OBJECT: 0x4444ff,
	},

	// Block configuration
	BLOCK: {
		SIZE: 50,
		COLOR: '#4444ff'
	},

	// Sand configuration
	SAND: {
		GRAIN_SIZE: 2,
		COLORS: [
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