extends "res://scripts/lab_props.gd"
# Exterior-only detail pass, shared meshes and one distance-limited planar water capture.
var landscape
var route
var water:MeshInstance3D
var water_material:ShaderMaterial
var reflection_view:SubViewport
var reflection_camera:Camera3D
const LEVEL:=-49.05
const CENTRE:=Vector3(133,LEVEL,-810)
func _ready():call_deferred("batch_static")
func build(land,r):
 landscape=land;route=r;name="TownLakeAndMeadow";init_materials()
 build_water();build_shore();build_pier();build_meadow();dress_town();background_woodland();cafe_terrace()
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=8 if n.get_meta("lake_surface",false) else 2
func edge_point(angle:float,radius:float)->Vector3:
 var shape=1.0+.06*sin(3*angle)+.025*cos(5*angle)
 return CENTRE+Vector3(cos(angle)*59,0,sin(angle)*125)*radius*shape
func build_water():
 water_material=ShaderMaterial.new();water_material.shader=preload("res://materials/town_lake.gdshader")
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for ring in 48:
  var r0=.962*ring/48.0;var r1=.962*(ring+1)/48.0
  for sector in 160:
   var a=sector*TAU/160;var b=(sector+1)*TAU/160
   var p=edge_point(a,r0);var q=edge_point(b,r0);var u=edge_point(a,r1);var v=edge_point(b,r1)
   for vertex in [p,q,v,p,v,u]:
    var depth=maxf(0,LEVEL-landscape.terrain_height(vertex.x,-vertex.z))
    st.set_color(Color(depth,0,0,1));st.set_normal(Vector3.UP);st.set_uv(Vector2(vertex.x,vertex.z));st.add_vertex(vertex)
 water=MeshInstance3D.new();water.name="LakeWater";water.mesh=st.commit();water.material_override=water_material;water.set_meta("lake_surface",true);water.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;water.layers=8;add_child(water)
 reflection_view=SubViewport.new();reflection_view.name="LakeReflection";reflection_view.size=Vector2i(640,360);reflection_view.render_target_update_mode=SubViewport.UPDATE_DISABLED;reflection_view.handle_input_locally=false;reflection_view.own_world_3d=false;add_child(reflection_view);reflection_view.world_3d=get_world_3d()
 reflection_camera=Camera3D.new();reflection_camera.cull_mask=2|16;reflection_camera.near=.15;reflection_camera.far=1600;reflection_view.add_child(reflection_camera);reflection_camera.current=true
 water_material.set_shader_parameter("reflection_image",reflection_view.get_texture())
func build_shore():
 var rng=RandomNumberGenerator.new();rng.seed=72018
 var stone=aged(Color(.32,.33,.29),Color(.13,.15,.14),0,.8);stone.normal_scale=.65
 var rock_mesh=SphereMesh.new();rock_mesh.radial_segments=10;rock_mesh.rings=6
 for i in 120:
  var a=rng.randf()*TAU;var p=edge_point(a,rng.randf_range(.97,1.09));p.y=landscape.terrain_height(p.x,-p.z)
  var size=rng.randf_range(.12,.65)
  var rock=mesh_node(rock_mesh,p+Vector3.UP*size*.18,Vector3(size*1.7,size*.75,size),stone)
  rock.rotation=Vector3(rng.randf()*.6,rng.randf()*TAU,rng.randf()*.4)
 # Reeds grow in clustered pockets, leaving the west pier and shore view open.
 var reeds=SurfaceTool.new();reeds.begin(Mesh.PRIMITIVE_TRIANGLES)
 for i in 1400:
  var a=rng.randf()*TAU
  if absf(wrapf(a-PI,-PI,PI))<.28:continue
  if sin(a*7)>.4:continue
  var p=edge_point(a,rng.randf_range(.94,1.025));p.y=landscape.terrain_height(p.x,-p.z)
  var h=rng.randf_range(.5,1.45)
  blade(reeds,p,Vector3(rng.randf_range(-.14,.14),h,rng.randf_range(-.14,.14)),.018,Color(.22,.25,.09))
 var reed_node=MeshInstance3D.new();reed_node.mesh=reeds.commit();var reed_mat=ShaderMaterial.new();reed_mat.shader=preload("res://materials/outdoor_foliage.gdshader");reed_mat.set_shader_parameter("grass",true);reed_node.material_override=reed_mat;add_child(reed_node)
 # Native-looking mixed woodland behind the lake, without trees below the waterline.
 var pine=null
 for i in 150:
  var a=rng.randf_range(-2.0,2.0);var p=edge_point(a,rng.randf_range(1.12,1.38))
  if p.x>195 or p.x<82 or landscape.reference_plot(p.x,-p.z):continue
  p.y=landscape.terrain_height(p.x,-p.z)
  if i%3==0:
   var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=p;tree.scale=Vector3.ONE*rng.randf_range(.9,1.65);tree.rotation.y=rng.randf()*TAU
  else:landscape.tree_at(pine,p,rng.randf_range(.8,1.4),rng.randf()*TAU)
