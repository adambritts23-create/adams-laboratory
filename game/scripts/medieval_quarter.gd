extends "res://scripts/lab_props.gd"
const PLAN=preload("res://scripts/medieval_layout.gd")
var land
var stone:Material
var timber:Material
var cache={}
var finish_cache={}
func module(id:String,p:Vector3,parent:Node3D=self,yaw:float=0):
 if not cache.has(id):cache[id]=load("res://art/environment/medieval/"+id+".gltf")
 var n=cache[id].instantiate();parent.add_child(n);n.position=p;n.rotation.y=yaw
 for mesh in n.find_children("*","MeshInstance3D",true,false):
  mesh.layers=2;mesh.visibility_range_end=290;mesh.visibility_range_end_margin=35
  for i in mesh.mesh.get_surface_count():
   var original=mesh.mesh.surface_get_material(i)
   if not original is StandardMaterial3D:continue
   var key=original.get_instance_id()
   if not finish_cache.has(key):
    var finish=original.duplicate();finish.normal_scale=.35;finish.metallic=0;finish.roughness=.85;finish.texture_filter=BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC;finish_cache[key]=finish
   mesh.set_surface_override_material(i,finish_cache[key])
 return n
func build(l):
 land=l;name="MedievalWaterfront";init_materials()
 stone=ShaderMaterial.new();stone.shader=preload("res://materials/medieval_masonry.gdshader");timber=material(Color(.22,.115,.057),0,.9)
 # The district climbs eight metres from the lake through three inhabited terraces.
 # Keep only two historic buildings; the other plots become small Falu timber homes.
 for row in [20,40,65]:
  for station in [952,965,978,995,1020,1045,1073,1087,1114,1130,1145]:
   if station>995:continue
   # Leave an open midsummer lawn beside the canal and irregular gaps in the other rows.
   if (row==65 and station in [1045]) or (row==20 and station in [995,1020,1045,1073,1130]) or (row==40 and station in [978,1020,1045,1073,1114]):continue
   var shift=sin(float(row*17+station))*2.75
   var p=Vector3(row+sin(float(station))*.35,PLAN.level(station+4-shift),-station+shift)
   if row==65 and station in [952,965]:house(p,2,PI/2)
   else:dalarna_house(p,row,station)
 var green=preload("res://scripts/midsummer_green.gd").new();add_child(green);green.build(land,Vector3(38,PLAN.level(1043),-1043))
 land.get_node("VillageGardens").flush_batches()
 # Courtyards and landings create close, irregular blocks rather than isolated houses.
 for s in [965,1020,1073,1130]:
  ribbon(Vector3(17,PLAN.level(s)+.04,-s+5),Vector3(42,PLAN.level(s)+.04,-s+5),3.4,stone,true)
 for x in [18,62]:
  for s in [983,1025,1075,1139]:
   var flag=preload("res://scripts/swedish_flag.gd").new();add_child(flag);flag.position=Vector3(x,PLAN.level(s),-s);flag.scale=Vector3.ONE*.55;flag.build()
 # A broad sloping carriage lane stays smooth; a neighbouring flight has visible treads.
 for s in range(948,1152,2):
  ribbon(Vector3(29,PLAN.level(s)+.035,-s),Vector3(29,PLAN.level(s+2)+.035,-s-2),5,stone,true)
  ribbon(Vector3(76,PLAN.level(s)+.035,-s),Vector3(76,PLAN.level(s+2)+.035,-s-2),4,stone,true)
 for flight in [[980,1000],[1025,1045],[1075,1095]]:
  for s in range(flight[0],flight[1]):
   var y=PLAN.level(s+1)
   box(Vector3(33.7,y-.09,-s-.5),Vector3(3.7,.18,1),stone)
  ribbon(Vector3(33.7,PLAN.level(flight[0])+.06,-flight[0]),Vector3(33.7,PLAN.level(flight[1])+.06,-flight[1]),3.8,stone,true)
 for s in [1010,1060,1100]:
  var h=PLAN.level(s)+.10
  if s==1010:ribbon(Vector3(8,-47.97,-s),Vector3(27,h,-s),5.5,stone,true)
  else:
   # Upper terraces are reached by the gently sloping lane. Direct shortcuts are stairs.
   ribbon(Vector3(8,-47.97,-s),Vector3(27,h,-s),2.8,stone,true)
   for step in 38:
    var x=8+(step+.5)*.5;var y=lerpf(-47.97,h,(step+1)/38.0)
    box(Vector3(x,y-.08,-s),Vector3(.5,.16,2.8),stone)
   for x in [9,26]:
    for side in [-1,1]:cylinder(Vector3(x,lerpf(-47.97,h,(x-8)/19)+.45,-s+side*1.35),.07,.9,dark)
  ribbon(Vector3(27,h,-s),Vector3(78,h,-s),5.5,stone,true)
  box(Vector3(48,h-.40,-s),Vector3(10,.8,5.5),stone,true)
  for side in [-1,1]:
   box(Vector3(48,h+.45,-s+side*3.0),Vector3(11,.9,.30),stone,true)
   for x in [42.5,53.5]:box(Vector3(x,h+.65,-s+side*3),Vector3(.65,1.3,.65),stone,true)
  label_at("GAMLA HAMNEN",Vector3(11,h+2,-s-3.5),36,Color(.86,.78,.56),.015).rotation.y=PI/2
 canal()
 for s in [968,1018,1068,1136]:
  var h=PLAN.level(s)
  # Modest village lighting replaces the medieval street clutter.
  lamp(Vector3(27,h,-s))
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=8 if n.get_meta("lake_surface",false) else 2
 batch_modules()
