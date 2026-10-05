extends "res://scripts/lab_props.gd"
# A deliberately small forest trial; shared meshes and spatial grass batches.
var wood:Material
var land
var grass_count=0
var tree_count=0
func build(l):
 wood=material(Color(.3,.2,.1));land=l;name="WoodlandTrial";init_materials()
 var rng=RandomNumberGenerator.new();rng.seed=19473
 var bark=material(Color(.31,.22,.13),0,.97)
 for i in 77:
  var x=-150+(i%11)*5.1+rng.randf_range(-1.0,1.0);var station=925+(i/11)*6.0+rng.randf_range(-.8,.8)
  if absf(station-trail_s(x))<1.7:continue
  var kind=[1,2,1,0,1,2,1,2,1,0][i%10]
  var tree=Node3D.new();add_child(tree);tree.name=["Birch","Spruce","ScotsPine"][kind]+str(i);tree.position=Vector3(x,land.terrain_height(x,station),-station);tree.rotation.y=rng.randf()*TAU;tree.scale=Vector3.ONE*rng.randf_range(.75,1.10)
  for shared in preload("res://scripts/nordic_trees.gd").species(kind,int(i/3)%3):
   var mesh=MeshInstance3D.new();tree.add_child(mesh);mesh.mesh=shared;mesh.layers=2;mesh.visibility_range_end=200
  tree_count+=1
 var wind=ShaderMaterial.new();wind.shader=preload("res://materials/outdoor_foliage.gdshader")
 var moss=ShaderMaterial.new();moss.shader=preload("res://materials/forest_moss.gdshader")
 var stone=material(Color(.28,.30,.23),0,1)
 for i in 5:
  var x=rng.randf_range(-150,-98);var station=rng.randf_range(925,965)
  if absf(station-trail_s(x))<1.6:continue
  var q=Vector3(x,land.terrain_height(x,station),-station)
  var size=Vector3(.4+rng.randf()*.65,.22+rng.randf()*.38,.4+rng.randf()*.5)
  ellipsoid(q+Vector3.UP*size.y*.35,size,stone)
  for patch in 4:
   var offset=Vector3(rng.randf_range(-.3,.3)*size.x,size.y*(.7+rng.randf()*.25),rng.randf_range(-.3,.3)*size.z)
   ellipsoid(q+offset,size*Vector3(.45+rng.randf()*.3,.16,.5+rng.randf()*.25),moss)
 mushroom_clusters(rng)
 blueberry_patch(rng)
 forest_details(rng,bark)
 var blades=SurfaceTool.new();blades.begin(Mesh.PRIMITIVE_TRIANGLES)
 var maker=preload("res://scripts/lakeside_environment.gd").new()
 for i in 9:
  var a=i*2.399
  maker.blade(blades,Vector3(cos(a)*.13,0,sin(a)*.13),Vector3(cos(a)*.19,rng.randf_range(.18,.42),sin(a)*.19),.025,Color(.12,.23,.035).lerp(Color(.34,.38,.12),rng.randf()))
 maker.free()
 var grass=blades.commit();var gm=ShaderMaterial.new();gm.shader=wind.shader;gm.set_shader_parameter("grass",true);grass.surface_set_material(0,gm)
 for bx in range(-152,-96,7):
  for bs in range(924,966,7):
   var transforms:Array[Transform3D]=[]
   for i in 190:
    var x=bx+rng.randf()*7;var s=bs+rng.randf()*7
    if absf(s-trail_s(x))<.85 or preload("res://scripts/land_use.gd").no_tall_grass(x,s):continue
    var on_lawn=false
    for bounds in land.get_meta("lawn_bounds",[]):
     if bounds.has_point(Vector2(x,-s)):on_lawn=true;break
    if on_lawn:continue
    transforms.append(Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.7,1.25)),Vector3(x,land.terrain_height(x,s)+.02,-s)))
   if transforms.is_empty():continue
   var batch=MultiMeshInstance3D.new();add_child(batch);batch.multimesh=MultiMesh.new();batch.multimesh.transform_format=MultiMesh.TRANSFORM_3D;batch.multimesh.mesh=grass;batch.multimesh.instance_count=transforms.size()
   for i in transforms.size():batch.multimesh.set_instance_transform(i,transforms[i])
   batch.layers=2;batch.visibility_range_end=65;batch.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;grass_count+=transforms.size()
 # Ground-hugging trail connects to the rear of the apartment grounds.
 var path=SurfaceTool.new();path.begin(Mesh.PRIMITIVE_TRIANGLES)
 for x in range(-152,-93):
  for q in [Vector2(x,-.75),Vector2(x,.75),Vector2(x+1,.75),Vector2(x,-.75),Vector2(x+1,.75),Vector2(x+1,-.75)]:
   var s=trail_s(q.x)+q.y;path.add_vertex(Vector3(q.x,land.terrain_height(q.x,s)+.07,-s))
 path.generate_normals();var walk=MeshInstance3D.new();add_child(walk);walk.mesh=path.commit();walk.material_override=floor_material(true);walk.layers=2
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=2
func trail_s(x:float)->float:
 return 944.0+sin((x+94)*.18)*2.0


