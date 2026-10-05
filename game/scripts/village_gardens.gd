extends "res://scripts/lab_props.gd"
# Mixed village: landscaped contemporary centre, traditional timber farmsteads at the edge.
var land
var batches:Dictionary={}
var shrub_mesh:Mesh
var flower_mesh:SphereMesh

var falu:Material
var timber:Material
var rng=RandomNumberGenerator.new()
var lawn_bounds=[]
var rail_batches={}
static var botanical_meshes={}
func botanical(kind:int,lod:int=0)->Mesh:
 var key=Vector2i(kind,lod)
 if not botanical_meshes.has(key):
  var maker=preload("res://scripts/botanical_trial.gd").new();botanical_meshes[key]=maker.plant_mesh(kind,lod);maker.free()
 return botanical_meshes[key]

func build(landscape):
 land=landscape;name="VillageGardens";init_materials();rng.seed=66290
 flower_mesh=SphereMesh.new();flower_mesh.radial_segments=10;flower_mesh.rings=5;flower_mesh.radius=1;flower_mesh.height=2
 shrub_mesh=leaf_cluster()
 falu=ShaderMaterial.new();falu.shader=preload("res://materials/falu_timber.gdshader");falu.set_shader_parameter("wood_image",load("res://art/environment/exterior/pbr/wood_planks_grey_diff.jpg"));timber=land.outdoor_material(Color(.70,.59,.45),1)
 # The centre's existing buildings and civic square are retained.
 for i in 8:
  var s=620+i*31
  for side in [-1,1]:
   if s>735 and s<810 and side==1:continue
   garden(Vector3(-28,-48,-790) if side==-1 and s==775 else Vector3(side*18,-48,-s),9,12)
 for i in 6:
  for side in [-1,1]:
   var s=630+i*40
   if side==1 and abs(s-748)<30:continue
   if side==-1 and abs(s-774)<30:continue
   garden(Vector3(85,-48,-967) if side==1 and i==5 else Vector3(side*49,-48,-s),11,13)
 for p in preload("res://scripts/medieval_layout.gd").modern_plots():
  garden(p,10,13)
  if int(-p.z)%3==0:
   var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=p+Vector3(-6.3,0,-7);tree.scale=Vector3.ONE*.65
 # Traditional cluster outside the modern centre, well clear of 5C and its access road.
 for spec in [Vector3(-112,-48,-690),Vector3(-139,-48,-796),Vector3(-113,-48,-1080)]:
  farmstead(spec)
 home_planting();forest_edge()
 square_planting();woodland();mountains();flush_batches()
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
func instance(kind:String,p:Vector3,scale_value:Vector3,color:Color):
 var key=kind+"_"+str(int(floor(p.x/24)))+"_"+str(int(floor(p.z/24)))
 if not batches.has(key):batches[key]={"kind":kind,"transforms":[],"colors":[]}
 batches[key].transforms.append(Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(scale_value),p));batches[key].colors.append(color)
func flush_batches():
 for key in batches:
  var data=batches[key];var is_plant=data.kind.begins_with("plant")
  var origin:Vector3=data.transforms[0].origin
  for lod in (2 if is_plant else 1):
   var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_colors=true
   mm.mesh=botanical(int(data.kind.trim_prefix("plant")),lod) if is_plant else shrub_mesh if data.kind=="leaf" else flower_mesh
   mm.instance_count=data.transforms.size()
   for i in mm.instance_count:
    var pose:Transform3D=data.transforms[i];pose.origin-=origin;mm.set_instance_transform(i,pose);mm.set_instance_color(i,data.colors[i])
   var node=MultiMeshInstance3D.new();node.multimesh=mm;node.position=origin
   var mat=StandardMaterial3D.new();mat.vertex_color_use_as_albedo=true;mat.roughness=.95;mat.cull_mode=BaseMaterial3D.CULL_DISABLED;node.material_override=mat
   node.layers=2;node.visibility_range_begin=24 if lod==1 else 0;node.visibility_range_end=24 if is_plant and lod==0 else 85
   node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;add_child(node)
 batches.clear()
 var rail_mesh=CylinderMesh.new();rail_mesh.top_radius=1;rail_mesh.bottom_radius=1;rail_mesh.height=1;rail_mesh.radial_segments=6;rail_mesh.rings=1
 for cell in rail_batches:
  var poses=rail_batches[cell];var node=MultiMeshInstance3D.new();add_child(node);node.name="Gärdesgård"
  node.multimesh=MultiMesh.new();node.multimesh.transform_format=MultiMesh.TRANSFORM_3D;node.multimesh.mesh=rail_mesh;node.multimesh.instance_count=poses.size()
  for i in poses.size():node.multimesh.set_instance_transform(i,poses[i])
  node.material_override=timber;node.layers=2;node.visibility_range_end=200;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
 rail_batches.clear()
