/**
 * app.js
 * 
 * Purpose: Main application entry point that initializes the physics simulation.
 * This file sets up the Matter.js physics engine, creates the simulation objects,
 * handles renderer initialization and switching, and manages user interactions.
 * It serves as the controller that coordinates between physics, rendering, and UI.
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
const engine = Matter.Engine.create({
	enableSleeping: Constants.PHYSICS.SLEEP_ENABLED
});
const world = engine.world;
world.gravity.y = Constants.PHYSICS.GRAVITY;

// Create the engine runner
const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);

// Create game objects
const boundaries = PhysicsUtils.createBoundaries(canvas, world);
const block = PhysicsUtils.createBlock(world, 300, 400, 50, 50);

// Set up mouse interactions for dragging
CanvasManager.setupMouseEvents(canvas, block, engine);

/**
 * Read renderer preference from URL query parameter
 * @returns {string} - The renderer type to use (webgl or 2d)
 */
function getPreferredRenderer() {
	const urlParams = new URLSearchParams(window.location.search);
	const renderer = urlParams.get('renderer');

	// Return the renderer from query param if valid, otherwise default to 'webgl'
	return (renderer === Constants.RENDERER.CANVAS_2D ||
		renderer === Constants.RENDERER.WEBGL) ?
		renderer : Constants.RENDERER.WEBGL;
}

// Initialize the renderer based on URL query parameter
initializeRenderer(getPreferredRenderer());

// Set up renderer switching UI
setupUI();

/**
 * Set up UI event listeners for renderer switching and sand generation
 * Connects UI controls to the simulation functionality
 */
function setupUI() {
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
}

/**
 * Switch between renderers
 * Handles stopping the current renderer, replacing the canvas, and initializing the new renderer
 * 
 * @param {string} rendererType - The type of renderer to switch to (webgl or 2d)
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
 * Creates and starts either the WebGL or 2D renderer with fallback handling
 * 
 * @param {string} rendererType - The type of renderer to initialize (webgl or 2d)
 */
function initializeRenderer(rendererType) {
	try {
		if (rendererType === Constants.RENDERER.WEBGL) {
			window.renderWebGL = RendererWebGL.create(engine, canvas);
			RendererWebGL.start(window.renderWebGL);
			window.currentRenderer = Constants.RENDERER.WEBGL;
		} else {
			window.render2D = Renderer2D.create(engine, canvas);
			Renderer2D.start(window.render2D);
			window.currentRenderer = Constants.RENDERER.CANVAS_2D;
		}
	} catch (e) {
		console.error(`Failed to initialize ${rendererType} renderer:`, e);

		// If WebGL fails, try 2D as fallback
		if (rendererType === Constants.RENDERER.WEBGL && !window.render2D) {
			alert("WebGL renderer failed. Falling back to 2D renderer.");
			try {
				window.render2D = Renderer2D.create(engine, canvas);
				Renderer2D.start(window.render2D);
				window.currentRenderer = Constants.RENDERER.CANVAS_2D;
			} catch (fallbackError) {
				console.error("Even 2D fallback failed:", fallbackError);
				alert("All renderers failed. Please check your browser compatibility.");
			}
		}
	}
}

/**
 * Stop the current renderer
 * Cleans up the active renderer to prevent memory leaks and performance issues
 */
function stopCurrentRenderer() {
	if (window.currentRenderer === Constants.RENDERER.WEBGL && window.renderWebGL) {
		RendererWebGL.stop(window.renderWebGL);
		window.renderWebGL = null;
	} else if (window.currentRenderer === Constants.RENDERER.CANVAS_2D && window.render2D) {
		Renderer2D.stop(window.render2D);
		window.render2D = null;
	}
	window.currentRenderer = null;
}