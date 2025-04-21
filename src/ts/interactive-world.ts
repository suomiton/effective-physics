/**
 * interactive-world.ts
 *
 * Purpose: Provides a manager class for handling collections of interactive objects.
 * This class manages creation, addition, and interaction with physics objects in the simulation.
 */

import Matter from "matter-js";
import { InteractiveBlock } from "./interactive-block";
import type { InteractiveObjectConfig, MousePosition } from "./types";
import Constants from "./constants";

/**
 * Class that manages a collection of interactive physics objects
 */
export class InteractiveWorld {
	/** The Matter.js physics world reference */
	private world: Matter.World;

	/** The Matter.js physics engine reference */
	private engine: Matter.Engine;

	/** Map of all interactive objects by ID */
	private objects: Map<string, InteractiveBlock> = new Map();

	/** The canvas element for rendering and mouse interactions */
	private canvas: HTMLCanvasElement;

	/** Constraint for dragging objects */
	private dragConstraint: Matter.Constraint | null = null;

	/** Flag indicating if an object is being dragged */
	private isDragging: boolean = false;

	/** Counter for generating unique IDs */
	private idCounter: number = 0;

	/**
	 * Create a new interactive world
	 *
	 * @param {Matter.Engine} engine - The Matter.js physics engine
	 * @param {HTMLCanvasElement} canvas - The canvas element for rendering
	 */
	constructor(engine: Matter.Engine, canvas: HTMLCanvasElement) {
		this.engine = engine;
		this.world = engine.world;
		this.canvas = canvas;

		// Initialize mouse event handlers
		this.setupMouseEvents();
	}

	/**
	 * Add an interactive object to the world
	 *
	 * @param {InteractiveBlock} object - The interactive object to add
	 * @returns {InteractiveBlock} - The added object (for chaining)
	 */
	add(object: InteractiveBlock): InteractiveBlock {
		// Check if object with this ID already exists
		if (this.objects.has(object.id)) {
			console.warn(`Object with id ${object.id} already exists, replacing it`);
			this.remove(object.id);
		}

		// Add to our collection and the physics world
		this.objects.set(object.id, object);
		object.addToWorld(this.world);

		return object;
	}

	/**
	 * Create and add a new interactive object from config
	 *
	 * @param {Partial<InteractiveObjectConfig>} config - Object configuration
	 * @returns {InteractiveBlock} - The created and added object
	 */
	create(config: Partial<InteractiveObjectConfig>): InteractiveBlock {
		// Generate an ID if not provided
		if (!config.id) {
			config.id = `interactive-${++this.idCounter}`;
		}

		// Set defaults for required properties
		const fullConfig: InteractiveObjectConfig = {
			id: config.id,
			type: config.type || "rectangle",
			x: config.x || this.canvas.width / 2,
			y: config.y || this.canvas.height / 2,
			width: config.width,
			height: config.height,
			radius: config.radius,
			color: config.color || "#4444ff",
			mass: config.mass !== undefined ? config.mass : 10,
			frictionAir: config.frictionAir !== undefined ? config.frictionAir : 0.01,
			restitution: config.restitution !== undefined ? config.restitution : 0.3,
			isStatic: config.isStatic !== undefined ? config.isStatic : false,
			isDraggable: config.isDraggable !== undefined ? config.isDraggable : true,
		};

		// Ensure type-specific properties are present
		if (
			fullConfig.type === "rectangle" &&
			(!fullConfig.width || !fullConfig.height)
		) {
			fullConfig.width = fullConfig.width || 50;
			fullConfig.height = fullConfig.height || 50;
		} else if (fullConfig.type === "circle" && !fullConfig.radius) {
			fullConfig.radius = 25;
		}

		// Create the object and add it to the world
		const object = new InteractiveBlock(fullConfig);
		return this.add(object);
	}

	/**
	 * Remove an object from the world by ID
	 *
	 * @param {string} id - The ID of the object to remove
	 * @returns {boolean} - True if object was found and removed
	 */
	remove(id: string): boolean {
		const object = this.objects.get(id);
		if (object) {
			object.removeFromWorld();
			this.objects.delete(id);
			return true;
		}
		return false;
	}

	/**
	 * Get an object by ID
	 *
	 * @param {string} id - The ID of the object to get
	 * @returns {InteractiveBlock|undefined} - The found object or undefined
	 */
	get(id: string): InteractiveBlock | undefined {
		return this.objects.get(id);
	}

	/**
	 * Get all objects in the world
	 *
	 * @returns {InteractiveBlock[]} - Array of all interactive objects
	 */
	getAll(): InteractiveBlock[] {
		return Array.from(this.objects.values());
	}

	/**
	 * Remove all objects from the world
	 */
	clear(): void {
		this.objects.forEach((object) => {
			object.removeFromWorld();
		});
		this.objects.clear();
	}

	/**
	 * Set up mouse events for interacting with draggable objects
	 *
	 * @private
	 */
	private setupMouseEvents(): void {
		/**
		 * Convert mouse position to physics world coordinates
		 * Handles different coordinate systems between renderers
		 */
		const getMousePosition = (e: MouseEvent): MousePosition => {
			// Use renderer-specific coordinate conversion if available
			if (
				window.currentRenderer === Constants.RENDERER.WEBGL &&
				window.renderWebGL &&
				window.renderWebGL.getMouseCoordinates
			) {
				return window.renderWebGL.getMouseCoordinates(e.clientX, e.clientY);
			}

			// Default canvas-based coordinates
			const rect = this.canvas.getBoundingClientRect();
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
		};

		// Get array of draggable bodies for collision detection
		const getDraggableBodies = (): Array<{ body: Matter.Body; id: string }> => {
			const bodies: Array<{ body: Matter.Body; id: string }> = [];
			this.objects.forEach((obj) => {
				if (obj.config.isDraggable) {
					bodies.push({ body: obj.body, id: obj.id });
				}
			});
			return bodies;
		};

		this.canvas.addEventListener("mousedown", (e: MouseEvent) => {
			const worldPos = getMousePosition(e);
			const draggableBodies = getDraggableBodies();

			// Check if mouse is over any draggable body
			const bodiesAtPoint = draggableBodies.filter(
				(item) => Matter.Query.point([item.body], worldPos).length > 0
			);

			if (bodiesAtPoint.length > 0) {
				// Get the topmost body (last in array)
				const topmostBody = bodiesAtPoint[bodiesAtPoint.length - 1];

				this.isDragging = true;
				this.dragConstraint = Matter.Constraint.create({
					bodyA: topmostBody.body,
					pointA: {
						x: worldPos.x - topmostBody.body.position.x,
						y: worldPos.y - topmostBody.body.position.y,
					},
					pointB: worldPos,
					stiffness: 0.2,
					render: { visible: false },
				});
				Matter.World.add(this.world, this.dragConstraint);
			}
		});

		this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
			if (!this.isDragging || !this.dragConstraint) return;

			const worldPos = getMousePosition(e);
			this.dragConstraint.pointB = worldPos;
		});

		this.canvas.addEventListener("mouseup", () => {
			if (this.dragConstraint) {
				Matter.World.remove(this.world, this.dragConstraint);
				this.dragConstraint = null;
				this.isDragging = false;
			}
		});
	}
}
