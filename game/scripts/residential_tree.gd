extends Node3D
# Shared Nordic trees, with progressively cheaper geometry at distance.
var species_kind=-1
var crown_scale=.62
func _ready():call_deferred("build_tree")
func build_tree():
 if preload("res://scripts/town_exit.gd").corridor(position.x,-position.z):queue_free();return
 var seed_value=absi(int(position.x*31+position.z*17))
 var kind=species_kind if species_kind>=0 else [1,2,1,0,2,1,2][seed_value%7]
 var variant=seed_value%3
 set_meta("nordic_species",kind)
 for lod in 3:
  for shared in preload("res://scripts/nordic_trees.gd").species(kind,variant,lod):
   var part=MeshInstance3D.new();add_child(part);part.mesh=shared;part.layers=2;part.scale=Vector3.ONE*crown_scale
   part.visibility_range_begin=[0,24,65][lod];part.visibility_range_end=[24,65,280][lod]
   if lod==2:part.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
 var body=StaticBody3D.new();add_child(body);var c=CollisionShape3D.new();var shape=CylinderShape3D.new();shape.radius=.27;shape.height=2.8;c.shape=shape;c.position.y=1.4;body.add_child(c)
static func tube_mesh(st:SurfaceTool,a:Vector3,b:Vector3,r1:float,r2:float):
 preload("res://scripts/tree_geometry.gd").tube_mesh(st,a,b,r1,r2)
