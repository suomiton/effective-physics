/**
 * matter-three.ts
 *
 * Purpose: Provides integration between Matter.js physics and Three.js graphics.
 * This module acts as a simplified bridge between the physics engine and 3D
 * rendering, providing a basic class for visualizing Matter.js bodies with Three.js.
 */

import * as Matter from "matter-js";

// Import only the specific Three.js components we need
import {
	Scene,
	WebGLRenderer,
	OrthographicCamera,
	AmbientLight,
	DirectionalLight,
	PlaneGeometry,
	MeshBasicMaterial,
	MeshLambertMaterial,
	CircleGeometry,
	ShapeGeometry,
	Mesh,
	Shape,
	Color,
	PCFSoftShadowMap,
	Material,
} from "three";

import Constants from "./constants";
import type { MatterThreeInstance } from "./types";

/**
 * Creates a new MatterThree instance.
 * This class bridges Matter.js physics bodies with Three.js rendering
 *
 * @param {Object} options - Configuration options
 * @returns {MatterThreeInstance} - The MatterThree renderer instance
 */
export function MatterThree(options: {
	engine: Matter.Engine;
	element: HTMLElement;
	width?: number;
	height?: number;
	background?: string | number;
	wireframeBackground?: boolean;
	hasShadows?: boolean;
}): MatterThreeInstance {
	// Create instance with default values
	const instance: MatterThreeInstance = {
		engine: options.engine,
		element: options.element,
		canvas: null,
		width: options.width || Constants.CANVAS.WIDTH,
		height: options.height || Constants.CANVAS.HEIGHT,
		background: options.background || Constants.COLORS.BACKGROUND,
		wireframeBackground: options.wireframeBackground || false,
		hasShadows: options.hasShadows !== undefined ? options.hasShadows : true,
		scene: new Scene(),
		renderer: new WebGLRenderer(),
		camera: new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000),
		bodies: new Map<number, Mesh>(),
		frameRequestId: undefined,

		/**
		 * Create a Three.js mesh for a Matter.js body
		 * Generates 3D representation for physics bodies
		 *
		 * @param {Matter.Body} body - The physics body
		 * @returns {Mesh} - The 3D mesh
		 */
		createBodyMesh: function (body: Matter.Body): Mesh {
			// Default material
			const material = new MeshLambertMaterial({
				color:
					body.render && body.render.fillStyle
						? new Color(body.render.fillStyle)
						: new Color(Constants.COLORS.DEFAULT_OBJECT),
				wireframe: false,
			});

			let mesh: Mesh;

			// Create appropriate geometry based on body type
			if (body.circleRadius) {
				// Circle/sphere geometry
				const geometry = new CircleGeometry(body.circleRadius, 24);
				mesh = new Mesh(geometry, material);
			} else {
				// Polygon geometry from vertices
				const shape = new Shape();

				if (body.vertices && body.vertices.length > 0) {
					const firstVertex = Matter.Vector.sub(
						body.vertices[0],
						body.position
					);
					shape.moveTo(firstVertex.x, firstVertex.y);

					// Create shape from remaining vertices
					for (let i = 1; i < body.vertices.length; i++) {
						const vertex = Matter.Vector.sub(body.vertices[i], body.position);
						shape.lineTo(vertex.x, vertex.y);
					}

					shape.closePath();
				} else {
					// Fallback for bodies without proper vertices
					shape.moveTo(-10, -10);
					shape.lineTo(10, -10);
					shape.lineTo(10, 10);
					shape.lineTo(-10, 10);
					shape.closePath();
				}

				// Create flat geometry from shape
				const geometry = new ShapeGeometry(shape);
				mesh = new Mesh(geometry, material);
			}

			// Configure shadows
			if (this.hasShadows) {
				mesh.castShadow = true;
				mesh.receiveShadow = true;
			}

			return mesh;
		},

		/**
		 * Update the scene based on physics engine state
		 * Synchronizes Three.js objects with Matter.js bodies
		 */
		updateScene: function (): void {
			const bodies = Matter.Composite.allBodies(this.engine.world);
			const currentBodyIds = new Set<number>();

			// Update or create meshes for each body
			bodies.forEach((body) => {
				currentBodyIds.add(body.id);

				// Get or create mesh
				let mesh = this.bodies.get(body.id);
				if (!mesh) {
					mesh = this.createBodyMesh(body);
					this.scene.add(mesh);
					this.bodies.set(body.id, mesh);
				}

				// Update position and rotation
				mesh.position.set(body.position.x, body.position.y, 0);
				mesh.rotation.z = body.angle;
			});

			// Remove meshes for bodies that no longer exist
			this.bodies.forEach((mesh, id) => {
				if (!currentBodyIds.has(id)) {
					this.scene.remove(mesh);
					if (mesh.geometry) mesh.geometry.dispose();
					if (mesh.material instanceof Material) {
						mesh.material.dispose();
					} else if (Array.isArray(mesh.material)) {
						mesh.material.forEach((material) => material.dispose());
					}
					this.bodies.delete(id);
				}
			});
		},

		/**
		 * Start the rendering loop
		 * Begins continuous rendering of the Three.js scene
		 */
		run: function (): void {
			const update = (): void => {
				this.frameRequestId = requestAnimationFrame(update);
				this.updateScene();
				this.renderer.render(this.scene, this.camera);
			};

			update();
		},

		/**
		 * Stop the rendering loop
		 * Halts rendering and cleans up resources
		 */
		stop: function (): void {
			if (this.frameRequestId !== undefined) {
				cancelAnimationFrame(this.frameRequestId);
				this.frameRequestId = undefined;
			}
		},
	};

	// Initialize the renderer
	(function initialize(): void {
		// Create or use existing canvas
		if (!instance.element.querySelector("canvas")) {
			instance.canvas = document.createElement("canvas");
			instance.element.appendChild(instance.canvas);
		} else {
			instance.canvas = instance.element.querySelector("canvas");
		}

		if (!instance.canvas) {
			throw new Error("Failed to create or find canvas element");
		}

		// Set canvas dimensions
		instance.canvas.width = instance.width;
		instance.canvas.height = instance.height;

		// Initialize Three.js renderer
		instance.renderer = new WebGLRenderer({
			canvas: instance.canvas,
			antialias: true,
			alpha: true,
		});

		instance.renderer.setSize(instance.width, instance.height);
		instance.renderer.setClearColor(new Color(instance.background), 1);

		// Set up shadows
		if (instance.hasShadows) {
			instance.renderer.shadowMap.enabled = true;
			instance.renderer.shadowMap.type = PCFSoftShadowMap;
		}

		// Initialize camera
		const halfWidth = instance.width / 2;
		const halfHeight = instance.height / 2;

		instance.camera = new OrthographicCamera(
			-halfWidth,
			halfWidth,
			halfHeight,
			-halfHeight,
			1,
			1000
		);

		instance.camera.position.z = 500;

		// Initialize scene lighting
		const ambientLight = new AmbientLight(0xffffff, 0.5);
		instance.scene.add(ambientLight);

		const directionalLight = new DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(instance.width / 2, instance.height / 2, 100);

		if (instance.hasShadows) {
			directionalLight.castShadow = true;
			directionalLight.shadow.camera.left = -halfWidth;
			directionalLight.shadow.camera.right = halfWidth;
			directionalLight.shadow.camera.top = halfHeight;
			directionalLight.shadow.camera.bottom = -halfHeight;
			directionalLight.shadow.camera.near = 50;
			directionalLight.shadow.camera.far = 200;
			directionalLight.shadow.mapSize.width = 1024;
			directionalLight.shadow.mapSize.height = 1024;
		}

		instance.scene.add(directionalLight);

		// Add wireframe ground plane if enabled
		if (instance.wireframeBackground) {
			const planeGeometry = new PlaneGeometry(
				instance.width,
				instance.height,
				12,
				12
			);

			const planeMaterial = new MeshBasicMaterial({
				color: 0xcccccc,
				wireframe: true,
			});

			const plane = new Mesh(planeGeometry, planeMaterial);
			plane.position.z = -5;
			instance.scene.add(plane);
		}
	})();

	return instance;
}
