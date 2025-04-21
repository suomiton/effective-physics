/**
 * shared.ts
 *
 * Purpose: Provides shared physics utility functions across the application.
 * This module contains reusable physics-related functionality including
 * boundary creation, block creation, sand particle generation, and
 * other common physics operations used throughout the simulation.
 */

import Matter from "matter-js";
import Constants from "./constants";
import type {
	Boundaries,
	InteractiveObject,
	InteractiveObjectConfig,
} from "./types";

/**
 * Shared utility functions for physics objects
 * @namespace
 */
export const PhysicsUtils = {
	/**
	 * Create boundary walls around the canvas
	 * Creates static bodies for floor, ceiling, and side walls to contain physics objects
	 *
	 * @param {HTMLCanvasElement} canvas - The canvas element
	 * @param {Matter.World} world - The Matter.js world
	 * @returns {Boundaries} - References to the boundary bodies
	 */
	createBoundaries: function (
		canvas: HTMLCanvasElement,
		world: Matter.World
	): Boundaries {
		const wallThickness = 50;

		// Floor
		const floor = Matter.Bodies.rectangle(
			canvas.width / 2,
			canvas.height + wallThickness / 2,
			canvas.width,
			wallThickness,
			{ isStatic: true }
		);

		// Ceiling
		const ceiling = Matter.Bodies.rectangle(
			canvas.width / 2,
			-wallThickness / 2,
			canvas.width,
			wallThickness,
			{ isStatic: true }
		);

		// Left wall
		const leftWall = Matter.Bodies.rectangle(
			-wallThickness / 2,
			canvas.height / 2,
			wallThickness,
			canvas.height,
			{ isStatic: true }
		);

		// Right wall
		const rightWall = Matter.Bodies.rectangle(
			canvas.width + wallThickness / 2,
			canvas.height / 2,
			wallThickness,
			canvas.height,
			{ isStatic: true }
		);

		Matter.World.add(world, [floor, ceiling, leftWall, rightWall]);
		return { floor, ceiling, leftWall, rightWall };
	},

	/**
	 * Create a physics block
	 * Creates a rectangular body with specified dimensions and physics properties
	 *
	 * @param {Matter.World} world - The Matter.js world
	 * @param {number} x - X position
	 * @param {number} y - Y position
	 * @param {number} width - Block width
	 * @param {number} height - Block height
	 * @returns {Matter.Body} - The created block body
	 */
	createBlock: function (
		world: Matter.World,
		x: number,
		y: number,
		width: number = Constants.BLOCK.SIZE,
		height: number = Constants.BLOCK.SIZE
	): Matter.Body {
		const block = Matter.Bodies.rectangle(x, y, width, height, {
			mass: 10,
			frictionAir: 0.0,
			restitution: 0,
			render: { fillStyle: Constants.BLOCK.COLOR },
		});

		Matter.World.add(world, block);
		return block;
	},

	/**
	 * Create an interactive object based on a configuration
	 * Creates a physics body based on the type and properties specified in the config
	 *
	 * @param {Matter.World} world - The Matter.js world
	 * @param {InteractiveObjectConfig} config - The object configuration
	 * @returns {InteractiveObject} - The created interactive object with its body
	 */
	createInteractiveObject: function (
		world: Matter.World,
		config: InteractiveObjectConfig
	): InteractiveObject {
		let body: Matter.Body;

		// Common physics properties for the body
		const options = {
			mass: config.mass,
			frictionAir: config.frictionAir,
			restitution: config.restitution,
			isStatic: config.isStatic,
			render: { fillStyle: config.color },
			label: config.id,
		};

		// Create a body based on the type specified in the config
		if (config.type === "rectangle") {
			if (!config.width || !config.height) {
				throw new Error("Width and height required for rectangle objects");
			}
			body = Matter.Bodies.rectangle(
				config.x,
				config.y,
				config.width,
				config.height,
				options
			);
		} else if (config.type === "circle") {
			if (!config.radius) {
				throw new Error("Radius required for circle objects");
			}
			body = Matter.Bodies.circle(config.x, config.y, config.radius, options);
		} else {
			throw new Error(`Unknown object type: ${config.type}`);
		}

		// Add the body to the world
		Matter.World.add(world, body);

		// Return a complete interactive object
		return {
			id: config.id,
			config,
			body,
		};
	},

	/**
	 * Create all interactive objects defined in Constants
	 *
	 * @param {Matter.World} world - The Matter.js world
	 * @returns {Map<string, InteractiveObject>} - Map of created objects with their IDs as keys
	 */
	createAllInteractiveObjects: function (
		world: Matter.World
	): Map<string, InteractiveObject> {
		const objects = new Map<string, InteractiveObject>();

		Constants.INTERACTIVE_OBJECTS.forEach((config) => {
			const object = this.createInteractiveObject(world, config);
			objects.set(object.id, object);
		});

		return objects;
	},

	/**
	 * Create sand particles in a cluster
	 * Generates a cluster of small circular bodies with sand-like properties
	 *
	 * @param {HTMLCanvasElement} canvas - The canvas element
	 * @param {Matter.World} world - The Matter.js world
	 */
	dropSand: function (canvas: HTMLCanvasElement, world: Matter.World): void {
		const sandColors = Constants.SAND.COLORS;
		const clusterCenter = { x: canvas.width / 2, y: 100 };
		const clusterRadius = 80;
		const positions: Array<{ x: number; y: number }> = [];
		const maxAttempts = 300;
		const particleRadius = Constants.SAND.GRAIN_SIZE;
		const particleCount = 500;

		for (let i = 0; i < particleCount; i++) {
			let validPos = this._findValidSandPosition(
				positions,
				clusterCenter,
				clusterRadius,
				particleRadius,
				maxAttempts
			);

			if (!validPos) continue;

			const particle = Matter.Bodies.circle(
				validPos.x,
				validPos.y,
				particleRadius,
				{
					mass: 0.01,
					restitution: 0.0,
					friction: 0.1,
					frictionAir: 0.01,
					render: {
						fillStyle:
							sandColors[Math.floor(Math.random() * sandColors.length)],
					},
				}
			);

			Matter.World.add(world, particle);
		}
	},

	/**
	 * Helper function to find a valid position for a sand particle
	 * Ensures new particles don't overlap with existing ones using a collision detection algorithm
	 *
	 * @private
	 * @param {Array} positions - Array of existing particle positions
	 * @param {Object} center - Center point of the cluster {x, y}
	 * @param {number} radius - Radius of the particle cluster
	 * @param {number} particleRadius - Radius of each particle
	 * @param {number} maxAttempts - Maximum attempts to find a valid position
	 * @returns {Object|null} - Valid position {x, y} or null if none found
	 */
	_findValidSandPosition: function (
		positions: Array<{ x: number; y: number }>,
		center: { x: number; y: number },
		radius: number,
		particleRadius: number,
		maxAttempts: number
	): { x: number; y: number } | null {
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const angle = Math.random() * 2 * Math.PI;
			const r = Math.random() * radius;
			const xPos = center.x + r * Math.cos(angle);
			const yPos = center.y + r * Math.sin(angle);

			let tooClose = false;
			for (const p of positions) {
				const dx = xPos - p.x;
				const dy = yPos - p.y;
				if (Math.sqrt(dx * dx + dy * dy) < particleRadius * 2) {
					tooClose = true;
					break;
				}
			}

			if (!tooClose) {
				const validPos = { x: xPos, y: yPos };
				positions.push(validPos);
				return validPos;
			}
		}
		return null;
	},
};
