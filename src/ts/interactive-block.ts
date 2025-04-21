/**
 * interactive-block.ts
 *
 * Purpose: Defines the InteractiveBlock class that encapsulates physics body creation,
 * properties, and behavior for interactive objects in the simulation.
 * This class provides an object-oriented way to create and manage interactive elements.
 */

import Matter from "matter-js";
import type { InteractiveObjectConfig } from "./types";

/**
 * Class representing an interactive physics object that can be displayed and manipulated in the simulation
 */
export class InteractiveBlock {
	/** Unique identifier for the block */
	id: string;

	/** The Matter.js physics body associated with this block */
	body: Matter.Body;

	/** Configuration properties for this block */
	config: InteractiveObjectConfig;

	/** Whether the block is currently added to the world */
	isAddedToWorld: boolean = false;

	/** Reference to the world the block belongs to (when added) */
	private world: Matter.World | null = null;

	/**
	 * Create a new interactive block
	 *
	 * @param {InteractiveObjectConfig} config - Configuration for the interactive object
	 */
	constructor(config: InteractiveObjectConfig) {
		this.id = config.id;
		this.config = config;

		// Create the appropriate Matter.js body based on the object type
		this.body = this.createBody();
	}

	/**
	 * Create a Matter.js body based on the configuration
	 *
	 * @private
	 * @returns {Matter.Body} - The created physics body
	 */
	private createBody(): Matter.Body {
		// Common physics properties for the body
		const options = {
			mass: this.config.mass,
			frictionAir: this.config.frictionAir,
			restitution: this.config.restitution,
			isStatic: this.config.isStatic,
			render: { fillStyle: this.config.color },
			label: this.config.id,
		};

		let body: Matter.Body;

		// Create a body based on the type specified in the config
		if (this.config.type === "rectangle") {
			if (!this.config.width || !this.config.height) {
				throw new Error("Width and height required for rectangle objects");
			}
			body = Matter.Bodies.rectangle(
				this.config.x,
				this.config.y,
				this.config.width,
				this.config.height,
				options
			);
		} else if (this.config.type === "circle") {
			if (!this.config.radius) {
				throw new Error("Radius required for circle objects");
			}
			body = Matter.Bodies.circle(
				this.config.x,
				this.config.y,
				this.config.radius,
				options
			);
		} else {
			throw new Error(`Unknown object type: ${this.config.type}`);
		}

		return body;
	}

	/**
	 * Add this block to a physics world
	 *
	 * @param {Matter.World} world - The Matter.js world to add to
	 * @returns {InteractiveBlock} - This block instance (for chaining)
	 */
	addToWorld(world: Matter.World): InteractiveBlock {
		if (!this.isAddedToWorld) {
			Matter.World.add(world, this.body);
			this.isAddedToWorld = true;
			this.world = world;
		}
		return this;
	}

	/**
	 * Remove this block from its current physics world
	 *
	 * @returns {InteractiveBlock} - This block instance (for chaining)
	 */
	removeFromWorld(): InteractiveBlock {
		if (this.isAddedToWorld && this.world) {
			Matter.World.remove(this.world, this.body);
			this.isAddedToWorld = false;
			this.world = null;
		}
		return this;
	}

	/**
	 * Set position of the block
	 *
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 * @returns {InteractiveBlock} - This block instance (for chaining)
	 */
	setPosition(x: number, y: number): InteractiveBlock {
		Matter.Body.setPosition(this.body, { x, y });
		return this;
	}

	/**
	 * Apply force to the block
	 *
	 * @param {number} x - X component of force
	 * @param {number} y - Y component of force
	 * @returns {InteractiveBlock} - This block instance (for chaining)
	 */
	applyForce(x: number, y: number): InteractiveBlock {
		Matter.Body.applyForce(this.body, this.body.position, { x, y });
		return this;
	}

	/**
	 * Update the block's properties
	 *
	 * @param {Partial<InteractiveObjectConfig>} updates - Properties to update
	 * @returns {InteractiveBlock} - This block instance (for chaining)
	 */
	updateProperties(
		updates: Partial<InteractiveObjectConfig>
	): InteractiveBlock {
		const needsRebuild =
			updates.type !== undefined ||
			updates.width !== undefined ||
			updates.height !== undefined ||
			updates.radius !== undefined;

		// Update config
		this.config = { ...this.config, ...updates };

		// If we need to rebuild the body (type or size changed)
		if (needsRebuild) {
			const wasInWorld = this.isAddedToWorld;
			const world = this.world;

			// Remove from world if needed
			if (wasInWorld && world) {
				this.removeFromWorld();
			}

			// Create new body
			this.body = this.createBody();

			// Add back to world if it was there before
			if (wasInWorld && world) {
				this.addToWorld(world);
			}
		} else {
			// Just update properties without rebuilding
			Object.assign(this.body.render, { fillStyle: this.config.color });
			this.body.isStatic = this.config.isStatic;
			this.body.restitution = this.config.restitution;
			this.body.frictionAir = this.config.frictionAir;
		}

		return this;
	}
}
