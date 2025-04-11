/**
 * 2D Canvas renderer module
 */
const Renderer2D = {
	/**
	 * Create a new 2D renderer
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
					background: '#ffffff'
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
	 */
	start: function (render) {
		Matter.Render.run(render);
		console.log("Using Canvas 2D renderer");
	},

	/**
	 * Stop the renderer
	 */
	stop: function (render) {
		if (render) {
			Matter.Render.stop(render);
		}
	}
};
