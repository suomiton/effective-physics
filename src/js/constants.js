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
 * @property {Object} COLORS - Color definitions for various elements
 * @property {string} COLORS.BACKGROUND - Background color of the canvas
 * @property {string} COLORS.BLOCK - Color for the main interactive block
 * @property {number} COLORS.DEFAULT_OBJECT - Default color for 3D objects (hexadecimal)
 * @property {string[]} COLORS.SAND - Array of colors for sand particles
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