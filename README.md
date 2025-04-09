# Sand Physics Simulation

This project is a web application that simulates the behavior of sand particles in a physics-based environment. Users can interact with the simulation by dropping sand particles and manipulating a draggable block.

## Project Structure

```
sand-physics-simulation
├── src
│   ├── index.html          # Main HTML document
│   ├── css
│   │   └── styles.css     # Styles for the application
│   ├── js
│   │   ├── app.js         # Entry point for JavaScript code
│   │   ├── simulation
│   │   │   ├── canvas.js  # Manages the canvas element
│   │   │   ├── particle.js # Defines the Particle class
│   │   │   ├── block.js    # Defines the Block class
│   │   │   ├── physics.js  # Simulates physics of particles
│   │   │   └── collision.js # Handles collision detection
│   │   ├── ui
│   │   │   ├── controls.js  # Manages UI controls
│   │   │   └── events.js    # Handles user input events
│   │   └── utils
│   │       └── helpers.js   # Utility functions
│   └── assets
│       └── favicon.svg      # Favicon for the application
├── .gitignore               # Files to ignore in version control
├── package.json             # npm configuration file
└── README.md                # Project documentation
```

## Getting Started

To run the simulation locally, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd sand-physics-simulation
   ```

3. Install the necessary dependencies:
   ```
   npm install
   ```

4. Open `src/index.html` in your web browser to view the simulation.

## Features

- A 640x480px canvas for rendering the simulation.
- A button to drop sand particles onto the canvas.
- Pixelated sand particles that interact with each other.
- A draggable square block that affects the sand particles.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.