/**
 * renderer-webgl.ts
 *
 * Purpose: Provides WebGL-based 3D rendering for the physics simulation.
 * This module creates a Three.js renderer to visualize Matter.js physics bodies
 * in 3D. It handles the creation of 3D meshes for physics objects, manages the
 * scene, camera, and rendering loop, and provides coordinate conversion between
 * 2D physics and 3D visualization.
 */

import * as Matter from "matter-js";

// Import only the specific Three.js components we need
import {
	Scene,
	WebGLRenderer,
	OrthographicCamera,
	PerspectiveCamera,
	AmbientLight,
	DirectionalLight,
	GridHelper,
	Vector2,
	Color,
	Mesh,
	Shape,
	CircleGeometry,
	ExtrudeGeometry,
	MeshPhongMaterial,
	DoubleSide,
	PCFSoftShadowMap,
	Material,
} from "three";

import Constants from "./constants";
import type { RendererWebGLInstance, RendererWebGLConfig } from "./types";

// Add Three.js imports to a THREE namespace for backward compatibility
const THREE = {
	Scene,
	WebGLRenderer,
	OrthographicCamera,
	PerspectiveCamera,
	AmbientLight,
	DirectionalLight,
	GridHelper,
	Vector2,
	Color,
	Mesh,
	Shape,
	CircleGeometry,
	ExtrudeGeometry,
	MeshPhongMaterial,
	DoubleSide,
	PCFSoftShadowMap,
	Material,
};

// Add Three.js to window for legacy compatibility
(window as any).THREE = THREE;

/**
 * Create a WebGL renderer using Three.js
 * Factory function that returns a renderer instance for 3D visualization
 *
 * @param {Matter.Engine} engine - The Matter.js physics engine
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Object} options - Renderer configuration options
 * @returns {RendererWebGLInstance} - The WebGL renderer instance
 */