func ribbon(a:Vector3,b:Vector3,width:float,mat:Material,collision:bool):
 var side=(b-a).cross(Vector3.UP).normalized()*width*.5
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 land.tri(st,a-side,b+side,a+side);land.tri(st,a-side,b-side,b+side)
 if collision and is_equal_approx(a.x,b.x) and (is_equal_approx(a.x,29) or is_equal_approx(a.x,76) or is_equal_approx(a.x,33.7)):
  for sign_value in [-1,1]:
   var inner_a=a+side*sign_value;var inner_b=b+side*sign_value
   var outer_a=inner_a+side.normalized()*.55*sign_value;var outer_b=inner_b+side.normalized()*.55*sign_value
   outer_a.y=land.terrain_height(outer_a.x,-outer_a.z)+.005;outer_b.y=land.terrain_height(outer_b.x,-outer_b.z)+.005
   if sign_value>0:land.tri(st,inner_a,inner_b,outer_b);land.tri(st,inner_a,outer_b,outer_a)
   else:land.tri(st,inner_a,outer_b,inner_b);land.tri(st,inner_a,outer_a,outer_b)
 st.generate_normals()
 var mesh=MeshInstance3D.new();mesh.mesh=st.commit();mesh.material_override=mat;add_child(mesh)
 if collision:mesh.create_trimesh_collision()
 return mesh
func house(p:Vector3,floors:int,yaw:float):
 var group=Node3D.new();add_child(group);group.position=p;group.rotation.y=yaw
 var base_y=PLAN.level(-p.z-4)
 if p.y>base_y+.1:
  var foundation=box(Vector3(p.x,base_y+(p.y-base_y)*.5,p.z),Vector3(6.2,p.y-base_y,6.2),stone,true)
 # Hidden solid envelope prevents walking through the dressed modular facade.
 var hull=box(Vector3(0,floors*1.5,0),Vector3(5.9,floors*3,5.9),stone,true);hull.get_child(1).hide()
 remove_child(hull);group.add_child(hull)
 for floor in floors:
  for face in 4:
   var angle=face*PI/2
   var basis=Basis(Vector3.UP,angle)
   for col in [-2,0,2]:
    var wp=basis*Vector3(col,floor*3,3)
    var doorway=floor==0 and face==0 and col==0
    module("Wall_UnevenBrick_Door_Round" if doorway else ("Wall_UnevenBrick_Window_Thin_Round" if floor==0 else "Wall_Plaster_Window_Wide_Round"),wp,group,angle)
    module("Door_1_Round" if doorway else ("Window_Thin_Round1" if floor==0 else "Window_Wide_Round1"),wp,group,angle)
    if floor>0 and col!=0:module("WindowShutters_Wide_Round_Open",wp,group,angle)
 module("Roof_RoundTiles_6x6",Vector3(0,floors*3,0),group)
 for side in [-1,1]:module("Roof_Front_Brick6",Vector3(0,floors*3,side*3),group,0 if side==1 else PI)
 module("Prop_Chimney2",Vector3(-1,floors*3+2,-1),group)
 module("Roof_Dormer_RoundTile",Vector3(1,floors*3+1.4,1.8),group)
 for col in [-2,0,2]:module("Balcony_Cross_Straight",Vector3(col,3,3),group)
 for side in [-1,1]:module("Balcony_Cross_Straight",Vector3(side*3,3,3),group,side*PI/2)
 var deck=box(Vector3(0,2.9,3.55),Vector3(6.2,.22,1.25),timber);remove_child(deck);group.add_child(deck)
 for x in [-2,2]:module("Prop_Support",Vector3(x,1.1,3),group)
 module("Prop_Vine1",Vector3(-2.6,5.8,3.18),group)
 module("Prop_Vine2",Vector3(2.9,floors*3,2),group,PI/2)
 # Stone threshold stair has a smooth ramp collider for the first-person controller.
 # Module door threshold is at grade, leaving the main lane unobstructed.
 for x in [-2.5,2.5]:
  var pot=cylinder(Vector3(x,.25,3.6),.28,.5,material(Color(.45,.23,.13),0,.9));remove_child(pot);group.add_child(pot)
  var shrub=ellipsoid(Vector3(x,.65,3.6),Vector3(.45,.45,.45),material(Color(.19,.30,.065),0,1));remove_child(shrub);group.add_child(shrub)
