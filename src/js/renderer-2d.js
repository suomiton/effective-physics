/**
 * renderer-2d.js
 * 
 * Purpose: Provides 2D canvas rendering capability for the physics simulation.
 * This module encapsulates the Canvas 2D-based renderer for Matter.js physics objects.
 * It creates a 2D context renderer, manages its lifecycle, and provides a simple
 * interface for starting and stopping rendering.
 */

/**
 * 2D Canvas renderer module
 * @namespace
 */
const Renderer2D = {
	/**
	 * Create a new 2D renderer
	 * Sets up a Matter.js renderer using the HTML Canvas 2D API
	 * 
	 * @param {Matter.Engine} engine - The Matter.js engine
	 * @param {HTMLCanvasElement} canvas - The canvas element
	 * @returns {Matter.Render} - The Matter.js renderer
	 */
	create: function (engine, canvas) {
		try {
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error("Could not get 2D context");

			const render = Matter.Render.create({
				engine: engine,
				canvas: canvas,
				context: ctx,
				options: {
					width: canvas.width,
					height: canvas.height,
					wireframes: false,
					background: Constants.COLORS.BACKGROUND
				}
			});

			return render;
		} catch (e) {
			console.error("Failed to create 2D renderer:", e);
			throw e;
		}
	},

	/**
	 * Start the renderer
	 * Begins the rendering loop for the 2D canvas
	 * 
	 * @param {Matter.Render} render - The Matter.js renderer
	 */
	start: function (render) {
		Matter.Render.run(render);
		console.log("Using Canvas 2D renderer");
	},

	/**
	 * Stop the renderer
	 * Halts the rendering loop and cleans up resources
	 * 
	 * @param {Matter.Render} render - The Matter.js renderer
	 */
	stop: function (render) {
		if (render) {
			Matter.Render.stop(render);
		}
	}
};
