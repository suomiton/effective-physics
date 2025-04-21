/**
 * matter-three.js
 * 
 * Purpose: Integrates Matter.js physics with Three.js 3D rendering.
 * This module provides a bridge between the Matter.js physics engine and Three.js,
 * enabling 3D visualization of 2D physics simulations. It handles the creation
 * of Three.js objects corresponding to Matter.js bodies, manages the scene, and
 * updates the rendering with physics data.
 */

/**
 * Integration module for Matter.js and Three.js
 * @namespace
 */
const MatterThree = {
	/**
	 * Create a new Matter-THREE integration instance
	 * Sets up a Three.js scene to render Matter.js bodies with 3D visuals
	 * 
	 * @param {Object} options - Configuration options
	 * @param {Matter.Engine} options.engine - The Matter.js physics engine
	 * @param {HTMLElement} [options.element=document.body] - The DOM element to append the renderer to
	 * @param {HTMLCanvasElement} [options.canvas] - Canvas element to use for rendering
	 * @param {number} [options.width=Constants.CANVAS.WIDTH] - Width of the rendering canvas
	 * @param {number} [options.height=Constants.CANVAS.HEIGHT] - Height of the rendering canvas
	 * @param {string|number} [options.background=Constants.COLORS.BACKGROUND] - Background color
	 * @param {boolean} [options.wireframeBackground=false] - Whether to render a wireframe background
	 * @param {boolean} [options.hasShadows=true] - Whether to enable shadows in the scene
	 * @returns {Object} - The renderer instance
	 */
	create: function (options) {
		const defaults = {
			engine: null,
			element: document.body,
			canvas: null,
			width: Constants.CANVAS.WIDTH,
			height: Constants.CANVAS.HEIGHT,
			background: Constants.COLORS.BACKGROUND,
			wireframeBackground: false,
			hasShadows: true
		};

		const render = Object.assign({}, defaults, options);

		// Create Three.js scene
		render.scene = new THREE.Scene();

		// Set up renderer
		render.renderer = new THREE.WebGLRenderer({
			canvas: render.canvas,
			antialias: true,
			alpha: true
		});

		render.renderer.setSize(render.width, render.height);
		render.renderer.setClearColor(render.background, 1);
		render.renderer.shadowMap.enabled = render.hasShadows;

		// Set up camera
		render.camera = new THREE.PerspectiveCamera(
			75,
			render.width / render.height,
			0.1,
			1000
		);
		render.camera.position.z = render.height;
		render.camera.lookAt(render.width / 2, render.height / 2, 0);

		// Create lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		render.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(render.width / 2, -render.height / 2, render.height);
		directionalLight.castShadow = render.hasShadows;
		render.scene.add(directionalLight);

		// Map to store Three.js objects corresponding to Matter.js bodies
		render.bodies = new Map();

		/**
		 * Create a Three.js mesh for a Matter.js body
		 * Generates an appropriate geometry and material based on the body's shape
		 * 
		 * @param {Matter.Body} body - The physics body to create a mesh for
		 * @returns {THREE.Mesh} - The created mesh
		 */
		render.createBodyMesh = function (body) {
			let geometry, material, mesh;

			// Different shape handling
			if (body.label === 'Circle Body') {
				geometry = new THREE.CircleGeometry(body.circleRadius, 32);
				material = new THREE.MeshStandardMaterial({
					color: body.render.fillStyle || Constants.COLORS.DEFAULT_OBJECT,
					side: THREE.DoubleSide
				});
				mesh = new THREE.Mesh(geometry, material);
				mesh.receiveShadow = render.hasShadows;
				mesh.castShadow = render.hasShadows;
			} else {
				if (body.vertices.length === 4) { // Probably a rectangle
					const width = Math.abs(body.bounds.max.x - body.bounds.min.x);
					const height = Math.abs(body.bounds.max.y - body.bounds.min.y);
					geometry = new THREE.PlaneGeometry(width, height);
				} else {
					// Create a custom shape for other polygons
					const shape = new THREE.Shape();
					shape.moveTo(body.vertices[0].x - body.position.x, body.vertices[0].y - body.position.y);
					for (let i = 1; i < body.vertices.length; i++) {
						shape.lineTo(body.vertices[i].x - body.position.x, body.vertices[i].y - body.position.y);
					}
					shape.closePath();
					geometry = new THREE.ShapeGeometry(shape);
				}

				material = new THREE.MeshStandardMaterial({
					color: body.render.fillStyle || Constants.COLORS.DEFAULT_OBJECT,
					side: THREE.DoubleSide
				});
				mesh = new THREE.Mesh(geometry, material);
				mesh.receiveShadow = render.hasShadows;
				mesh.castShadow = render.hasShadows;
			}

			return mesh;
		};

		/**
		 * Update the Three.js scene from the Matter.js world
		 * Creates, updates, or removes Three.js meshes based on physics bodies
		 */
		render.updateScene = function () {
			const bodies = Matter.Composite.allBodies(render.engine.world);

			// Add new bodies or update existing ones
			for (let i = 0; i < bodies.length; i++) {
				const body = bodies[i];

				if (!render.bodies.has(body.id)) {
					// Create and add new mesh for this body
					const mesh = render.createBodyMesh(body);
					render.bodies.set(body.id, mesh);
					render.scene.add(mesh);
				}

				// Update position and rotation
				const mesh = render.bodies.get(body.id);
				mesh.position.set(body.position.x, render.height - body.position.y, 0);
				mesh.rotation.z = -body.angle;
			}

			// Remove meshes for bodies that no longer exist
			for (const [id, mesh] of render.bodies.entries()) {
				if (!bodies.some(b => b.id === id)) {
					render.scene.remove(mesh);
					render.bodies.delete(id);
				}
			}

			// Render the scene
			render.renderer.render(render.scene, render.camera);
		};

		/**
		 * Run the renderer
		 * Starts the animation loop that updates the Three.js scene
		 */
		render.run = function () {
			render.updateScene();
			render.frameRequestId = requestAnimationFrame(render.run);
		};

		/**
		 * Stop the renderer
		 * Cancels the animation frame to stop rendering
		 */
		render.stop = function () {
			if (render.frameRequestId) {
				cancelAnimationFrame(render.frameRequestId);
				render.frameRequestId = undefined;
			}
		};

		return render;
	}
};
