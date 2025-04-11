/* 
   Matter.js-based simulation.

   Features:
   - Enclosing static walls (floor, ceiling, sides) so objects stay in view.
   - A dynamic block with custom hinge-like dragging:
	 * A constraint is added where you first click the block, allowing rotation.
	 * On mouseup, the constraint is removed, letting the block keep momentum.
   - Sand grains with lighter mass, slight bounce, friction, random colors.
   - All collisions, gravity, and constraints handled by Matter.js.
*/

const canvas = document.getElementById('simulationCanvas');

// Listen for selection changes and show error if unsupported
const renderEngineSelect = document.getElementById('renderEngineSelect');
if (renderEngineSelect) {
	renderEngineSelect.addEventListener('change', () => {
		const chosen = renderEngineSelect.value;
		const testCtx = canvas.getContext(chosen);
		if (!testCtx) {
			alert(`Renderer "${chosen}" is not supported, falling back to 2D`);
			render.context = canvas.getContext('2d');
		} else {
			alert(`Renderer "${chosen}" selected!`);
			render.context = testCtx;
		}
	});
}

// Matter.js modules
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Constraint = Matter.Constraint;

// Create Engine & World (enable y-axis gravity)
const engine = Engine.create({ enableSleeping: true });
const world = engine.world;
world.gravity.y = 1.0;

// Default to 2D context
const ctx = canvas.getContext('2d');

// Create a Matter.js renderer tied to your existing canvas
const render = Render.create({
	engine: engine,
	canvas: canvas,
	context: ctx,
	options: {
		width: canvas.width,
		height: canvas.height,
		wireframes: false,
		background: '#ffffff'
	}
});
Render.run(render);

// Create and run the engine’s runner
const runner = Runner.create();
Runner.run(runner, engine);

// Add static boundary walls so objects stay in view
const wallThickness = 50;
// Floor
const floor = Bodies.rectangle(
	canvas.width / 2,
	canvas.height + wallThickness / 2,
	canvas.width,
	wallThickness,
	{ isStatic: true }
);
// Ceiling
const ceiling = Bodies.rectangle(
	canvas.width / 2,
	-wallThickness / 2,
	canvas.width,
	wallThickness,
	{ isStatic: true }
);
// Left wall
const leftWall = Bodies.rectangle(
	-wallThickness / 2,
	canvas.height / 2,
	wallThickness,
	canvas.height,
	{ isStatic: true }
);
// Right wall
const rightWall = Bodies.rectangle(
	canvas.width + wallThickness / 2,
	canvas.height / 2,
	wallThickness,
	canvas.height,
	{ isStatic: true }
);
World.add(world, [floor, ceiling, leftWall, rightWall]);

// Create the block as a dynamic body
const blockWidth = 50;
const blockHeight = 50;
const block = Bodies.rectangle(300, 400, blockWidth, blockHeight, {
	mass: 10,
	frictionAir: 0.0,   // No air resistance
	restitution: 0,
	render: { fillStyle: 'blue' }
});
World.add(world, block);

// Example array of sand colors
const sandColors = [
	'#E6C288',
	'#D4B16A',
	'#C19A53',
	'#B3894D',
	'#F0D6A7'
];

// Function to create sand particles with random color, small radius, etc.
function dropSand() {
	const clusterCenter = { x: canvas.width / 2, y: 100 };
	const clusterRadius = 80;
	const positions = [];
	const maxAttempts = 300;

	for (let i = 0; i < 500; i++) {
		let validPos = null;
		for (let attempt = 0; attempt < maxAttempts && !validPos; attempt++) {
			const angle = Math.random() * 2 * Math.PI;
			const r = Math.random() * clusterRadius;
			const xPos = clusterCenter.x + r * Math.cos(angle);
			const yPos = clusterCenter.y + r * Math.sin(angle);
			let tooClose = false;
			for (const p of positions) {
				const dx = xPos - p.x;
				const dy = yPos - p.y;
				if (Math.sqrt(dx * dx + dy * dy) < 2) {
					tooClose = true;
					break;
				}
			}
			if (!tooClose) {
				validPos = { x: xPos, y: yPos };
				positions.push(validPos);
			}
		}
		if (!validPos) continue; // Could not find non-overlapping position

		const particle = Bodies.circle(validPos.x, validPos.y, 2, {
			mass: 0.01,
			restitution: 0.0,
			friction: 0.1,
			frictionAir: 0.01,
			render: {
				fillStyle: sandColors[Math.floor(Math.random() * sandColors.length)]
			}
		});
		World.add(world, particle);
	}
}

// Hook the “Drop Sand” button
document.getElementById('dropSandButton').addEventListener('click', dropSand);

// ------------------------------------
// CUSTOM HINGE-LIKE DRAGGING BELOW
// ------------------------------------

// We'll track a single mouse constraint for dragging the block
let dragConstraint = null;
let isDragging = false;

// Listen for mousedown to create a pivot constraint if clicking the block
canvas.addEventListener('mousedown', (e) => {
	const rect = canvas.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;

	// Convert screen coords to Matter.js world coords
	// (render.viewport transforms typically, but if scale=1 and no translation, it’s direct)
	const worldPos = { x: mouseX, y: mouseY };

	// Use Matter.Query.point to see if we clicked the block
	const bodiesAtPoint = Matter.Query.point([block], worldPos);
	if (bodiesAtPoint.length > 0) {
		// We clicked the block; create a new constraint from block to mouse
		isDragging = true;
		dragConstraint = Constraint.create({
			bodyA: block,
			// The local offset in bodyA where you clicked (convert global to local)
			pointA: {
				x: worldPos.x - block.position.x,
				y: worldPos.y - block.position.y
			},
			pointB: worldPos,
			stiffness: 0.02,
			render: { visible: false }
		});
		World.add(world, dragConstraint);
	}
});

canvas.addEventListener('mousemove', (e) => {
	if (!isDragging || !dragConstraint) return;

	// Update constraint’s pointB to current mouse pos
	const rect = canvas.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;
	dragConstraint.pointB = { x: mouseX, y: mouseY };
});

canvas.addEventListener('mouseup', () => {
	if (dragConstraint) {
		World.remove(world, dragConstraint);
		dragConstraint = null;
		isDragging = false;
	}
});

// That’s it! Matter.js handles collisions, gravity, and your custom hinge-like dragging.