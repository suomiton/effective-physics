/**
 * WebGL renderer module using Three.js
 */

// Ensure THREE.js and Matter.js are imported
const RendererWebGL = {
	/**
	 * Create a new WebGL renderer
	 */
	create: function (engine, canvas) {
		try {
			// Check if THREE is available
			if (typeof THREE === 'undefined') {
				throw new Error("THREE.js is not loaded");
			}

			// Create a custom Matter-THREE renderer with orthographic camera
			const webGLRenderer = {
				engine: engine,
				canvas: canvas,
				scene: new THREE.Scene(),
				bodies: new Map(),
				mousePosition: new THREE.Vector2(),

				init: function () {
					// Set up WebGL renderer
					this.webglRenderer = new THREE.WebGLRenderer({
						canvas: this.canvas,
						antialias: true,
						alpha: true
					});
					this.webglRenderer.setClearColor(0xffffff, 1);
					this.webglRenderer.setSize(this.canvas.width, this.canvas.height);

					// Create orthographic camera to match 2D coordinates exactly
					// Note: We're inverting the top/bottom to match Matter.js Y coordinates
					this.camera = new THREE.OrthographicCamera(
						-this.canvas.width / 2, this.canvas.width / 2, // left, right
						this.canvas.height / 2, -this.canvas.height / 2, // top, bottom
						0.1, 1000 // near, far
					);
					// Center the camera on the canvas
					this.camera.position.set(0, 0, 100);
					this.camera.lookAt(new THREE.Vector3(0, 0, 0));

					// Add ambient light
					const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
					this.scene.add(ambientLight);

					// Add a simple ground plane for reference
					const groundGeometry = new THREE.PlaneGeometry(this.canvas.width, this.canvas.height);
					const groundMaterial = new THREE.MeshBasicMaterial({
						color: 0xf8f8f8,
						side: THREE.DoubleSide,
						transparent: true,
						opacity: 0.5
					});
					const ground = new THREE.Mesh(groundGeometry, groundMaterial);
					ground.position.set(0, 0, -5); // Centered at (0, 0) in the camera's view
					this.scene.add(ground);

					// Optional grid helper
					try {
						const gridSize = Math.max(this.canvas.width, this.canvas.height);
						const gridHelper = new THREE.GridHelper(gridSize, 10, 0x888888, 0xdddddd);
						gridHelper.rotation.x = Math.PI / 2;
						gridHelper.position.set(0, 0, -1); // Centered at (0, 0) in the camera's view
						this.scene.add(gridHelper);
					} catch (e) {
						console.warn("Could not add grid helper:", e);
					}

					return this;
				},

				run: function () {
					this.frameRequestId = requestAnimationFrame(this.run.bind(this));
					this.updateScene();
				},

				stop: function () {
					if (this.frameRequestId) {
						cancelAnimationFrame(this.frameRequestId);
					}
					// Clean up THREE.js objects
					this.bodies.forEach((mesh) => {
						if (mesh.geometry) mesh.geometry.dispose();
						if (mesh.material) mesh.material.dispose();
						this.scene.remove(mesh);
					});
					this.bodies.clear();
				},

				// Convert color string to THREE.js color
				parseColor: function (colorString) {
					try {
						return new THREE.Color(colorString || 0x4444ff);
					} catch (e) {
						console.warn("Invalid color:", colorString, e);
						return new THREE.Color(0x4444ff);
					}
				},

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
								mesh.position.set(
									body.position.x - this.canvas.width / 2, // Adjust for camera centering
									this.canvas.height / 2 - body.position.y, // Adjust for camera centering and flip Y-axis
									0
								);
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

				// Convert Three.js coordinates to Matter.js world coordinates
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
	 */
	start: function (renderer) {
		renderer.run();
		console.log("Using Three.js WebGL renderer (orthographic)");
	},

	/**
	 * Stop the renderer
	 */
	stop: function (renderer) {
		if (renderer) {
			renderer.stop();
		}
	}
};
