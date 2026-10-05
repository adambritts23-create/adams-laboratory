extends Node3D
var roadside_count=0
var background_count=0
var home_forest_count=0
var distant_meshes={}
func build(land):
 name="ForestExpansion"
 var rng=RandomNumberGenerator.new();rng.seed=71026
 # Driving towards town is -Z: the left shoulder is the negative-X side.
 for station in range(190,585,32):
  for column in range(-120,-22,32):
   var groups=[[],[],[]]
   for i in 23:
    var s=station+rng.randf()*32;var x=column+rng.randf()*32
    if x>land.road_x(s)-17:continue
    var kind=0 if i%13==0 else 2 if i%3==0 else 1
    var pose=Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.72,1.35)),Vector3(x,land.terrain_height(x,s),-s))
    groups[kind].append(pose);roadside_count+=1
    var trunk=StaticBody3D.new();add_child(trunk);trunk.position=pose.origin+Vector3.UP*1.4
    var collision=CollisionShape3D.new();trunk.add_child(collision);var shape=CylinderShape3D.new();shape.radius=.23;shape.height=2.8;collision.shape=shape
   for kind in 3:
    for lod in 3:batch(groups[kind],kind,lod,[0,24,65][lod],[24,65,320][lod])
 # Background trees use only coarse crowns: no understory, collisions or shadows.
 for side in [-1,1]:
  for station in range(80,1400,64):
   for distance in range(208,620,64):
    var groups=[[],[],[]]
    for i in 24:
     var s=station+rng.randf()*64;var d=distance+rng.randf()*64
     if side<0 and preload("res://scripts/town_exit.gd").corridor(-d,s):continue
     var kind=2 if i%4==0 else 1
     var pose=Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.8,1.55)),Vector3(side*d,land.ridge_height(d,s),-s))
     groups[kind].append(pose);background_count+=1
    for kind in [1,2]:batch(groups[kind],kind,3,0,1000)
 home_woodland(land,rng)
func home_woodland(land,rng:RandomNumberGenerator):
 # Extend the existing western woodland, leaving lawns, the trial and access lanes intact.
 for station in range(900,1156,32):
  for column in range(-196,-100,32):
   var groups=[[],[],[]]
   for i in 19:
    var x=column+rng.randf()*32;var s=station+rng.randf()*32
    if x> -94 or (x> -153 and s>923 and s<968):continue
    if preload("res://scripts/land_use.gd").no_tall_grass(x,s):continue
    var lawn=false
    for bounds in land.get_meta("lawn_bounds",[]):
     if bounds.grow(2).has_point(Vector2(x,-s)):lawn=true
    if lawn:continue
    var p=Vector3(x,land.terrain_height(x,s),-s);var kind=0 if i%11==0 else 2 if i%3==0 else 1
    groups[kind].append(Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.75,1.3)),p));home_forest_count+=1
    var trunk=StaticBody3D.new();add_child(trunk);trunk.position=p+Vector3.UP*1.4
    var collision=CollisionShape3D.new();trunk.add_child(collision);collision.shape=CylinderShape3D.new();collision.shape.radius=.23;collision.shape.height=2.8
   for kind in 3:
    for lod in 3:batch(groups[kind],kind,lod,[0,24,65][lod],[24,65,320][lod])
 for s in [994,1052,1123]:
  var fallen=load("res://scripts/fallen_tree.gd").new();add_child(fallen);fallen.position=Vector3(-178,land.terrain_height(-178,s)+.3,-s);fallen.rotation.y=float(s)*.13
func batch(poses:Array,kind:int,lod:int,start:float,finish:float):
 if poses.is_empty():return
 var origin:Vector3=poses[0].origin
 var shared=distant_tree(kind) if lod==3 else preload("res://scripts/nordic_trees.gd").species(kind,1,lod)
 for mesh in shared:
  var node=MultiMeshInstance3D.new();add_child(node);node.position=origin;node.layers=2
  node.multimesh=MultiMesh.new();node.multimesh.transform_format=MultiMesh.TRANSFORM_3D;node.multimesh.mesh=mesh;node.multimesh.instance_count=poses.size()
  for i in poses.size():
   var pose:Transform3D=poses[i];pose.origin-=origin;node.multimesh.set_instance_transform(i,pose)
  node.visibility_range_begin=start;node.visibility_range_end=finish
  if lod>=2:node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF

func distant_tree(kind:int)->Array:
 if distant_meshes.has(kind):return distant_meshes[kind]
 var trunk=CylinderMesh.new();trunk.top_radius=.07;trunk.bottom_radius=.25;trunk.height=11;trunk.radial_segments=6;trunk.rings=1
 var timber=SurfaceTool.new();timber.append_from(trunk,0,Transform3D(Basis.IDENTITY,Vector3.UP*5.5))
 var wood=timber.commit();var bark=StandardMaterial3D.new();bark.albedo_color=Color(.23,.15,.08);wood.surface_set_material(0,bark)
 var crown=SurfaceTool.new();crown.begin(Mesh.PRIMITIVE_TRIANGLES)
 if kind==1:
  for tier in 4:
   var cone=CylinderMesh.new();cone.top_radius=.04;cone.bottom_radius=3.1-tier*.62;cone.height=4.5-tier*.25;cone.radial_segments=9;cone.rings=1
   crown.append_from(cone,0,Transform3D(Basis(Vector3.UP,tier*.7).scaled(Vector3(1,.95,.85)),Vector3(sin(tier)*.2,4+tier*2,0)))
 else:
  for tier in 3:
   var canopy=SphereMesh.new();canopy.radius=2.5-tier*.35;canopy.height=3;canopy.radial_segments=8;canopy.rings=3
   crown.append_from(canopy,0,Transform3D(Basis.IDENTITY,Vector3(sin(tier*2)*1.2,9+tier,cos(tier*2)*.7)))
 var leaves=crown.commit();var green=StandardMaterial3D.new();green.albedo_color=Color(.07,.19,.065);green.roughness=1;leaves.surface_set_material(0,green)
 distant_meshes[kind]=[wood,leaves];return distant_meshes[kind]
