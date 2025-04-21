/**
 * app.ts
 *
 * Purpose: Main entry point for the physics simulation application.
 * This module initializes the physics engine, renderers, and interactive elements.
 * It orchestrates the overall behavior of the application and serves as the central
 * coordinator between physics, rendering, and user interaction components.
 */

import Matter from "matter-js";
import Constants from "./constants";
import { CanvasManager } from "./canvas-manager";
import { PhysicsUtils } from "./shared";
import { Renderer2D } from "./renderer-2d";
import { InteractiveWorld } from "./interactive-world";
import { InteractiveBlock } from "./interactive-block";
import type { RendererWebGLInstance, InteractiveObjectConfig } from "./types";

// Add Matter.js to window for legacy compatibility
(window as any).Matter = Matter;

// Declare global interactiveWorld for access from other modules or console
declare global {
	interface Window {
		interactiveWorld: InteractiveWorld;
	}
}

/**
 * Initialize the application
 * Entry point that starts the physics simulation and rendering
 */
function initApp(): void {
	// Create and configure physics engine
	const engine = Matter.Engine.create({
		gravity: { x: 0, y: Constants.PHYSICS.GRAVITY },
		enableSleeping: Constants.PHYSICS.SLEEP_ENABLED,
	});

	// Get the simulation canvas
	const originalCanvas = document.getElementById(
		"simulationCanvas"
	) as HTMLCanvasElement;
	if (!originalCanvas) {
		console.error(
			'Canvas element not found. Make sure there is a canvas with id "simulationCanvas".'
		);
		return;
	}

	// Set canvas dimensions
	originalCanvas.width = Constants.CANVAS.WIDTH;
	originalCanvas.height = Constants.CANVAS.HEIGHT;

	// Initialize canvas container and management
	const { container, canvas } = CanvasManager.init(originalCanvas);

	// Create physical boundaries
	const boundaries = PhysicsUtils.createBoundaries(canvas, engine.world);

	// Create interactive world to manage objects
	const interactiveWorld = new InteractiveWorld(engine, canvas);

	// Make it globally available
	window.interactiveWorld = interactiveWorld;

	// Create interactive objects from configuration
	for (const config of Constants.INTERACTIVE_OBJECTS) {
		interactiveWorld.create(config);
	}

	// Add a demo button to create new blocks
	setupDemoButtons();

	// Check URL query parameters for renderer selection
	const urlParams = new URLSearchParams(window.location.search);
	const rendererParam = urlParams.get("renderer");
	let rendererFromURL: string | null = null;

	// Validate renderer from URL
	if (
		rendererParam === Constants.RENDERER.CANVAS_2D ||
		rendererParam === Constants.RENDERER.WEBGL
	) {
		rendererFromURL = rendererParam;
	}

	// Initialize renderer based on dropdown selection, URL parameter, or default
	const rendererSelect = document.getElementById(
		"rendererSelect"
	) as HTMLSelectElement;

	// Determine renderer priority: URL param > select element > default
	let currentRenderer =
		rendererFromURL ||
		(rendererSelect ? rendererSelect.value : Constants.RENDERER.WEBGL);

	if (!currentRenderer) {
		currentRenderer = Constants.RENDERER.WEBGL;
	}

	// Update the select element to match the chosen renderer
	if (rendererSelect && rendererFromURL) {
		rendererSelect.value = rendererFromURL;
	}

	// Store current renderer selection in global variable
	window.currentRenderer = currentRenderer;

	// Initialize the selected renderer
	initializeRenderer(currentRenderer, engine, canvas, container);

	// Add event listener for renderer selection changes
	if (rendererSelect) {
		rendererSelect.addEventListener("change", (e) => {
			const target = e.target as HTMLSelectElement;
			const newRenderer = target.value;

			// Update URL with the new renderer parameter and reload the page
			const url = new URL(window.location.href);
			url.searchParams.set("renderer", newRenderer);
			window.location.href = url.href; // This causes a page refresh
		});
	}

	// Add sand button
	const sandButton = document.getElementById("dropSandButton");
	if (sandButton) {
		sandButton.addEventListener("click", () => {
			PhysicsUtils.dropSand(canvas, engine.world);
		});
	}

	// Start the physics engine
	const runner = Matter.Runner.create();
	Matter.Runner.run(runner, engine);
}

/**
 * Set up demo buttons for creating interactive blocks
 */
function setupDemoButtons(): void {
	// Create add block button
	const addBlockButton = document.createElement("button");
	addBlockButton.textContent = "Add Random Block";
	addBlockButton.addEventListener("click", () => {
		// Get random position within canvas
		const width = Constants.CANVAS.WIDTH;
		const height = Constants.CANVAS.HEIGHT;
		const x = Math.random() * (width - 100) + 50;
		const y = Math.random() * (height - 200) + 50;

		// Random properties
		const isCircle = Math.random() > 0.5;
		const size = Math.random() * 40 + 20;
		const color = `hsl(${Math.random() * 360}, 80%, 60%)`;

		// Create the object config
		const config: Partial<InteractiveObjectConfig> = {
			type: isCircle ? "circle" : "rectangle",
			x,
			y,
			color,
			mass: Math.random() * 10 + 1,
			restitution: Math.random() * 0.5,
		};

		// Add type-specific properties
		if (isCircle) {
			config.radius = size;
		} else {
			config.width = size * 1.5;
			config.height = size;
		}

		// Create the object
		const block = window.interactiveWorld.create(config);
		console.log("Created new block:", block);
	});

	// Add to controls
	const controls = document.querySelector(".controls");
	if (controls) {
		controls.appendChild(addBlockButton);
	}
}

/**
 * Initialize the selected renderer
 * Sets up either 2D canvas or WebGL renderer based on selection
 *
 * @param {string} rendererType - The renderer type ('2d' or 'webgl')
 * @param {Matter.Engine} engine - The Matter.js physics engine
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {HTMLDivElement} container - The canvas container
 */
async function initializeRenderer(
	rendererType: string,
	engine: Matter.Engine,
	canvas: HTMLCanvasElement,
	container: HTMLDivElement
): Promise<void> {
	if (rendererType === Constants.RENDERER.CANVAS_2D) {
		// Initialize 2D Canvas renderer
		try {
			window.render2D = Renderer2D.create(engine, canvas);
			Renderer2D.start(window.render2D);
			window.renderWebGL = null;
		} catch (error) {
			console.error("Failed to initialize 2D renderer:", error);
			// Fallback to WebGL if 2D fails
			window.currentRenderer = Constants.RENDERER.WEBGL;
			initializeRenderer(Constants.RENDERER.WEBGL, engine, canvas, container);
		}
	} else if (rendererType === Constants.RENDERER.WEBGL) {
		// Initialize WebGL renderer - lazy load Three.js and the renderer
		try {
			// Dynamic import of the renderer
			const { createWebGLRenderer } = await import("./renderer-webgl");

			window.renderWebGL = createWebGLRenderer(engine, canvas).init();
			window.renderWebGL.run();
			window.render2D = null;
		} catch (error) {
			console.error("Failed to initialize WebGL renderer:", error);
			// Fallback to 2D if WebGL fails
			window.currentRenderer = Constants.RENDERER.CANVAS_2D;
			initializeRenderer(
				Constants.RENDERER.CANVAS_2D,
				engine,
				canvas,
				container
			);
		}
	} else {
		console.error("Unknown renderer type:", rendererType);
	}
}

// Initialize application when DOM content is loaded
document.addEventListener("DOMContentLoaded", initApp);
