/**
 * renderer-webgl.ts
 *
 * Purpose: Provides WebGL-based 3D rendering for the physics simulation.
 * This module creates a Three.js renderer to visualize Matter.js physics bodies
 * in 3D. It handles the creation of 3D meshes for physics objects, manages the
 * scene, camera, and rendering loop, and provides coordinate conversion between
 * 2D physics and 3D visualization.
 */

import Matter from "matter-js";
import * as THREE from "three";
import Constants from "./constants";
import type { RendererWebGLInstance, RendererWebGLConfig } from "./types";

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
		scene: new THREE.Scene(),
		camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000),
		webglRenderer: new THREE.WebGLRenderer({ canvas, antialias: true }),
		bodies: new Map(),
		mousePosition: new THREE.Vector2(),
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
			this.webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

			// Set up scene components
			this._setupCamera();
			this._setupLights();
			this._setupGrid();

			console.log("WebGL renderer initialized");
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
				try {
					this.updateScene();
					this.webglRenderer.render(this.scene, this.camera);
				} catch (error) {
					console.error("Error in WebGL render loop:", error);
					this.stop(); // Stop the renderer if there's an error
				}
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
				console.log("WebGL renderer stopped");
			}
			this._disposeObjects();
		},

		/**
		 * Update the scene based on physics state
		 * Synchronizes Three.js objects with Matter.js bodies
		 */
		updateScene: function (): void {
			try {
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
						if (this.config.usesOrthographicCamera) {
							mesh.position.set(
								body.position.x - this.canvas.width / 2, // Adjust for camera centering
								this.canvas.height / 2 - body.position.y, // Adjust for camera centering and flip Y-axis
								0
							);
						} else {
							mesh.position.set(
								body.position.x,
								this.canvas.height - body.position.y,
								0
							);
						}
						mesh.rotation.z = -body.angle;
					}
				});

				// Remove meshes for bodies that no longer exist
				this.bodies.forEach((mesh, id) => {
					if (!currentBodyIds.has(id)) {
						this.scene.remove(mesh);
						if (mesh.geometry) mesh.geometry.dispose();
						if (mesh.material instanceof THREE.Material) {
							mesh.material.dispose();
						} else if (Array.isArray(mesh.material)) {
							mesh.material.forEach((material) => material.dispose());
						}
						this.bodies.delete(id);
					}
				});
			} catch (error) {
				console.error("Error updating WebGL scene:", error);
			}
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
				this.camera = new THREE.OrthographicCamera(
					-this.canvas.width / 2,
					this.canvas.width / 2, // left, right
					this.canvas.height / 2,
					-this.canvas.height / 2, // top, bottom
					0.1,
					1000 // near, far
				);
				// Center the camera on the canvas
				this.camera.position.set(0, 0, 100);
			} else {
				// Perspective camera for 3D view
				this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
				this.camera.position.z = this.canvas.height;
			}
			this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		},

		/**
		 * Set up lights in the Three.js scene
		 * Creates ambient and directional lighting
		 *
		 * @private
		 */
		_setupLights: function (): void {
			// Ambient light for general illumination
			const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
			this.scene.add(ambientLight);

			// Directional light with shadows
			if (this.config.hasShadows) {
				const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
				directionalLight.position.set(
					this.canvas.width / 2,
					-this.canvas.height / 2,
					this.canvas.height
				);
				directionalLight.castShadow = true;
				this.scene.add(directionalLight);
			}
		},

		/**
		 * Set up a grid for visual reference
		 * Creates a grid on the XY plane
		 *
		 * @private
		 */
		_setupGrid: function (): void {
			try {
				// Create a simple ground plane for reference
				const groundGeometry = new THREE.PlaneGeometry(
					this.canvas.width,
					this.canvas.height
				);
				const groundMaterial = new THREE.MeshBasicMaterial({
					color: 0xf8f8f8,
					side: THREE.DoubleSide,
					transparent: true,
					opacity: 0.5,
				});
				const ground = new THREE.Mesh(groundGeometry, groundMaterial);
				ground.position.set(0, 0, -5);
				this.scene.add(ground);

				// Create grid to match canvas dimensions
				const gridSize = Math.max(this.canvas.width, this.canvas.height);
				const gridHelper = new THREE.GridHelper(
					gridSize,
					10,
					0x888888,
					0xdddddd
				);
				gridHelper.rotation.x = Math.PI / 2;
				gridHelper.position.set(0, 0, -1);
				this.scene.add(gridHelper);
			} catch (error) {
				console.error("Error setting up grid:", error);
			}
		},

		/**
		 * Clean up Three.js objects
		 * Disposes geometries and materials to prevent memory leaks
		 *
		 * @private
		 */
		_disposeObjects: function (): void {
			try {
				// Dispose of all meshes
				this.bodies.forEach((mesh) => {
					this.scene.remove(mesh);
					if (mesh.geometry) mesh.geometry.dispose();
					if (mesh.material instanceof THREE.Material) {
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
			} catch (error) {
				console.error("Error disposing WebGL objects:", error);
			}
		},

		/**
		 * Parse a color string into a Three.js color
		 * Handles different color format inputs
		 *
		 * @param {string} [colorString] - The color string to parse
		 * @returns {THREE.Color} - The resulting Three.js color object
		 */
		parseColor: function (colorString?: string): THREE.Color {
			if (!colorString) return new THREE.Color(this.config.defaultObjectColor);

			try {
				return new THREE.Color(colorString);
			} catch (e) {
				console.warn("Invalid color format, using default:", e);
				return new THREE.Color(this.config.defaultObjectColor);
			}
		},

		/**
		 * Create a Three.js mesh for a Matter.js body
		 * Generates appropriate geometry based on body type
		 *
		 * @param {Matter.Body} body - The physics body
		 * @returns {THREE.Mesh|undefined} - The created mesh or undefined if unsupported
		 */
		createMeshForBody: function (body: Matter.Body): THREE.Mesh | undefined {
			try {
				let geometry, material, mesh;

				// Different shape handling
				if (body.label === "Circle Body" || body.circleRadius) {
					const radius = body.circleRadius || 10;
					geometry = new THREE.CircleGeometry(radius, 32);
					material = new THREE.MeshBasicMaterial({
						color: this.parseColor(body.render?.fillStyle),
						side: THREE.DoubleSide,
					});
					mesh = new THREE.Mesh(geometry, material);
				} else {
					// For rectangles and other polygons
					if (body.vertices && body.vertices.length > 0) {
						const shape = new THREE.Shape();

						shape.moveTo(
							body.vertices[0].x - body.position.x,
							body.vertices[0].y - body.position.y
						);

						for (let i = 1; i < body.vertices.length; i++) {
							shape.lineTo(
								body.vertices[i].x - body.position.x,
								body.vertices[i].y - body.position.y
							);
						}
						shape.closePath();

						geometry = new THREE.ShapeGeometry(shape);
						material = new THREE.MeshBasicMaterial({
							color: this.parseColor(body.render?.fillStyle),
							side: THREE.DoubleSide,
						});
						mesh = new THREE.Mesh(geometry, material);
					}
				}

				return mesh;
			} catch (error) {
				console.error("Error creating mesh for body:", error);
				return undefined;
			}
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

			return { x, y };
		},
	};

	return rendererInstance;
}