func lamp(p:Vector3):
 cylinder(p+Vector3(0,1.3,0),.055,2.6,dark)
 box(p+Vector3(0,2.6,0),Vector3(.32,.48,.32),material(Color(1,.57,.18),0,.8,.65))
 box(p+Vector3(0,2.88,0),Vector3(.46,.08,.46),dark)
func canal():
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for index in PLAN.CANAL.size()-1:
  var a=PLAN.CANAL[index];var b=PLAN.CANAL[index+1]
  var side=Vector2(-(b-a).y,(b-a).x).normalized()
  var corners=[a-side*4.2,a+side*4.2,b-side*4.2,b+side*4.2]
  for i in [0,3,1,0,2,3]:
   var v=corners[i];st.set_color(Color(2.15,0,0,1));st.set_normal(Vector3.UP);st.set_uv(Vector2(v.x,-v.y));st.add_vertex(Vector3(v.x,-49.05,-v.y))
  var count=int(ceil(a.distance_to(b)/3))
  for j in count:
   var v=a.lerp(b,(j+.5)/count);var s=v.y;var h=PLAN.level(s)
   for sign_value in [-1,1]:
    var q=v+side*sign_value*4.65
    var wall=box(Vector3(q.x,(h-51.2)/2,-q.y),Vector3(.55,h+51.2,a.distance_to(b)/count+.07),stone,true)
    wall.rotation.y=atan2((b-a).x,-(b-a).y)
    if absf(s-1010)<3.5 or absf(s-1060)<3.5 or absf(s-1100)<3.5:continue
    var rail=box(Vector3(q.x,h+.45,-q.y),Vector3(.15,.9,a.distance_to(b)/count+.06),timber,true);rail.rotation.y=wall.rotation.y
 var water=MeshInstance3D.new();water.mesh=st.commit();water.material_override=land.get_node("TownLakeAndMeadow").water_material;water.set_meta("lake_surface",true);water.layers=8;water.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;add_child(water)

func batch_modules():
 var groups={}
 for n in find_children("*","MeshInstance3D",true,false):
  if n.visibility_range_end!=290:continue
  var key=str([n.mesh.get_instance_id(),floori(n.global_position.z/32),floori(n.global_position.x/24)])
  if not groups.has(key):groups[key]=[]
  groups[key].append(n)
 for nodes in groups.values():
  if nodes.size()<2:continue
  var multi=MultiMesh.new();multi.transform_format=MultiMesh.TRANSFORM_3D
  multi.mesh=nodes[0].mesh.duplicate()
  for i in multi.mesh.get_surface_count():multi.mesh.surface_set_material(i,nodes[0].get_active_material(i))
  multi.instance_count=nodes.size()
  var instance=MultiMeshInstance3D.new();add_child(instance);instance.multimesh=multi;instance.layers=2;instance.visibility_range_end=290;instance.visibility_range_end_margin=35
  for i in nodes.size():multi.set_instance_transform(i,global_transform.affine_inverse()*nodes[i].global_transform);nodes[i].queue_free()

func dalarna_house(p:Vector3,row:int,station:int):
 var first=land.get_child_count()
 land.cottage(p,5.7,6.2,Color(.50,.055,.035),2 if station%3==0 else 1)
 var roots=land.get_children().slice(first)
 var group=Node3D.new();add_child(group);group.name="DalarnaTimberHouse";group.position=p
 for node in roots:node.reparent(group)
 var walls=roots[0]
 for mesh in walls.get_children():
  if mesh is MeshInstance3D:mesh.material_override=land.get_node("VillageGardens").falu
 group.rotation.y=(PI/2 if row!=40 else -PI/2)+sin(float(station*7+row))*.15
 var garden=land.get_node("VillageGardens")
 # Fence short private garden edges, with clear front paths and bridge approaches.
 for offset in [-4.3,4.3]:
  var a=p+Vector3(-3.5,0,offset);var b=p+Vector3(3.5,0,offset)
  if not garden.cross_street(a):garden.fence(a,b)
 for offset in [-3.5,3.5]:
  var q=p+Vector3(offset,0,3.8)
  if not garden.cross_street(q):garden.bush(q,.7,true)
 if station in [978,1045,1130] and row in [20,65]:
  var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=p+Vector3(-4 if row==20 else 5,0,-4.5);tree.scale=Vector3.ONE*.6
 var lower=PLAN.level(station-4)
 if p.y>lower+.15:box(p-Vector3.UP*(p.y-lower)*.5,Vector3(5.8,p.y-lower,6.3),stone,true)