func bush(p:Vector3,size_value:float,roses:bool=false):
 if preload("res://scripts/town_exit.gd").corridor(p.x,-p.z):return
 instance("plant1" if roses else "plant0",p,Vector3.ONE*size_value,Color.WHITE)
func hedge(a:Vector3,b:Vector3):
 var count=maxi(1,int(a.distance_to(b)/1.2))
 for i in count+1:
  var p=a.lerp(b,float(i)/count)
  if cross_street(p):continue
  bush(p,.85)
func cross_street(p:Vector3)->bool:
 if preload("res://scripts/town_exit.gd").corridor(p.x,-p.z):return true
 if Vector2(p.x,p.z+765).length()<13.3:return true
 for s in [675,765,855,920,1010,1100]:
  if absf(p.z+s)<5.5 and absf(p.x)<77:return true
 return false
func garden(p:Vector3,w:float,d:float):
 var half=w*.5+4.5;var front=d*.5+6.0;var back=-d*.5-5.0
 if absf(p.x)<30:half=minf(half,absf(p.x)-9.75)
 for road in [675,765,855,920,1010,1100]:
  if absf(p.z+road)<d*.5+12:front=d*.5+3.3;back=-d*.5-2.4
 var rect=Rect2(Vector2(p.x-half,p.z+back),Vector2(half*2,front-back));lawn_bounds.append(rect)
 land.set_meta("lawn_bounds",lawn_bounds)
 var turf=material(Color(.19,.30,.075),0,.96)
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for z in range(int(back),int(ceil(front))):
  for x in range(int(-half),int(ceil(half))):
   var q=p+Vector3(x+.5,0,z+.5)
   if cross_street(q):continue
   for v in [Vector3(-.5,0,-.5),Vector3(.5,0,-.5),Vector3(.5,0,.5),Vector3(-.5,0,-.5),Vector3(.5,0,.5),Vector3(-.5,0,.5)]:
    var vertex=q+v;vertex.y=land.terrain_height(vertex.x,-vertex.z)+.018;st.add_vertex(vertex)
 st.generate_normals();var lawn=MeshInstance3D.new();add_child(lawn);lawn.mesh=st.commit();lawn.material_override=turf;lawn.name="MownLawn";lawn.layers=2
 var left=-half+rng.randf_range(-.15,.85);var right=half-rng.randf_range(0,.8)
 var theme=rng.randi_range(0,3);var favoured=-1 if rng.randf()<.5 else 1
 # Full hedge boundaries retain a clear entrance gap.
 for edge in [left,right]:
  if signf(edge)==-signf(p.x):
   hedge(p+Vector3(edge,0,back),p+Vector3(edge,0,-1.4));hedge(p+Vector3(edge,0,1.4),p+Vector3(edge,0,front))
  else:hedge(p+Vector3(edge,0,back),p+Vector3(edge,0,front))
 hedge(p+Vector3(left,0,back),p+Vector3(right,0,back))
 hedge(p+Vector3(left,0,front),p+Vector3(-1.6,0,front))
 hedge(p+Vector3(1.6,0,front),p+Vector3(right,0,front))
 # Split-rail boundaries sit beyond the hedges, with both entrances open.
 var fl=left-.9;var fr=right+.9;var fb=back-.9;var ff=front+.9
 for edge in [fl,fr]:
  if signf(edge)==-signf(p.x):
   fence(p+Vector3(edge,0,fb),p+Vector3(edge,0,-1.5));fence(p+Vector3(edge,0,1.5),p+Vector3(edge,0,ff))
  else:fence(p+Vector3(edge,0,fb),p+Vector3(edge,0,ff))
 fence(p+Vector3(fl,0,fb),p+Vector3(fr,0,fb))
 fence(p+Vector3(fl,0,ff),p+Vector3(-1.6,0,ff));fence(p+Vector3(1.6,0,ff),p+Vector3(fr,0,ff))
 if not cross_street(p+Vector3(0,0,front)):
  box(p+Vector3(0,.012,d*.5+1.8),Vector3(1.8,.024,3.5),concrete)
 for side in [-1,1]:
  var count=rng.randi_range(2,5) if side==favoured else rng.randi_range(1,2)
  for i in count:
   var q=p+Vector3(side*(w*.5-1.3)+rng.randf_range(-.25,.25),0,d*.5+1.1+i*.42)
   if not cross_street(q):bush(q,rng.randf_range(.45,.74),side==favoured or theme==3)
 for i in range(1+theme%3):
  var q=p+Vector3(favoured*rng.randf_range(2.0,w*.5+.8),0,d*.5+rng.randf_range(1,2.7))
  if not cross_street(q):flower_patch(q,rng.randf_range(.4,.85),theme+i)
 # An offset window box, climbing trellis or porch seat changes the house frontage.
 var q=p+Vector3(favoured*w*.29,.95,d*.5+.23)
 if theme in [0,2]:
  box(q,Vector3(1.30,.20,.35),material(Color(.30,.22,.14),0,.9))
  flower_patch(q+Vector3.UP*.14,.48,theme)
 elif theme==1:
  var t=p+Vector3(favoured*(w*.5-.5),0,d*.5+.14)
  for x in [-.34,0,.34]:box(t+Vector3(x,1.2,0),Vector3(.035,2.4,.035),timber)
  for y in [.4,.8,1.2,1.6,2.0]:box(t+Vector3(0,y,0),Vector3(.72,.035,.035),timber)
  for y in [.3,.85,1.4]:bush(t+Vector3(0,y,.12),.36,true)
 else:
  box(p+Vector3(favoured*2.5,.46,d*.5+.9),Vector3(1.15,.10,.42),timber)
  for x in [-.44,.44]:box(p+Vector3(favoured*2.5+x,.22,d*.5+.9),Vector3(.07,.44,.32),metal)
 if rng.randf()<.7:
  var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree)
  tree.position=p+Vector3(left+.7 if favoured==1 else right-.7,0,back+rng.randf_range(.7,1.6));tree.scale=Vector3.ONE*rng.randf_range(.48,.75);tree.rotation.y=rng.randf()*TAU