export function createWebGLRenderer(
	engine: Matter.Engine,
	canvas: HTMLCanvasElement,
	options: Partial<RendererWebGLConfig> = {}
): RendererWebGLInstance {
	// Default configuration with user overrides
	const config: RendererWebGLConfig = {
		background: options.background || Constants.COLORS.BACKGROUND,
		defaultObjectColor:
			options.defaultObjectColor || Constants.COLORS.DEFAULT_OBJECT,
		hasShadows: options.hasShadows !== undefined ? options.hasShadows : true,
		usesOrthographicCamera:
			options.usesOrthographicCamera !== undefined
				? options.usesOrthographicCamera
				: true,
	};

	/**
	 * WebGL renderer instance with Three.js
	 */
	const rendererInstance: RendererWebGLInstance = {
		engine,
		canvas,
		scene: new Scene(),
		camera: new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000),
		webglRenderer: new WebGLRenderer({ canvas, antialias: true }),
		bodies: new Map(),
		mousePosition: new Vector2(),
		config,
		frameRequestId: undefined,

		/**
		 * Initialize the WebGL renderer
		 * Sets up the Three.js scene, camera, and renderer
		 *
		 * @returns {RendererWebGLInstance} - The initialized renderer
		 */
		init: function (): RendererWebGLInstance {
			// Set up the renderer
			this.webglRenderer.setSize(canvas.width, canvas.height);
			this.webglRenderer.setClearColor(this.parseColor(this.config.background));
			this.webglRenderer.shadowMap.enabled = this.config.hasShadows;
			this.webglRenderer.shadowMap.type = PCFSoftShadowMap;

			// Set up scene components
			this._setupCamera();
			this._setupLights();
			this._setupGrid();

			return this;
		},

		/**
		 * Start the rendering loop
		 * Begins continuous rendering of the Three.js scene
		 */
		run: function (): void {
			// Define update function for animation loop
			const update = (): void => {
				this.frameRequestId = requestAnimationFrame(update);
				this.updateScene();
				this.webglRenderer.render(this.scene, this.camera);
			};

			// Start the loop
			update();
			console.log("Using WebGL renderer");
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
			this._disposeObjects();
		},

		/**
		 * Update the scene based on physics state
		 * Synchronizes Three.js objects with Matter.js bodies
		 */
		updateScene: function (): void {
			const bodies = Matter.Composite.allBodies(this.engine.world);

			// Track existing body IDs to remove stale objects
			const currentBodyIds = new Set<number>();

			// Update or create meshes for each physics body
			bodies.forEach((body) => {
				currentBodyIds.add(body.id);

				// Get or create mesh for body
				let mesh = this.bodies.get(body.id);
				if (!mesh) {
					mesh = this.createMeshForBody(body);
					if (mesh) {
						this.scene.add(mesh);
						this.bodies.set(body.id, mesh);
					}
				}

				// Update mesh position and rotation if it exists
				if (mesh) {
					mesh.position.set(body.position.x, body.position.y, 0);
					mesh.rotation.z = body.angle;
				}
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
		 * Set up the Three.js camera
		 * Configures orthographic or perspective camera based on settings
		 *
		 * @private
		 */
		_setupCamera: function (): void {
			const aspect = canvas.width / canvas.height;

			if (this.config.usesOrthographicCamera) {
				// Orthographic camera for 2D-like view
				const height = canvas.height;
				const width = canvas.width;
				this.camera = new OrthographicCamera(
					-width / 2,
					width / 2,
					height / 2,
					-height / 2,
					1,
					1000
				);
			} else {
				// Perspective camera for 3D view
				this.camera = new PerspectiveCamera(75, aspect, 0.1, 1000);
			}

			// Position camera to view the scene
			this.camera.position.z = 500;
			this.camera.position.y = 0;
		},

		/**
		 * Set up lights in the Three.js scene
		 * Creates ambient and directional lighting
		 *
		 * @private
		 */
		_setupLights: function (): void {
			// Ambient light for general illumination
			const ambientLight = new AmbientLight(0xffffff, 0.6);
			this.scene.add(ambientLight);

			// Directional light with shadows
			const directionalLight = new DirectionalLight(0xffffff, 0.8);
			directionalLight.position.set(0, 0, 200);
			directionalLight.castShadow = this.config.hasShadows;

			// Configure shadow properties
			if (this.config.hasShadows) {
				directionalLight.shadow.mapSize.width = 1024;
				directionalLight.shadow.mapSize.height = 1024;
				directionalLight.shadow.camera.near = 100;
				directionalLight.shadow.camera.far = 300;
				directionalLight.shadow.camera.left = -canvas.width / 2;
				directionalLight.shadow.camera.right = canvas.width / 2;
				directionalLight.shadow.camera.top = canvas.height / 2;
				directionalLight.shadow.camera.bottom = -canvas.height / 2;
			}

			this.scene.add(directionalLight);
		},

		/**
		 * Set up a grid for visual reference
		 * Creates a grid on the XY plane
		 *
		 * @private
		 */
		_setupGrid: function (): void {
			// Create grid to match canvas dimensions
			const gridHelper = new GridHelper(
				Math.max(canvas.width, canvas.height),
				10,
				0x888888,
				0xcccccc
			);

			// Rotate grid to XY plane and position at z=0
			gridHelper.rotation.x = Math.PI / 2;
			gridHelper.position.z = -10;

			this.scene.add(gridHelper);
		},

		/**
		 * Clean up Three.js objects
		 * Disposes geometries and materials to prevent memory leaks
		 *
		 * @private
		 */
		_disposeObjects: function (): void {
			// Dispose of all meshes
			this.bodies.forEach((mesh) => {
				this.scene.remove(mesh);
				if (mesh.geometry) mesh.geometry.dispose();
				if (mesh.material instanceof Material) {
					mesh.material.dispose();
				} else if (Array.isArray(mesh.material)) {
					mesh.material.forEach((material) => material.dispose());
				}
			});

			this.bodies.clear();

			// Clear the scene
			while (this.scene.children.length > 0) {
				const object = this.scene.children[0];
				this.scene.remove(object);
			}
		},

		/**
		 * Parse a color string into a Three.js color
		 * Handles different color format inputs
		 *
		 * @param {string} [colorString] - The color string to parse
		 * @returns {Color} - The resulting Three.js color object
		 */
		parseColor: function (colorString?: string): Color {
			if (!colorString) return new Color(this.config.defaultObjectColor);

			try {
				return new Color(colorString);
			} catch (e) {
				console.warn("Invalid color format, using default:", e);
				return new Color(this.config.defaultObjectColor);
			}
		},

		/**
		 * Create a Three.js mesh for a Matter.js body
		 * Generates appropriate geometry based on body type
		 *
		 * @param {Matter.Body} body - The physics body
		 * @returns {Mesh|undefined} - The created mesh or undefined if unsupported
		 */
		createMeshForBody: function (body: Matter.Body): Mesh | undefined {
			// Materials with shadows
			const material = new MeshPhongMaterial({
				color: this.parseColor(body.render?.fillStyle),
				side: DoubleSide,
			});

			// Different geometries for different body types
			let mesh: Mesh | undefined;

			if (body.circleRadius) {
				// Circle/sphere body
				const geometry = new CircleGeometry(body.circleRadius, 32);
				mesh = new Mesh(geometry, material);
			} else if (body.vertices && body.vertices.length > 2) {
				// Polygon body using shape extruded to give it depth
				const shape = new Shape();

				// Create shape from vertices
				body.vertices.forEach((vertex, i) => {
					const localVertex = Matter.Vector.sub(vertex, body.position);
					if (i === 0) {
						shape.moveTo(localVertex.x, localVertex.y);
					} else {
						shape.lineTo(localVertex.x, localVertex.y);
					}
				});
				shape.closePath();

				// Extrude to create 3D object with minimal depth
				const extrudeSettings = {
					depth: 2,
					bevelEnabled: false,
				};

				const geometry = new ExtrudeGeometry(shape, extrudeSettings);
				mesh = new Mesh(geometry, material);
				mesh.rotation.x = Math.PI / 2; // Rotate to face camera
				mesh.position.z = -1; // Offset to ensure visibility
			}

			// Configure shadows if enabled
			if (mesh && this.config.hasShadows) {
				mesh.castShadow = true;
				mesh.receiveShadow = true;
			}

			return mesh;
		},

		/**
		 * Get mouse coordinates in world space
		 * Converts screen coordinates to physics world coordinates
		 *
		 * @param {number} clientX - Mouse X position
		 * @param {number} clientY - Mouse Y position
		 * @returns {Object} - Coordinates in world space {x, y}
		 */
		getMouseCoordinates: function (
			clientX: number,
			clientY: number
		): { x: number; y: number } {
			const rect = canvas.getBoundingClientRect();
			const x = clientX - rect.left;
			const y = clientY - rect.top;

			// Keep coordinates within canvas bounds
			return {
				x: Math.max(0, Math.min(canvas.width, x)),
				y: Math.max(0, Math.min(canvas.height, y)),
			};
		},
	};

	return rendererInstance;
}
