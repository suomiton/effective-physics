/**
 * types.ts
 *
 * Purpose: Type definitions for the physics simulation application.
 * This file defines interfaces and types used throughout the application.
 */

import Matter from "matter-js";
import * as THREE from "three";
import Constants from "./constants";

export interface CanvasSetup {
	container: HTMLDivElement;
	canvas: HTMLCanvasElement;
}

export interface Boundaries {
	floor: Matter.Body;
	ceiling: Matter.Body;
	leftWall: Matter.Body;
	rightWall: Matter.Body;
}

export interface RendererWebGLInstance {
	engine: Matter.Engine;
	canvas: HTMLCanvasElement;
	scene: THREE.Scene;
	camera: THREE.Camera;
	webglRenderer: THREE.WebGLRenderer;
	bodies: Map<number, THREE.Mesh>;
	mousePosition: THREE.Vector2;
	config: RendererWebGLConfig;
	frameRequestId?: number;
	init(): RendererWebGLInstance;
	run(): void;
	stop(): void;
	updateScene(): void;
	_setupCamera(): void;
	_setupLights(): void;
	_setupGrid(): void;
	_disposeObjects(): void;
	parseColor(colorString?: string): THREE.Color;
	createMeshForBody(body: Matter.Body): THREE.Mesh | undefined;
	getMouseCoordinates(
		clientX: number,
		clientY: number
	): { x: number; y: number };
}

export interface RendererWebGLConfig {
	background: string;
	defaultObjectColor: string | number;
	hasShadows: boolean;
	usesOrthographicCamera: boolean;
}

export interface MousePosition {
	x: number;
	y: number;
}

export interface InteractiveObjectConfig {
	id: string;
	type: "rectangle" | "circle";
	x: number;
	y: number;
	width?: number;
	height?: number;
	radius?: number;
	color: string;
	mass: number;
	frictionAir: number;
	restitution: number;
	isStatic: boolean;
	isDraggable: boolean;
}

export interface InteractiveObject {
	id: string;
	config: InteractiveObjectConfig;
	body: Matter.Body;
}

// Declare global constants that will be available in the window object
declare global {
	interface Window {
		Constants: typeof Constants;
		currentRenderer: string | null;
		render2D: Matter.Render | null;
		renderWebGL: RendererWebGLInstance | null;
		Matter: typeof Matter;
		THREE: typeof THREE;
		interactiveObjects?: Map<string, InteractiveObject>;
	}
}
