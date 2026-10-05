extends "res://scripts/lab_props.gd"
var plant_count=0
func build(land):
 name="BotanicalTrial";init_materials()
 var wood=material(Color(.24,.15,.065),0,.95)
 var rng=RandomNumberGenerator.new();rng.seed=1294
 var meshes=[]
 for kind in 4:meshes.append(plant_mesh(kind))
 # Two small display beds beside the trail mouth; the walking route stays open.
 for kind in 4:
  var poses=[]
  for i in (9 if kind<2 else 34):
   var x=-98.0-rng.randf()*5
   var s=(937.0 if kind<2 else 950.0)+rng.randf_range(-1.3,1.3)
   x-=kind%2*4
   var pose=Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.75,1.2)),Vector3(x,land.terrain_height(x,s)+.06,-s))
   poses.append(pose);plant_count+=1
  var node=MultiMeshInstance3D.new();add_child(node);node.name=["LeafyShrubs","LayeredRoses","WhiteDaisies","BlueWildflowers"][kind];node.layers=2
  node.multimesh=MultiMesh.new();node.multimesh.transform_format=MultiMesh.TRANSFORM_3D;node.multimesh.mesh=meshes[kind];node.multimesh.instance_count=poses.size()
  for i in poses.size():node.multimesh.set_instance_transform(i,poses[i])
  node.visibility_range_end=75
 for node in find_children("*","GeometryInstance3D",true,false):node.layers=2
func triangle(st:SurfaceTool,a:Vector3,b:Vector3,c:Vector3,col:Color):
 for p in [a,b,c]:st.set_color(col);st.add_vertex(p)
func leaf(st:SurfaceTool,p:Vector3,dir:Vector3,length:float,col:Color):
 var side=Vector3(-dir.z,0,dir.x).normalized()*length*.32
 var middle=p+dir*length*.52+Vector3.UP*length*.13;var end=p+dir*length
 for sign_value in [-1,1]:
  triangle(st,p,middle+side*sign_value,middle,col)
  triangle(st,middle,middle+side*sign_value,end,col.lightened(.06))
func flower(st:SurfaceTool,p:Vector3,kind:int,rng:RandomNumberGenerator):
 var rose=kind==1;var rings=4 if rose else 1
 for ring in rings:
  var radius=(.13-ring*.026) if rose else .10
  var n=9 if rose else 12 if kind==2 else 6
  var petal_variation=rng.randf()*.20
  var col=Color(.68,.025,.10).lerp(Color(.91,.19,.31),petal_variation) if rose else Color(.92,.91,.78) if kind==2 else Color(.22,.32,.82)
  for i in n:
   var a=i*TAU/n+ring*.4;var dir=Vector3(cos(a),0,sin(a));var side=Vector3(-dir.z,0,dir.x)
   var base=p+Vector3.UP*ring*.025
   var mid=base+dir*radius*.66+Vector3.UP*.035
   var tip=base+dir*radius+Vector3.UP*(.05 if rose else -.01)
   var width=radius*(.54 if rose else .23)
   triangle(st,base,mid-side*width,mid,col.darkened(rng.randf()*.12))
   triangle(st,base,mid,mid+side*width,col)
   triangle(st,mid-side*width,tip,mid,col.lightened(.10))
   triangle(st,mid,tip,mid+side*width,col.lightened(.07))
 if not rose:
  for i in 10:
   var a=i*TAU/10;var b=(i+1)*TAU/10
   triangle(st,p+Vector3.UP*.024,p+Vector3(cos(a)*.025,.019,sin(a)*.025),p+Vector3(cos(b)*.025,.019,sin(b)*.025),Color(.85,.53,.07))
func plant_mesh(kind:int,lod:int=0)->Mesh:
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 var rng=RandomNumberGenerator.new();rng.seed=394+kind
 var author=preload("res://scripts/tree_geometry.gd")
 for branch in (36 if kind==0 else 22 if kind==1 else 5):
  if lod>0 and branch%3!=0:continue
  var a=branch*2.399;var height=rng.randf_range(.5,1.15) if kind<2 else rng.randf_range(.23,.49)
  var end=Vector3(cos(a),0,sin(a))*rng.randf_range(.1,.5 if kind<2 else .17)+Vector3.UP*height
  st.set_color(Color(.23,.20,.085));author.tube_mesh(st,Vector3.ZERO,end,.018 if kind<2 else .005,.003)
  for j in 8:
   if lod>0 and j%2!=0:continue
   var p=end*(.18+j*.10);var yaw=a+j*2.399;var dir=Vector3(cos(yaw),.25,sin(yaw)).normalized()
   leaf(st,p,dir,rng.randf_range(.10,.23) if kind<2 else .075,Color(.045,.16,.035).lerp(Color(.24,.39,.075),rng.randf()))
   if kind==0 and j>2 and lod==0:
    var tip=p+dir*.28
    st.set_color(Color(.19,.22,.07));author.tube_mesh(st,p,tip,.006,.002)
    for k in 3:
     var yaw2=yaw+(k-1)*1.2
     leaf(st,p.lerp(tip,.4+k*.3),Vector3(cos(yaw2),rng.randf_range(-.2,.55),sin(yaw2)).normalized(),rng.randf_range(.18,.29),Color(.07,.22,.035).lerp(Color(.29,.43,.10),rng.randf()))
  if kind>0:flower(st,end,kind,rng)
 st.generate_normals();var mesh=st.commit();var mat=StandardMaterial3D.new();mat.vertex_color_use_as_albedo=true;mat.cull_mode=BaseMaterial3D.CULL_DISABLED;mat.roughness=.85;mesh.surface_set_material(0,mat)
 return mesh
