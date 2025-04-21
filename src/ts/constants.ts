/**
 * constants.ts
 * 
 * Purpose: Centralized configuration values for the physics simulation.
 * This file defines all constants used throughout the application including
 * canvas dimensions, physics settings, colors, and renderer types.
 * It makes these constants available globally and as a module export.
 */

/**
 * Global Constants object containing all application configuration values
 */
const Constants = {
  // Canvas dimensions
  CANVAS: {
    WIDTH: 640,
    HEIGHT: 480
  },

  // Physics settings
  PHYSICS: {
    GRAVITY: 1.0,
    SLEEP_ENABLED: true
  },

  // Colors
  COLORS: {
    BACKGROUND: '#ffffff',
    DEFAULT_OBJECT: 0x4444ff,
  },

  // Block configuration
  BLOCK: {
    SIZE: 50,
    COLOR: '#4444ff'
  },

  // Sand configuration
  SAND: {
    GRAIN_SIZE: 2,
    COLORS: [
      '#E6C288',
      '#D4B16A',
      '#C19A53',
      '#B3894D',
      '#F0D6A7'
    ]
  },

  // Renderer types
  RENDERER: {
    WEBGL: 'webgl',
    CANVAS_2D: '2d'
  }
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.Constants = Constants;
}

export default Constants;