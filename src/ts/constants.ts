/**
 * constants.ts
 *
 * Purpose: Centralized configuration values for the physics simulation.
 * This file defines all constants used throughout the application including
 * canvas dimensions, physics settings, colors, and renderer types.
 * It makes these constants available globally and as a module export.
 */

import type { InteractiveObjectConfig } from "./types";

/**
 * Global Constants object containing all application configuration values
 */
const Constants = {
	// Canvas dimensions
	CANVAS: {
		WIDTH: 640,
		HEIGHT: 480,
	},

	// Physics settings
	PHYSICS: {
		GRAVITY: 1.0,
		SLEEP_ENABLED: true,
	},

	// Colors
	COLORS: {
		BACKGROUND: "#ffffff",
		DEFAULT_OBJECT: 0x4444ff,
	},

	// Block configuration
	BLOCK: {
		SIZE: 50,
		COLOR: "#4444ff",
	},

	// Sand configuration
	SAND: {
		GRAIN_SIZE_MIN: 0.5,
		GRAIN_SIZE_MAX: 2,
		COLORS: ["#E6C288", "#D4B16A", "#C19A53", "#B3894D", "#F0D6A7"],
	},

	// Renderer types
	RENDERER: {
		WEBGL: "webgl",
		CANVAS_2D: "2d",
	},

	// Interactive objects configuration
	INTERACTIVE_OBJECTS: [
		{
			id: "main-block",
			type: "rectangle" as const,
			x: 320, // center of canvas width
			y: 240, // center of canvas height
			width: 50,
			height: 50,
			color: "#4444ff",
			mass: 10,
			frictionAir: 0.0,
			restitution: 0,
			isStatic: false,
			isDraggable: true,
		},
	] as const as InteractiveObjectConfig[],
};

// Make it available globally
if (typeof window !== "undefined") {
	window.Constants = Constants;
}

export default Constants;