func flower_patch(p:Vector3,radius:float,theme:int):
 # Interwoven drifts: roses rise above compact daisies and blue wildflowers.
 for i in 10:
  var a=i*2.399+theme*.7;var r=sqrt(rng.randf())*radius*.70
  var q=p+Vector3(cos(a)*r,0,sin(a)*r*.72)
  if cross_street(q):continue
  var kind=1 if i%5==0 else 2+posmod(theme+i,2)
  var size=rng.randf_range(.38,.53) if kind==1 else rng.randf_range(.65,1.0)
  instance("plant"+str(kind),q,Vector3.ONE*size,Color.WHITE)
func fence(a:Vector3,b:Vector3):
 var count=maxi(1,int(a.distance_to(b)/1.8));var direction=(b-a).normalized();var side=direction.cross(Vector3.UP)*.09
 for i in count+1:
  var p=a.lerp(b,float(i)/count)
  if cross_street(p):continue
  for offset in [-side,side]:fence_rail(p+offset,p+offset+Vector3(.06,1.35,0),.035,timber)
  if i<count:
   var q=a.lerp(b,float(i+1)/count)
   if cross_street(q):continue
   for y in [.25,.47,.69]:fence_rail(p+Vector3.UP*y,q+Vector3.UP*(y+.55),.047,timber)
   for y in [.35,.80,1.1]:fence_rail(p-side+Vector3.UP*y,p+side+Vector3.UP*y,.025,timber)