func floor_material(trail:bool)->ShaderMaterial:
 var mat=ShaderMaterial.new();mat.shader=preload("res://materials/woodland_floor.gdshader")
 mat.set_shader_parameter("litter",load("res://art/environment/exterior/detail/forest_Diffuse.jpg"));mat.set_shader_parameter("normal_tex",load("res://art/environment/exterior/detail/forest_nor_gl.jpg"));mat.set_shader_parameter("trail",trail)
 return mat
func forest_details(rng:RandomNumberGenerator,bark:Material):
 var ground=SurfaceTool.new();ground.begin(Mesh.PRIMITIVE_TRIANGLES)
 for x in range(-152,-96):
  for station in range(924,966):
   for q in [Vector2(x,station),Vector2(x+1,station+1),Vector2(x+1,station),Vector2(x,station),Vector2(x,station+1),Vector2(x+1,station+1)]:
    ground.add_vertex(Vector3(q.x,land.terrain_height(q.x,q.y)+.04,-q.y))
 ground.generate_normals();var floor_mesh=MeshInstance3D.new();add_child(floor_mesh);floor_mesh.name="ForestLitter";floor_mesh.mesh=ground.commit();floor_mesh.material_override=floor_material(false)
 # One fern mesh reused in clusters, with paired leaflets along curved fronds.
 var fern=SurfaceTool.new();fern.begin(Mesh.PRIMITIVE_TRIANGLES)
 for arm in 7:
  var angle=arm*TAU/7;var dir=Vector3(cos(angle),0,sin(angle));var side=Vector3(-sin(angle),0,cos(angle))
  for k in range(1,9):
   var t=k/9.0;var centre=dir*t*.65+Vector3.UP*(sin(t*PI)*.32+.10)
   for sign_value in [-1,1]:
    var tip=centre+side*sign_value*(1-t)*.22+dir*.10
    for v in [centre-dir*.04,tip,centre+dir*.06]:fern.set_color(Color(.12+.05*t,.29+.07*t,.065));fern.add_vertex(v)
 fern.generate_normals();var shared=fern.commit();var green=StandardMaterial3D.new();green.vertex_color_use_as_albedo=true;green.cull_mode=BaseMaterial3D.CULL_DISABLED;green.roughness=.95;shared.surface_set_material(0,green)
 var transforms:Array[Transform3D]=[]
 for i in 340:
  var x=rng.randf_range(-151,-97);var station=rng.randf_range(925,965)
  if absf(station-trail_s(x))<1.4:continue
  transforms.append(Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.7,1.4)),Vector3(x,land.terrain_height(x,station)+.07,-station)))
 var batch=MultiMeshInstance3D.new();add_child(batch);batch.name="FernClusters";batch.multimesh=MultiMesh.new();batch.multimesh.transform_format=MultiMesh.TRANSFORM_3D;batch.multimesh.mesh=shared;batch.multimesh.instance_count=transforms.size()
 for i in transforms.size():batch.multimesh.set_instance_transform(i,transforms[i])
 batch.visibility_range_end=65;batch.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
 # One fallen tree per roughly 56 x 42 metre forest patch.
 var fallen=preload("res://scripts/fallen_tree.gd").new();add_child(fallen)
 var x=-123.0;var station=952.0
 fallen.position=Vector3(x,land.terrain_height(x,station)+.30,-station)
 fallen.rotation.y=.25

