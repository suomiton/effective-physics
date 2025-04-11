/* 
   Matter.js-based simulation.

   Features:
   - Enclosing static walls (floor, ceiling, sides) so objects stay in view.
   - A dynamic block with custom hinge-like dragging:
	 * A constraint is added where you first click the block, allowing rotation.
	 * On mouseup, the constraint is removed, letting the block keep momentum.
   - Sand grains with lighter mass, slight bounce, friction, random colors.
   - All collisions, gravity, and constraints handled by Matter.js.
*/

// Get the original canvas
const originalCanvas = document.getElementById('simulationCanvas');

// Initialize canvas manager
const canvasSetup = CanvasManager.init(originalCanvas);
let canvas = canvasSetup.canvas;
const canvasContainer = canvasSetup.container;

// Make renderer references globally available for coordinate conversion
window.currentRenderer = null;
window.render2D = null;
window.renderWebGL = null;

// Matter.js engine setup
const engine = Matter.Engine.create({ enableSleeping: true });
const world = engine.world;
world.gravity.y = 1.0;

// Create the engine runner
const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);

// Create game objects
const boundaries = PhysicsUtils.createBoundaries(canvas, world);
const block = PhysicsUtils.createBlock(world, 300, 400, 50, 50);

// Set up mouse interactions for dragging
CanvasManager.setupMouseEvents(canvas, block, engine);

// Initialize the default renderer (2D)
initializeRenderer('2d');

// Set up renderer switching UI
const renderEngineSelect = document.getElementById('renderEngineSelect');
if (renderEngineSelect) {
	renderEngineSelect.addEventListener('change', () => {
		const chosen = renderEngineSelect.value;
		try {
			switchRenderer(chosen);
		} catch (e) {
			console.error("Failed to switch renderer:", e);
			alert("Failed to switch renderer. Please refresh the page.");
		}
	});
}

// Set up sand button
document.getElementById('dropSandButton').addEventListener('click', () => {
	PhysicsUtils.dropSand(canvas, world);
});

/**
 * Switch between renderers
 */
function switchRenderer(rendererType) {
	// Stop current renderer
	stopCurrentRenderer();

	// Replace canvas
	canvas = CanvasManager.replaceCanvas(canvasContainer);

	// Set up mouse events for the new canvas
	CanvasManager.setupMouseEvents(canvas, block, engine);

	// Initialize the new renderer
	initializeRenderer(rendererType);
}

/**
 * Initialize the specified renderer
 */
function initializeRenderer(rendererType) {
	try {
		if (rendererType === 'webgl') {
			window.renderWebGL = RendererWebGL.create(engine, canvas);
			RendererWebGL.start(window.renderWebGL);
			window.currentRenderer = 'webgl';
		} else {
			window.render2D = Renderer2D.create(engine, canvas);
			Renderer2D.start(window.render2D);
			window.currentRenderer = '2d';
		}
	} catch (e) {
		console.error(`Failed to initialize ${rendererType} renderer:`, e);

		// If WebGL fails, try 2D as fallback
		if (rendererType === 'webgl' && !render2D) {
			alert("WebGL renderer failed. Falling back to 2D renderer.");
			try {
				render2D = Renderer2D.create(engine, canvas);
				Renderer2D.start(render2D);
				window.currentRenderer = '2d';
			} catch (fallbackError) {
				console.error("Even 2D fallback failed:", fallbackError);
				alert("All renderers failed. Please check your browser compatibility.");
			}
		}
	}
}

/**
 * Stop the current renderer
 */
function stopCurrentRenderer() {
	if (window.currentRenderer === 'webgl' && window.renderWebGL) {
		RendererWebGL.stop(window.renderWebGL);
		window.renderWebGL = null;
	} else if (window.currentRenderer === '2d' && window.render2D) {
		Renderer2D.stop(window.render2D);
		window.render2D = null;
	}
	window.currentRenderer = null;
}