func build_pier():
 var timber=ShaderMaterial.new();timber.shader=preload("res://materials/pier_timber.gdshader");timber.set_shader_parameter("timber_image",load("res://art/environment/exterior/pbr/wood_planks_grey_diff.jpg"))
 # Walkway from the town square to a small timber landing on the west bank.
 for x in range(53,69,2):
  var p=Vector3(x,landscape.terrain_height(x,810),-810)
  box(p+Vector3(0,.015,0),Vector3(2.02,.06,3.8),concrete,true)
 var deck=box(Vector3(79.5,-48.02,-810),Vector3(22,.16,3.4),timber,true)
 for child in deck.get_children():
  if child is MeshInstance3D:child.hide()
 for board in 88:
  var x=68.625+board*.25
  box(Vector3(x,-48.02,-810),Vector3(.242,.16,3.4),timber)
  for z in [-811.4,-808.6]:
   if board%16==0:
    cylinder(Vector3(x,-49.7,z),.11,4.1,timber)
    tube(Vector3(x,-47.90,z),Vector3(x,-46.96,z),.045,timber)
 for z in [-811.4,-808.6]:tube(Vector3(69,-46.96,z),Vector3(90,-46.96,z),.045,timber)
 # Physical rail, matching the visible timber without spanning the entrance.
 for z in [-811.5,-808.5]:
  var rail=box(Vector3(80,-47.42,z),Vector3(22,.92,.07),timber,true)
  for child in rail.get_children():
   if child is MeshInstance3D:child.hide()
 var end_rail=box(Vector3(90.45,-47.42,-810),Vector3(.08,.92,3),timber,true)
 for child in end_rail.get_children():
  if child is MeshInstance3D:child.hide()
 tube(Vector3(90.45,-46.96,-811.5),Vector3(90.45,-46.96,-808.5),.045,timber)
 for x in [58,64]:
  for z in [-814,-816]:box(Vector3(x,-47.6,z),Vector3(.08,.8,.08),metal)
  box(Vector3(x,-47.16,-815),Vector3(.65,.12,2.5),timber)
  box(Vector3(x-.32,-46.83,-815),Vector3(.08,.62,2.5),timber)
 plaque("BJÖRKSJÖN / LAKESIDE",Vector3(56,-45.9,-804),Vector2(4.5,.55),0)
 # Gravel walking trail along the west shoreline.
 var trail=SurfaceTool.new();trail.begin(Mesh.PRIMITIVE_TRIANGLES)
 for i in 90:
  var a=PI-.82+i*1.64/90;var b=PI-.82+(i+1)*1.64/90
  var p=edge_point(a,1.12);var q=edge_point(b,1.12);var side=(q-p).cross(Vector3.UP).normalized()*1.25
  for v in [p-side,q+side,p+side,p-side,q-side,q+side]:
   v.y=landscape.terrain_height(v.x,-v.z)+.022;trail.set_uv(Vector2(v.x,v.z)*.4);trail.add_vertex(v)
 trail.generate_normals();var path=MeshInstance3D.new();path.mesh=trail.commit();path.material_override=ShaderMaterial.new();path.material_override.shader=load("res://materials/promenade_cobbles.gdshader");add_child(path)
func blade(st:SurfaceTool,base:Vector3,tip:Vector3,width:float,col:Color):
 var side=Vector3(tip.z+.31,0,-tip.x-.17).normalized()*width
 var middle=base+tip*.58
 for data in [[base-side,0.0],[middle+side*.55,.58],[base+side,0.0],[base-side,0.0],[middle-side*.55,.58],[middle+side*.55,.58],[middle-side*.55,.58],[base+tip,1.0],[middle+side*.55,.58]]:
  st.set_color(col);st.set_uv(Vector2(0,data[1]));st.set_normal(Vector3.UP);st.add_vertex(data[0])
func build_meadow():
 var rng=RandomNumberGenerator.new();rng.seed=22714
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for i in 7:
  var a=i*2.399
  blade(st,Vector3(cos(a)*.10,0,sin(a)*.10),Vector3(cos(a)*.13,rng.randf_range(.18,.43),sin(a)*.13),.035,Color(.11,.18,.045).lerp(Color(.27,.29,.12),rng.randf()))
 var clump=st.commit();var mat=ShaderMaterial.new();mat.shader=preload("res://materials/outdoor_foliage.gdshader");mat.set_shader_parameter("grass",true);clump.surface_set_material(0,mat)
 # Spatial chunks allow short visibility ranges and shared geometry, rather than thousands of nodes.
 for zblock in range(140,1160,64):
  for xblock in range(-128,192,64):
   var transforms:Array[Transform3D]=[]
   for i in 210:
    var x=xblock+rng.randf_range(0,64);var s=zblock+rng.randf_range(0,64)
    if x> -82 and x< -54 and s>832 and s<859:continue # Showroom and forecourt.
    if preload("res://scripts/land_use.gd").no_tall_grass(x,s):continue
    if absf(x-landscape.road_x(s))<7.2:continue
    if s<190 and absf(x)<78:continue
    if s>600 and absf(x)<70:continue
    if landscape.lake_radius(x,s)<1.035:continue
    if x< -53 and s>910 and s<1018:continue
    if x>194 or landscape.reference_plot(x,s):continue
    var p=Vector3(x,landscape.terrain_height(x,s),-s)
    var basis=Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.65,1.45))
    transforms.append(Transform3D(basis,p))
   if transforms.is_empty():continue
   var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.mesh=clump;mm.instance_count=transforms.size()
   for i in transforms.size():mm.set_instance_transform(i,transforms[i])
   var node=MultiMeshInstance3D.new();node.multimesh=mm;node.visibility_range_end=140;node.visibility_range_end_margin=25;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;add_child(node)