func blueberry_patch(rng:RandomNumberGenerator):
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 var author=preload("res://scripts/residential_tree.gd")
 for i in 9:
  var a=i*2.399;var root=Vector3(cos(a)*.15,0,sin(a)*.15);var tip=root+Vector3(cos(a)*.18,.30+(i%3)*.07,sin(a)*.18)
  st.set_color(Color(.18,.30,.08));author.tube_mesh(st,root,tip,.009,.003)
  for k in 5:
   var q=root.lerp(tip,.2+k*.16);var side=Vector3(-sin(a),.2,cos(a))*(1 if k%2 else -1)
   var end=q+side*.085;var u=Vector3(cos(a),0,sin(a))*.034
   for v in [q,end+u,end+side*.065,q,end+side*.065,end-u]:st.set_color(Color(.16,.38,.07).lerp(Color(.38,.49,.12),float(k)/5));st.add_vertex(v)
  var berry=tip-Vector3(0,.075,0)
  for face in 8:
   var angle=(face%4)*PI/2;var top=berry+Vector3.UP*(.028 if face<4 else -.028)
   for v in [top,berry+Vector3(cos(angle),0,sin(angle))*.028,berry+Vector3(cos(angle+PI/2),0,sin(angle+PI/2))*.028]:st.set_color(Color(.16,.20,.39));st.add_vertex(v)
 st.generate_normals();var mesh=st.commit();var mat=StandardMaterial3D.new();mat.vertex_color_use_as_albedo=true;mat.cull_mode=BaseMaterial3D.CULL_DISABLED;mat.roughness=.95;mesh.surface_set_material(0,mat)
 var poses:Array[Transform3D]=[]
 for i in 650:
  var x=rng.randf_range(-151,-97);var station=rng.randf_range(925,965)
  if absf(station-trail_s(x))<1.25:continue
  if sin(x*.6+station*.3)<-.25:continue
  poses.append(Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.85,1.45)),Vector3(x,land.terrain_height(x,station)+.06,-station)))
 var batch=MultiMeshInstance3D.new();add_child(batch);batch.name="BlueberryUndergrowth";batch.multimesh=MultiMesh.new();batch.multimesh.transform_format=MultiMesh.TRANSFORM_3D;batch.multimesh.mesh=mesh;batch.multimesh.instance_count=poses.size()
 for i in poses.size():batch.multimesh.set_instance_transform(i,poses[i])
 batch.visibility_range_end=65;batch.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF

func mushroom_clusters(rng:RandomNumberGenerator):
 var stem=CylinderMesh.new();stem.top_radius=.025;stem.bottom_radius=.035;stem.height=.18;stem.radial_segments=6
 var cap=SphereMesh.new();cap.radius=.13;cap.height=.10;cap.radial_segments=10;cap.rings=5
 var cream=material(Color(.71,.62,.42),0,.9);var ochre=material(Color(.55,.22,.055),0,.85)
 var mesh=ArrayMesh.new()
 for item in [[stem,.09,cream],[cap,.20,ochre]]:
  var st=SurfaceTool.new();st.append_from(item[0],0,Transform3D(Basis.IDENTITY,Vector3.UP*item[1]));st.set_material(item[2]);st.commit(mesh)
 var poses:Array[Transform3D]=[]
 for cluster in 48:
  var x=rng.randf_range(-151,-97);var station=rng.randf_range(925,965)
  if absf(station-trail_s(x))<1.7:continue
  for j in 5:
   var q=Vector2(x+rng.randf_range(-.5,.5),station+rng.randf_range(-.5,.5))
   poses.append(Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.65,1.4)),Vector3(q.x,land.terrain_height(q.x,q.y)+.08,-q.y)))
 var batch=MultiMeshInstance3D.new();add_child(batch);batch.name="MushroomColonies";batch.multimesh=MultiMesh.new();batch.multimesh.transform_format=MultiMesh.TRANSFORM_3D;batch.multimesh.mesh=mesh;batch.multimesh.instance_count=poses.size()
 for i in poses.size():batch.multimesh.set_instance_transform(i,poses[i])
 batch.visibility_range_end=55;batch.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
