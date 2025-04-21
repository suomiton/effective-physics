// Global declarations for libraries loaded via script tags
declare namespace Matter {
	interface Engine {
		world: World;
		gravity: { x: number; y: number };
		timing: any;
		enableSleeping: boolean;
	}

	interface World {
		gravity: { x: number; y: number; scale: number };
		bodies: Body[];
	}

	interface Body {
		id: number;
		position: { x: number; y: number };
		angle: number;
		vertices: { x: number; y: number }[];
		render?: { fillStyle?: string };
		circleRadius?: number;
	}

	interface Constraint {
		bodyA: Body;
		pointA: { x: number; y: number };
		pointB: { x: number; y: number };
		stiffness: number;
		render: { visible: boolean };
	}

	interface Render {
		options: {
			width: number;
			height: number;
			wireframes: boolean;
			background: string;
		};
		canvas: HTMLCanvasElement;
		context: CanvasRenderingContext2D;
	}

	interface IEngineOptions {
		gravity?: { x: number; y: number };
		enableSleeping?: boolean;
	}

	namespace Bodies {
		function rectangle(
			x: number,
			y: number,
			width: number,
			height: number,
			options?: any
		): Body;
		function circle(x: number, y: number, radius: number, options?: any): Body;
	}

	namespace Body {
		function setPosition(body: Body, position: { x: number; y: number }): void;
		function setAngle(body: Body, angle: number): void;
	}

	namespace Composite {
		function add(world: World, bodies: Body | Body[]): void;
		function allBodies(world: World): Body[];
		function clear(world: World, keepStatic: boolean): void;
	}

	namespace Constraint {
		function create(options: any): Constraint;
	}

	namespace Engine {
		function create(options?: IEngineOptions): Engine;
		function update(engine: Engine, delta?: number): void;
	}

	namespace Events {
		function on(obj: any, event: string, callback: Function): void;
	}

	namespace Mouse {
		function create(render: Render): any;
	}

	namespace MouseConstraint {
		function create(engine: Engine, options: any): any;
	}

	namespace Query {
		function point(bodies: Body[], point: { x: number; y: number }): Body[];
	}

	namespace Render {
		function create(options: any): Render;
		function run(render: Render): void;
		function stop(render: Render): void;
	}

	namespace Runner {
		function create(options?: any): any;
		function run(runner: any, engine: Engine): void;
		function stop(runner: any): void;
	}

	namespace Vector {
		function sub(
			vectorA: { x: number; y: number },
			vectorB: { x: number; y: number }
		): { x: number; y: number };
	}

	namespace World {
		function add(
			world: World,
			body: Body | Body[] | Constraint | Constraint[]
		): void;
		function remove(
			world: World,
			body: Body | Constraint,
			deep?: boolean
		): void;
	}
}

declare namespace THREE {
	class Vector2 {
		x: number;
		y: number;
		constructor(x?: number, y?: number);
	}

	class Vector3 {
		x: number;
		y: number;
		z: number;
		constructor(x?: number, y?: number, z?: number);
		set(x: number, y: number, z: number): this;
	}

	class Color {
		constructor(color: string | number);
	}

	class Scene {
		add(object: Object3D): void;
		remove(object: Object3D): void;
		children: Object3D[];
	}

	class WebGLRenderer {
		constructor(options?: {
			canvas?: HTMLCanvasElement;
			antialias?: boolean;
			alpha?: boolean;
		});
		setSize(width: number, height: number): void;
		setClearColor(color: Color, alpha?: number): void;
		render(scene: Scene, camera: Camera): void;
		shadowMap: { enabled: boolean; type: number };
	}

	class Camera extends Object3D {}

	class OrthographicCamera extends Camera {
		constructor(
			left: number,
			right: number,
			top: number,
			bottom: number,
			near: number,
			far: number
		);
	}

	class PerspectiveCamera extends Camera {
		constructor(fov: number, aspect: number, near: number, far: number);
	}

	class Object3D {
		position: Vector3;
		rotation: { x: number; y: number; z: number };
		scale: Vector3;
		add(object: Object3D): void;
		remove(object: Object3D): void;
	}

	class Mesh extends Object3D {
		constructor(geometry: BufferGeometry, material: Material | Material[]);
		geometry: BufferGeometry;
		material: Material | Material[];
		castShadow: boolean;
		receiveShadow: boolean;
	}

	class Material {
		dispose(): void;
		side: number;
	}

	class MeshBasicMaterial extends Material {
		constructor(options?: {
			color?: Color | string | number;
			wireframe?: boolean;
		});
	}

	class MeshLambertMaterial extends Material {
		constructor(options?: {
			color?: Color | string | number;
			wireframe?: boolean;
		});
	}

	class MeshPhongMaterial extends Material {
		constructor(options?: { color?: Color | string | number; side?: number });
	}

	class BufferGeometry {
		dispose(): void;
	}

	class CircleGeometry extends BufferGeometry {
		constructor(radius: number, segments: number);
	}

	class PlaneGeometry extends BufferGeometry {
		constructor(
			width: number,
			height: number,
			widthSegments?: number,
			heightSegments?: number
		);
	}

	class ShapeGeometry extends BufferGeometry {
		constructor(shapes: Shape | Shape[]);
	}

	class ExtrudeGeometry extends BufferGeometry {
		constructor(
			shape: Shape,
			options?: { depth?: number; bevelEnabled?: boolean }
		);
	}

	class Shape {
		constructor();
		moveTo(x: number, y: number): void;
		lineTo(x: number, y: number): void;
		closePath(): void;
	}

	class GridHelper extends Object3D {
		constructor(
			size: number,
			divisions: number,
			color1?: number,
			color2?: number
		);
	}

	class Light extends Object3D {
		constructor(color?: Color | string | number, intensity?: number);
	}

	class AmbientLight extends Light {
		constructor(color?: Color | string | number, intensity?: number);
	}

	class DirectionalLight extends Light {
		constructor(color?: Color | string | number, intensity?: number);
		castShadow: boolean;
		shadow: {
			camera: {
				left: number;
				right: number;
				top: number;
				bottom: number;
				near: number;
				far: number;
			};
			mapSize: {
				width: number;
				height: number;
			};
		};
	}

	// Constants
	const DoubleSide: number;
	const PCFSoftShadowMap: number;
}
