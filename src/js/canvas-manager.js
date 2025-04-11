/**
 * Canvas management module for handling canvas creation/destruction
 */
const CanvasManager = {
	/**
	 * Initialize the canvas container
	 */
	init: function (originalCanvas) {
		// Create container for the canvas
		const canvasContainer = document.createElement('div');
		canvasContainer.id = 'canvasContainer';
		canvasContainer.style.width = '640px';
		canvasContainer.style.height = '480px';

		// Insert container before the original canvas
		originalCanvas.parentNode.insertBefore(canvasContainer, originalCanvas);

		// Move canvas into container
		canvasContainer.appendChild(originalCanvas);

		return {
			container: canvasContainer,
			canvas: originalCanvas
		};
	},

	/**
	 * Replace the current canvas with a fresh one
	 */
	replaceCanvas: function (container) {
		// Remove old canvas if it exists
		const oldCanvas = document.getElementById('simulationCanvas');
		if (oldCanvas) {
			oldCanvas.remove();
		}

		// Create a fresh canvas
		const newCanvas = document.createElement('canvas');
		newCanvas.id = 'simulationCanvas';
		newCanvas.width = 640;
		newCanvas.height = 480;
		container.appendChild(newCanvas);

		return newCanvas;
	},

	/**
	 * Set up mouse events for block dragging
	 */
	setupMouseEvents: function (canvas, block, engine) {
		let dragConstraint = null;
		let isDragging = false;

		const getMousePosition = (e, currentRenderer) => {
			// Use renderer-specific coordinate conversion if available
			if (currentRenderer === 'webgl' && window.renderWebGL && window.renderWebGL.getMouseCoordinates) {
				return window.renderWebGL.getMouseCoordinates(e.clientX, e.clientY);
			}

			// Default canvas-based coordinates
			const rect = canvas.getBoundingClientRect();
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			};
		};

		canvas.addEventListener('mousedown', (e) => {
			const worldPos = getMousePosition(e, window.currentRenderer);

			const bodiesAtPoint = Matter.Query.point([block], worldPos);

			if (bodiesAtPoint.length > 0) {
				isDragging = true;
				dragConstraint = Matter.Constraint.create({
					bodyA: block,
					pointA: {
						x: worldPos.x - block.position.x,
						y: worldPos.y - block.position.y
					},
					pointB: worldPos,
					stiffness: 0.02,
					render: { visible: false }
				});
				Matter.World.add(engine.world, dragConstraint);
			}
		});

		canvas.addEventListener('mousemove', (e) => {
			if (!isDragging || !dragConstraint) return;

			const worldPos = getMousePosition(e, window.currentRenderer);
			dragConstraint.pointB = worldPos;
		});

		canvas.addEventListener('mouseup', () => {
			if (dragConstraint) {
				Matter.World.remove(engine.world, dragConstraint);
				dragConstraint = null;
				isDragging = false;
			}
		});
	}
};
