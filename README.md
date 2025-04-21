# Effective Physics Simulation

This project is a web application that demonstrates physics simulations using Matter.js and offers visualization through either Canvas 2D or WebGL (Three.js) renderers. Users can interact with the simulation by dropping sand particles and manipulating draggable physics objects.

## Features

- Interactive physics objects with realistic behavior
- Two rendering options: Canvas 2D and WebGL (Three.js)
- Sand particle simulation with natural falling and stacking behavior
- Draggable physics objects with proper constraint physics
- Responsive physics environment with boundaries and collisions
- TypeScript implementation for type safety and better code organization

## Technologies Used

- **TypeScript**: For type-safe code organization
- **Matter.js**: Physics engine for simulation
- **Three.js**: 3D WebGL rendering
- **Webpack**: Module bundling and development server
- **HTML5 Canvas**: 2D rendering option

## Project Structure

```
effective-physics
├── src
│   ├── index.html         # Main HTML document
│   ├── css
│   │   └── styles.css     # Styles for the application
│   ├── ts
│   │   ├── app.ts         # Main application entry point
│   │   ├── canvas-manager.ts # Canvas management utilities
│   │   ├── constants.ts   # Application constants and configuration
│   │   ├── interactive-block.ts # Block object implementation
│   │   ├── interactive-world.ts # World object management
│   │   ├── renderer-2d.ts # Canvas 2D rendering implementation
│   │   ├── renderer-webgl.ts # WebGL (Three.js) rendering implementation
│   │   ├── shared.ts      # Shared physics utilities
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── declarations
│   │       └── globals.d.ts # Global type declarations
│   └── assets
│       └── favicon.svg    # Favicon for the application
├── .github
│   └── workflows          # GitHub Actions workflows
├── .gitignore             # Files to ignore in version control
├── package.json           # npm configuration
├── tsconfig.json          # TypeScript configuration
├── webpack.config.js      # Webpack configuration
└── README.md              # Project documentation
```

## Renderers

The application supports two rendering methods that can be switched via the UI:

### Canvas 2D Renderer

- Utilizes the HTML5 Canvas 2D API
- Faster for simpler simulations
- Direct integration with Matter.js's built-in renderer
- Lower memory usage

### WebGL Renderer

- Uses Three.js for WebGL-accelerated rendering
- Provides 3D visualization of the 2D physics
- Better performance for complex simulations with many objects
- Enhanced visual effects with lighting and shadows
- Hardware-accelerated rendering

## Getting Started

To run the simulation locally, follow these steps:

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd effective-physics
   ```

3. Install the necessary dependencies:

   ```
   npm install
   ```

4. Start the development server:

   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:9000`

## Development

### Build Commands

- `npm start`: Starts the development server with hot reloading
- `npm run build`: Creates a production build in the `dist` directory
- `npm run dev`: Creates a development build with source maps
- `npm run watch`: Watches for file changes and rebuilds automatically
- `npm run type-check`: Runs TypeScript type checking without emitting files

### Application Startup Sequence

1. The application initializes the physics engine (Matter.js)
2. Creates a canvas and sets up boundaries
3. Initializes the Interactive World to manage physics objects
4. Determines which renderer to use (Canvas 2D or WebGL)
5. Sets up event handlers for user interaction
6. Starts the physics simulation and rendering loop

### Adding Custom Physics Objects

Custom interactive objects can be added through the `constants.ts` file or programmatically:

```typescript
// Add through the constants file
// in constants.ts, add to INTERACTIVE_OBJECTS array

// Or programmatically
window.interactiveWorld.create({
	type: "rectangle", // or "circle"
	x: 320,
	y: 240,
	width: 50,
	height: 50,
	color: "#ff0000",
	mass: 10,
	isDraggable: true,
});
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
