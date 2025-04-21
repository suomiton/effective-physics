/**
 * renderer-webgl.js
 * 
 * Purpose: Provides WebGL-based 3D rendering for the physics simulation using Three.js.
 * This module handles the creation and management of a WebGL renderer that visualizes
 * Matter.js physics objects in 3D using Three.js. It supports both orthographic and
 * perspective cameras, shadow casting, and provides methods for object creation and scene management.
 */

// Default renderer config
const WEBGL_DEFAULTS = {
	background: Constants.COLORS.BACKGROUND,
	defaultObjectColor: Constants.COLORS.DEFAULT_OBJECT,
	hasShadows: true,
	usesOrthographicCamera: true
};

/**
 * WebGL renderer module using Three.js
 * @namespace
 */
const RendererWebGL = {
	/**
	 * Create a new WebGL renderer
	 * Sets up a THREE.js scene to visualize Matter.js physics bodies
	 * 
	 * @param {Matter.Engine} engine - The Matter.js engine
	 * @param {HTMLCanvasElement} canvas - The canvas element
	 * @param {Object} options - Optional renderer configuration
	 * @returns {Object} - The WebGL renderer instance
	 */
	create: function (engine, canvas, options = {}) {
		try {
			// Check if THREE is available
			if (typeof THREE === 'undefined') {
				throw new Error("THREE.js is not loaded");
			}

			// Create a custom Matter-THREE renderer
			const webGLRenderer = {
				engine: engine,
				canvas: canvas,
				scene: new THREE.Scene(),
				bodies: new Map(),
				mousePosition: new THREE.Vector2(),
				config: Object.assign({}, WEBGL_DEFAULTS, options),

				/**
				 * Initialize the WebGL renderer
				 * Sets up the renderer, camera, lights, and grid
				 * 
				 * @returns {Object} - The initialized renderer for chaining
				 */
				init: function () {
					// Set up WebGL renderer
					this.webglRenderer = new THREE.WebGLRenderer({
						canvas: this.canvas,
						antialias: true,
						alpha: true
					});
					this.webglRenderer.setClearColor(this.config.background, 1);
					this.webglRenderer.setSize(this.canvas.width, this.canvas.height);
					this.webglRenderer.shadowMap.enabled = this.config.hasShadows;

					// Create camera (orthographic or perspective based on config)
					this._setupCamera();

					// Add lights
					this._setupLights();

					// Add optional grid for reference
					this._setupGrid();

					return this;
				},

				/**
				 * Set up the appropriate camera based on configuration
				 * Creates either an orthographic or perspective camera
				 * @private
				 */
				_setupCamera: function () {
					if (this.config.usesOrthographicCamera) {
						// Orthographic camera to match 2D coordinates exactly
						this.camera = new THREE.OrthographicCamera(
							-this.canvas.width / 2, this.canvas.width / 2, // left, right
							this.canvas.height / 2, -this.canvas.height / 2, // top, bottom
							0.1, 1000 // near, far
						);
						// Center the camera on the canvas
						this.camera.position.set(0, 0, 100);
					} else {
						// Perspective camera
						this.camera = new THREE.PerspectiveCamera(
							75,
							this.canvas.width / this.canvas.height,
							0.1,
							1000
						);
						this.camera.position.z = this.canvas.height;
					}
					this.camera.lookAt(new THREE.Vector3(0, 0, 0));
				},

				/**
				 * Set up scene lighting
				 * Creates ambient and directional lights with optional shadows
				 * @private
				 */
				_setupLights: function () {
					// Add ambient light
					const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
					this.scene.add(ambientLight);

					// Add directional light with shadows
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
				 * Set up grid and ground plane for visual reference
				 * Creates a reference grid and plane to help with spatial orientation
				 * @private
				 */
				_setupGrid: function () {
					// Create a simple ground plane for reference
					const groundGeometry = new THREE.PlaneGeometry(this.canvas.width, this.canvas.height);
					const groundMaterial = new THREE.MeshBasicMaterial({
						color: 0xf8f8f8,
						side: THREE.DoubleSide,
						transparent: true,
						opacity: 0.5
					});
					const ground = new THREE.Mesh(groundGeometry, groundMaterial);
					ground.position.set(0, 0, -5);
					this.scene.add(ground);

					// Optional grid helper
					try {
						const gridSize = Math.max(this.canvas.width, this.canvas.height);
						const gridHelper = new THREE.GridHelper(gridSize, 10, 0x888888, 0xdddddd);
						gridHelper.rotation.x = Math.PI / 2;
						gridHelper.position.set(0, 0, -1);
						this.scene.add(gridHelper);
					} catch (e) {
						console.warn("Could not add grid helper:", e);
					}
				},

				/**
				 * Start the rendering loop
				 * Continuously updates the scene based on physics engine state
				 */
				run: function () {
					this.frameRequestId = requestAnimationFrame(this.run.bind(this));
					this.updateScene();
				},

				/**
				 * Stop the rendering loop
				 * Cancels the animation frame and cleans up resources
				 */
				stop: function () {
					if (this.frameRequestId) {
						cancelAnimationFrame(this.frameRequestId);
					}
					// Clean up THREE.js objects
					this._disposeObjects();
				},

				/**
				 * Clean up THREE.js objects to prevent memory leaks
				 * Disposes geometries and materials, and removes objects from the scene
				 * @private
				 */
				_disposeObjects: function () {
					this.bodies.forEach((mesh) => {
						if (mesh.geometry) mesh.geometry.dispose();
						if (mesh.material) mesh.material.dispose();
						this.scene.remove(mesh);
					});
					this.bodies.clear();
				},

				/**
				 * Convert a color string to THREE.js color
				 * Handles string color formats and provides fallback to default color
				 * 
				 * @param {string} colorString - The color string to parse
				 * @returns {THREE.Color} - The parsed THREE.js color
				 */
				parseColor: function (colorString) {
					try {
						return new THREE.Color(colorString || this.config.defaultObjectColor);
					} catch (e) {
						console.warn("Invalid color:", colorString, e);
						return new THREE.Color(this.config.defaultObjectColor);
					}
				},

				/**
				 * Create a THREE.js mesh for a Matter.js body
				 * Generates appropriate geometry and material based on body type
				 * 
				 * @param {Matter.Body} body - The physics body to create a mesh for
				 * @returns {THREE.Mesh|null} - The created mesh or null if creation failed
				 */
				createMeshForBody: function (body) {
					let geometry, material, mesh;

					try {
						// Different shape handling
						if (body.label === 'Circle Body' || body.circleRadius) {
							const radius = body.circleRadius || 10;
							geometry = new THREE.CircleGeometry(radius, 32);
							material = new THREE.MeshBasicMaterial({
								color: this.parseColor(body.render?.fillStyle),
								side: THREE.DoubleSide
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
									side: THREE.DoubleSide
								});
								mesh = new THREE.Mesh(geometry, material);
							}
						}

						return mesh;
					} catch (e) {
						console.error("Error creating mesh for body:", body.id, e);
						return null;
					}
				},

				/**
				 * Update the scene based on physics engine state
				 * Creates, updates, or removes THREE.js meshes based on Matter.js bodies
				 */
				updateScene: function () {
					try {
						const bodies = Matter.Composite.allBodies(this.engine.world);

						// Add new bodies or update existing ones
						bodies.forEach(body => {
							if (!this.bodies.has(body.id)) {
								const mesh = this.createMeshForBody(body);
								if (mesh) {
									this.bodies.set(body.id, mesh);
									this.scene.add(mesh);
								}
							}

							// Update position and rotation
							const mesh = this.bodies.get(body.id);
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
							if (!bodies.some(b => b.id === id)) {
								this.scene.remove(mesh);
								if (mesh.geometry) mesh.geometry.dispose();
								if (mesh.material) mesh.material.dispose();
								this.bodies.delete(id);
							}
						});

						// Render the scene
						if (this.webglRenderer && this.camera) {
							this.webglRenderer.render(this.scene, this.camera);
						}
					} catch (e) {
						console.error("Error updating scene:", e);
					}
				},

				/**
				 * Convert mouse coordinates to Matter.js world coordinates
				 * Translates browser event coordinates to simulation coordinates
				 * 
				 * @param {number} clientX - The client X coordinate
				 * @param {number} clientY - The client Y coordinate
				 * @returns {Object} - The translated coordinates {x, y}
				 */
				getMouseCoordinates: function (clientX, clientY) {
					try {
						const rect = this.canvas.getBoundingClientRect();
						const x = clientX - rect.left;
						const y = clientY - rect.top;
						return { x, y };
					} catch (e) {
						console.error("Error getting mouse coordinates:", e);
						return { x: 0, y: 0 };
					}
				}
			};

			return webGLRenderer.init();
		} catch (e) {
			console.error("Failed to create WebGL renderer:", e);
			throw e;
		}
	},

	/**
	 * Start the renderer
	 * Begins the rendering loop for the WebGL renderer
	 * 
	 * @param {Object} renderer - The WebGL renderer instance
	 */
	start: function (renderer) {
		renderer.run();
		console.log("Using Three.js WebGL renderer (orthographic)");
	},

	/**
	 * Stop the renderer
	 * Halts the rendering loop and cleans up resources
	 * 
	 * @param {Object} renderer - The WebGL renderer instance
	 */
	stop: function (renderer) {
		if (renderer) {
			renderer.stop();
		}
	}
};
