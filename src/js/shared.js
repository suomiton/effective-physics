/**
 * Shared utility functions
 */
const PhysicsUtils = {
	/**
	 * Create boundary walls
	 */
	createBoundaries: function (canvas, world) {
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
	 * Create a block
	 */
	createBlock: function (world, x, y, width, height) {
		const block = Matter.Bodies.rectangle(x, y, width, height, {
			mass: 10,
			frictionAir: 0.0,
			restitution: 0,
			render: { fillStyle: 'blue' }
		});

		Matter.World.add(world, block);
		return block;
	},

	/**
	 * Create sand particles in a cluster
	 */
	dropSand: function (canvas, world) {
		const sandColors = [
			'#E6C288',
			'#D4B16A',
			'#C19A53',
			'#B3894D',
			'#F0D6A7'
		];

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

			if (!validPos) continue;

			const particle = Matter.Bodies.circle(validPos.x, validPos.y, 2, {
				mass: 0.01,
				restitution: 0.0,
				friction: 0.1,
				frictionAir: 0.01,
				render: {
					fillStyle: sandColors[Math.floor(Math.random() * sandColors.length)]
				}
			});

			Matter.World.add(world, particle);
		}
	}
};