func farmstead(p:Vector3):
 var house=Node3D.new();add_child(house);house.name="DalarnaFarmstead"
 # Use existing cottage proportions with falu timber cladding and white corner boards.
 var first=land.get_child_count();land.cottage(p,9,11,Color(.52,.075,.045))
 var walls=land.get_child(first)
 if walls is StaticBody3D:
  for n in walls.get_children():
   if n is MeshInstance3D:n.material_override=falu
 for z in [-5.55,5.55]:
  for j in 36:box(p+Vector3(-4.4+j*.25,1.55,z),Vector3(.035,3.1,.035),falu)
 for x in [-4.55,4.55]:
  for j in 44:box(p+Vector3(x,1.55,-5.4+j*.25),Vector3(.035,3.1,.035),falu)
 garden(p,9,11)
 fence(p+Vector3(-11,0,-11),p+Vector3(-11,0,12));fence(p+Vector3(11,0,-11),p+Vector3(11,0,12))
 fence(p+Vector3(-11,0,-11),p+Vector3(11,0,-11))
 fence(p+Vector3(-11,0,12),p+Vector3(-2,0,12));fence(p+Vector3(2,0,12),p+Vector3(11,0,12))
 harbre(p+Vector3(18,0,-3))
func harbre(p:Vector3):
 # Raised log store: stone feet, projecting lower beams, broad gable roof, short stair.
 for x in [-1.5,1.5]:
  for z in [-1.4,1.4]:
   box(p+Vector3(x,.24,z),Vector3(.75,.48,.7),concrete,true)
   box(p+Vector3(x,.68,z),Vector3(.26,.88,.26),timber)
 box(p+Vector3.UP*2.0,Vector3(4,2.3,3.7),falu,true)
 for row in 12:
  var y=.96+row*.19
  for z in [-1.90,1.90]:tube(p+Vector3(-2.16,y,z),p+Vector3(2.16,y,z),.11,falu)
  for x in [-2.0,2.0]:tube(p+Vector3(x,y,-2.04),p+Vector3(x,y,2.04),.11,falu)
 land.roof(p+Vector3.UP*3.17,5.1,4.8,1.55,land.outdoor_material(Color(.20,.16,.12),1))
 box(p+Vector3(0,1.8,1.97),Vector3(.9,1.75,.12),timber)
 for i in 4:box(p+Vector3(0,.115*(i+1),3.0-i*.30),Vector3(1.2,.23*(i+1),.33),timber,true)
func woodland():
 var pine=null
 for i in 150:
  var x=rng.randf_range(-185,185);var s=rng.randf_range(605,1195)
  if absf(x)<85 or land.lake_radius(x,s)<1.3 or land.reference_plot(x,s):continue
  if x< -75 and s>900 and s<1030:continue
  var p=Vector3(x,land.terrain_height(x,s),-s)
  var near_farm=false
  for farm in [Vector3(-112,-48,-690),Vector3(-139,-48,-796),Vector3(-113,-48,-1080)]:
   if p.distance_to(farm)<30:near_farm=true
  if near_farm:continue
  if i%3==0:
   var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=p;tree.scale=Vector3.ONE*rng.randf_range(.9,1.6)
  else:land.tree_at(pine,p,rng.randf_range(.9,1.55),rng.randf()*TAU)
  for j in 3:bush(p+Vector3(rng.randf_range(-4,4),0,rng.randf_range(-4,4)),rng.randf_range(.7,1.4))
func mountains():
 # A distant uneven skyline, outside the playable valley; colour fades with distance.
 for band in 2:
  var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
  for i in 70:
   for row in 5:
    var x=-1400+i*40;var z=-1660-band*290-row*100
    var vertices=[]
    for offset in [Vector2(0,0),Vector2(40,0),Vector2(40,-100),Vector2(0,-100)]:
     var xx=x+offset.x;var zz=z+offset.y
     var envelope=sin(clampf((float(row)-offset.y/100)/5.0,0,1)*PI)
     var peak=105+55*sin(xx*.009+band*2)+28*sin(xx*.023)+14*cos(xx*.047)
     vertices.append(Vector3(xx,-48+maxf(0,peak)*envelope,zz))
    for k in [0,2,1,0,3,2]:
     var v=vertices[k];st.set_color(Color(.23,.29,.30).lerp(Color(.54,.59,.61),clampf((v.y-80)/190.0,0,1)));st.add_vertex(v)
  st.index();st.generate_normals()
  var mesh=MeshInstance3D.new();mesh.mesh=st.commit();var mat=ShaderMaterial.new();mat.shader=preload("res://materials/distant_mountain.gdshader");mesh.material_override=mat;mesh.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;add_child(mesh)