func dress_town():
 # Broadleaf verges and small details break up otherwise repeated cottage fronts.
 var rng=RandomNumberGenerator.new();rng.seed=902
 for s in [648,710,835,881,1078,1145]:
  for side in [-1,1]:
   var p=Vector3(side*31,-48,-s)
   if preload("res://scripts/land_use.gd").shopping(p.x,-p.z):continue
   if side<0 and s>910 and s<1015:continue
   var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=p;tree.scale=Vector3.ONE*rng.randf_range(.85,1.3);tree.rotation.y=rng.randf()*TAU
 for s in [645,738,831,997,1090]:
  for side in [-1,1]:
   var p=Vector3(side*8,-48,-s)
   box(p+Vector3.UP*.42,Vector3(1.25,.85,.70),material(Color(.20,.24,.19),.35,.5),true)
   box(p+Vector3.UP*.88,Vector3(1.34,.06,.79),metal)
func _process(_delta):
 if reflection_view==null:return
 var camera=get_viewport().get_camera_3d()
 if camera==null:return
 var sees_water=false
 for point in [CENTRE,CENTRE+Vector3(55,0,0),CENTRE+Vector3(-55,0,0),CENTRE+Vector3(0,0,115),CENTRE+Vector3(0,0,-115)]:
  if camera.is_position_in_frustum(point):sees_water=true
 if not is_visible_in_tree() or not sees_water or camera.global_position.distance_to(CENTRE)>300:
  reflection_view.render_target_update_mode=SubViewport.UPDATE_DISABLED;water_material.set_shader_parameter("reflection_ready",false);return
 var p=camera.global_position;p.y=2*LEVEL-p.y
 var forward=-camera.global_basis.z;forward.y=-forward.y
 reflection_camera.global_position=p;reflection_camera.look_at(p+forward,Vector3.UP)
 reflection_camera.fov=camera.fov+12;reflection_camera.environment=route.outdoor_environment
 var matrix=reflection_camera.get_camera_projection()*Projection(reflection_camera.global_transform.affine_inverse())
 water_material.set_shader_parameter("reflection_matrix",matrix)
 water_material.set_shader_parameter("reflection_ready",true)
 reflection_view.render_target_update_mode=SubViewport.UPDATE_ONCE

func background_woodland():
 var rng=RandomNumberGenerator.new();rng.seed=6308
 var pine=null
 for i in 140:
  var x=rng.randf_range(204,370);var s=rng.randf_range(610,1110)
  var p=Vector3(x,landscape.ridge_height(x,s),-s)
  var tree=landscape.tree_at(pine,p,rng.randf_range(.85,1.6),rng.randf()*TAU)
  for n in tree.find_children("*","MeshInstance3D",true,false):
   n.visibility_range_end=1100;n.visibility_range_end_margin=40;n.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
func cafe_terrace():
 var timber=landscape.outdoor_material(Color(.64,.53,.38),1)
 var iron=material(Color(.09,.105,.11),.6,.45)
 # Small cafe seating area on the existing square, clear of roads and the route to the water.
 for x in [18,24,30]:
  var p=Vector3(x,-48,-777)
  cylinder(p+Vector3.UP*.76,.72,.065,timber)
  cylinder(p+Vector3.UP*.38,.055,.76,iron)
  for side in [-1,1]:
   var seat=p+Vector3(0,0,side*1.02)
   box(seat+Vector3.UP*.43,Vector3(.47,.07,.48),timber)
   box(seat+Vector3(0,.74,side*.22),Vector3(.48,.56,.055),timber)
   for dx in [-.19,.19]:
    for dz in [-.18,.18]:cylinder(seat+Vector3(dx,.21,dz),.022,.42,iron)
  var pot=material(Color(.30,.16,.10),0,.82)
  cylinder(p+Vector3.UP*.84,.085,.12,pot)
  ellipsoid(p+Vector3.UP*.97,Vector3(.11,.08,.11),material(Color(.12,.23,.07),0,.9))
 for z in [-735,-745,-756]:
  var p=Vector3(12,-48,z)
  for dz in [-.7,.7]:box(p+Vector3(0,.35,dz),Vector3(.5,.7,.06),iron)
  for dx in [-.20,0,.20]:box(p+Vector3(dx,.74,0),Vector3(.16,.07,1.9),timber)
  for y in [.93,1.15]:box(p+Vector3(-.29,y,0),Vector3(.065,.15,1.9),timber)
