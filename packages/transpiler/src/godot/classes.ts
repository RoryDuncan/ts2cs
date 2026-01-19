/**
 * Known Godot base classes that trigger `using Godot;`
 *
 * This list contains common Godot 4.x node types and resources.
 * When a TypeScript class extends one of these, the transpiler
 * will add `using Godot;` to the generated C# file.
 */
export const GODOT_CLASSES = new Set([
  // Core nodes
  "Node",
  "Node2D",
  "Node3D",

  // Sprites
  "Sprite2D",
  "Sprite3D",

  // Physics bodies
  "CharacterBody2D",
  "CharacterBody3D",
  "RigidBody2D",
  "RigidBody3D",
  "StaticBody2D",
  "StaticBody3D",

  // Areas
  "Area2D",
  "Area3D",

  // UI / Control nodes
  "Control",
  "Label",
  "Button",
  "TextEdit",
  "LineEdit",
  "Panel",
  "Container",
  "BoxContainer",
  "VBoxContainer",
  "HBoxContainer",
  "GridContainer",
  "MarginContainer",
  "CenterContainer",
  "ScrollContainer",
  "TabContainer",
  "SplitContainer",
  "TextureRect",
  "ColorRect",
  "NinePatchRect",
  "ProgressBar",
  "SpinBox",
  "Slider",
  "HSlider",
  "VSlider",
  "CheckBox",
  "CheckButton",
  "OptionButton",
  "MenuButton",
  "Tree",
  "ItemList",
  "RichTextLabel",

  // Resources
  "Resource",
  "RefCounted",

  // Cameras
  "Camera2D",
  "Camera3D",

  // Audio
  "AudioStreamPlayer",
  "AudioStreamPlayer2D",
  "AudioStreamPlayer3D",

  // Animation
  "AnimationPlayer",
  "AnimationTree",
  "AnimatedSprite2D",
  "AnimatedSprite3D",

  // Tilemaps
  "TileMap",
  "TileMapLayer",

  // Canvas and viewport
  "CanvasLayer",
  "CanvasItem",
  "Viewport",
  "SubViewport",
  "SubViewportContainer",

  // Utility
  "Timer",
  "HTTPRequest",
  "Path2D",
  "Path3D",
  "PathFollow2D",
  "PathFollow3D",

  // Collision
  "CollisionShape2D",
  "CollisionShape3D",
  "CollisionPolygon2D",
  "CollisionPolygon3D",

  // Raycasting
  "RayCast2D",
  "RayCast3D",

  // Particles
  "GPUParticles2D",
  "GPUParticles3D",
  "CPUParticles2D",
  "CPUParticles3D",

  // Lights
  "Light2D",
  "PointLight2D",
  "DirectionalLight2D",
  "Light3D",
  "DirectionalLight3D",
  "OmniLight3D",
  "SpotLight3D",

  // 3D Meshes
  "MeshInstance3D",
  "MultiMeshInstance3D",
  "CSGShape3D",
  "CSGBox3D",
  "CSGSphere3D",
  "CSGCylinder3D",

  // Navigation
  "NavigationAgent2D",
  "NavigationAgent3D",
  "NavigationRegion2D",
  "NavigationRegion3D"
]);

/**
 * Check if a class name is a known Godot class
 */
export function isGodotClass(className: string): boolean {
  return GODOT_CLASSES.has(className);
}