func leaf_cluster()->Mesh:
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for i in 48:
  var a=i*2.399;var y=1.0-2.0*(i+.5)/48;var radius=sqrt(1-y*y)
  var p=Vector3(cos(a)*radius,y,sin(a)*radius)*.75
  var u=Vector3(cos(a+.8),.35,sin(a+.8))*.34;var v=Vector3(-sin(a+.8),.15,cos(a+.8))*.18
  for point in [p-u,p-v,p+Vector3.UP*.06,p-v,p+u,p+Vector3.UP*.06,p+u,p+v,p+Vector3.UP*.06,p+v,p-u,p+Vector3.UP*.06]:st.add_vertex(point)
 st.generate_normals();return st.commit()

func square_planting():
 for p in [Vector3(14,-48,-737),Vector3(40,-48,-739),Vector3(40,-48,-755)]:
  box(p+Vector3.UP*.18,Vector3(3.2,.36,2.1),concrete)
  box(p+Vector3.UP*.37,Vector3(2.95,.03,1.85),material(Color(.13,.09,.045),0,1))
  for x in [-.9,0,.9]:bush(p+Vector3(x,.38,0),.85,true)
 for p in [Vector3(40,-48,-746),Vector3(14,-48,-748)]:
  var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=p;tree.scale=Vector3.ONE*.9

func home_planting():
 # Compact rose islands, with open grass between them and a clear pond margin.
 for centre in [Vector2(-31,-990),Vector2(-16,-992),Vector2(-32,-939),Vector2(-13,-935),Vector2(-11,-966)]:
  for i in 16:
   var angle=i*2.4;var r=.6+sqrt(float(i))*.65
   var x=centre.x+cos(angle)*r;var z=centre.y+sin(angle)*r
   var p=Vector3(x,land.terrain_height(x,-z),z)
   bush(p,rng.randf_range(.65,.95),true)
   if i%3==0:flower_patch(p+Vector3(.8,0,.8),.5,2)
 var pond=preload("res://scripts/country_meadow.gd").new();add_child(pond);pond.init_materials();pond.pond(land,Vector3(-24,970,4.2));pond.position.y=.38
 for x in [-73,-80,-88]:
  for z in range(-995,-925,4):
   bush(Vector3(x+rng.randf_range(-.5,.5),land.terrain_height(x,-z),z),rng.randf_range(1.0,1.5),true)
 for z in [-988,-975,-961,-944,-928]:
  var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=Vector3(-85,-48,z);tree.scale=Vector3.ONE*1.15
func forest_edge():
 var pine=null
 for i in 180:
  var x=rng.randf_range(-95,105);var s=rng.randf_range(1020,1195)
  # Preserve the midsummer clearing, canal, carriage lanes and existing access roads.
  if absf(x)<10 or absf(x-29)<5 or absf(x-76)<5:continue
  if Vector2(x-54,s-1017).length()<7 or Vector2(x-66,s-1068).length()<8:continue
  if Vector2(x-38,s-1043).length()<25:continue
  if absf(s-1100)<5 or absf(s-1010)<6:continue
  var q=Vector3(x,land.terrain_height(x,s),-s)
  land.tree_at(pine,q,rng.randf_range(.9,1.6),rng.randf()*TAU)
  bush(q+Vector3(2,0,1),1.3)

func fence_rail(a:Vector3,b:Vector3,radius:float,_mat:Material):
 var delta=b-a
 var pose=Transform3D(Basis(Quaternion(Vector3.UP,delta.normalized())) * Basis.from_scale(Vector3(radius,delta.length(),radius)),(a+b)*.5)
 var cell=Vector2i(floori(a.x/48),floori(a.z/48))
 if not rail_batches.has(cell):rail_batches[cell]=[]
 rail_batches[cell].append(pose)
