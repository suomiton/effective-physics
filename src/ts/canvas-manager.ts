/**
 * canvas-manager.ts
 *
 * Purpose: Manages canvas creation, replacement, and interaction.
 * This module handles the DOM manipulation for canvas elements,
 * creates the canvas container, and sets up mouse events for
 * interactive dragging of physics objects. It serves as a bridge
 * between the DOM and the physics simulation.
 */

import Matter from "matter-js";
import Constants from "./constants";
import type { CanvasSetup, InteractiveObject, MousePosition } from "./types";

/**
 * Canvas management module for handling canvas creation/destruction and mouse interactions
 * @namespace
 */
export const CanvasManager = {
	/**
	 * Initialize the canvas container
	 * Creates a container div for the canvas and inserts it into the DOM
	 *
	 * @param {HTMLCanvasElement} originalCanvas - The original canvas element
	 * @returns {CanvasSetup} - References to the container and canvas
	 */
	init: function (originalCanvas: HTMLCanvasElement): CanvasSetup {
		// Create container for the canvas
		const canvasContainer = document.createElement("div");
		canvasContainer.id = "canvasContainer";
		canvasContainer.style.width = Constants.CANVAS.WIDTH + "px";
		canvasContainer.style.height = Constants.CANVAS.HEIGHT + "px";

		// Insert container before the original canvas
		if (originalCanvas.parentNode) {
			originalCanvas.parentNode.insertBefore(canvasContainer, originalCanvas);
		}

		// Move canvas into container
		canvasContainer.appendChild(originalCanvas);

		return {
			container: canvasContainer,
			canvas: originalCanvas,
		};
	},

	/**
	 * Replace the current canvas with a fresh one
	 * Removes the old canvas and creates a new one with the same dimensions
	 *
	 * @param {HTMLDivElement} container - The canvas container
	 * @returns {HTMLCanvasElement} - The newly created canvas
	 */
	replaceCanvas: function (container: HTMLDivElement): HTMLCanvasElement {
		// Remove old canvas if it exists
		const oldCanvas = document.getElementById("simulationCanvas");
		if (oldCanvas) {
			oldCanvas.remove();
		}

		// Create a fresh canvas
		const newCanvas = document.createElement("canvas");
		newCanvas.id = "simulationCanvas";
		newCanvas.width = Constants.CANVAS.WIDTH;
		newCanvas.height = Constants.CANVAS.HEIGHT;
		container.appendChild(newCanvas);

		return newCanvas;
	},

	/**
	 * Set up mouse events for interacting with draggable objects
	 * Creates constraint-based dragging for physics objects with renderer-specific
	 * coordinate handling
	 *
	 * @param {HTMLCanvasElement} canvas - The canvas element
	 * @param {Map<string, InteractiveObject>} interactiveObjects - Map of interactive objects
	 * @param {Matter.Engine} engine - The Matter.js engine instance
	 */
	setupMouseEvents: function (
		canvas: HTMLCanvasElement,
		interactiveObjects: Map<string, InteractiveObject>,
		engine: Matter.Engine
	): void {
		let dragConstraint: Matter.Constraint | null = null;
		let isDragging = false;

		/**
		 * Convert mouse position to physics world coordinates
		 * Handles different coordinate systems between renderers
		 *
		 * @param {MouseEvent} e - The mouse event
		 * @param {string} currentRenderer - The current renderer type
		 * @returns {MousePosition} - The mouse position in world coordinates
		 */
		const getMousePosition = (
			e: MouseEvent,
			currentRenderer: string | null
		): MousePosition => {
			// Use renderer-specific coordinate conversion if available
			if (
				currentRenderer === Constants.RENDERER.WEBGL &&
				window.renderWebGL &&
				window.renderWebGL.getMouseCoordinates
			) {
				return window.renderWebGL.getMouseCoordinates(e.clientX, e.clientY);
			}

			// Default canvas-based coordinates
			const rect = canvas.getBoundingClientRect();
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
		};

		// Get array of draggable bodies for collision detection
		const getDraggableBodies = (): Matter.Body[] => {
			const bodies: Matter.Body[] = [];
			interactiveObjects.forEach((obj) => {
				if (obj.config.isDraggable) {
					bodies.push(obj.body);
				}
			});
			return bodies;
		};

		canvas.addEventListener("mousedown", (e: MouseEvent) => {
			const worldPos = getMousePosition(e, window.currentRenderer);
			const draggableBodies = getDraggableBodies();

			// Check if mouse is over any draggable body
			const bodiesAtPoint = Matter.Query.point(draggableBodies, worldPos);

			if (bodiesAtPoint.length > 0) {
				// Get the topmost body (last in array)
				const bodyToDrag = bodiesAtPoint[bodiesAtPoint.length - 1];

				isDragging = true;
				dragConstraint = Matter.Constraint.create({
					bodyA: bodyToDrag,
					pointA: {
						x: worldPos.x - bodyToDrag.position.x,
						y: worldPos.y - bodyToDrag.position.y,
					},
					pointB: worldPos,
					stiffness: 0.02,
					render: { visible: false },
				});
				Matter.World.add(engine.world, dragConstraint);
			}
		});

		canvas.addEventListener("mousemove", (e: MouseEvent) => {
			if (!isDragging || !dragConstraint) return;

			const worldPos = getMousePosition(e, window.currentRenderer);
			dragConstraint.pointB = worldPos;
		});

		canvas.addEventListener("mouseup", () => {
			if (dragConstraint) {
				Matter.World.remove(engine.world, dragConstraint);
				dragConstraint = null;
				isDragging = false;
			}
		});
	},
};
