extends "res://scripts/valley_landscape.gd"
var glass_mat:Material
var window_mesh:SurfaceTool
func point(a)->Vector3:return Vector3(float(a[0]),0,float(a[1]))
func build(r):
 route=r;init_materials();name="Sevallagatan5C";position=Vector3(-55,-48,-925)
 glass_mat=material(Color(.17,.25,.29),.25,.3)
 var data=JSON.parse_string(FileAccess.get_file_as_string("res://data/commute.json"))
 window_mesh=SurfaceTool.new();window_mesh.begin(Mesh.PRIMITIVE_TRIANGLES)
 for source in data.buildings:
  if source.id!="158542561":continue
  var b=source.duplicate(true)
  for i in b.points.size():b.points[i]=[b.points[i][0]-data.entrance[0],b.points[i][1]-data.entrance[1]]
  building(b)
 surface(window_mesh,glass_mat,false)
 landmark_entrance()
 frontage_entrances()
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=16
func building(b:Dictionary):
 var poly=PackedVector2Array();var center=Vector3.ZERO
 for a in b.points:poly.append(Vector2(a[0],a[1]));center+=point(a)
 center/=b.points.size()
 var height:float=b.height;var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)

 for i in poly.size():
  var a=Vector3(poly[i].x,0,poly[i].y);var j=(i+1)%poly.size();var c=Vector3(poly[j].x,0,poly[j].y)
  var up=Vector3.UP*height

  var edge=c-a;var side=edge.normalized().cross(Vector3.UP)
  if side.dot((a+c)*.5-center)<0:side=-side
  if (c-a).cross(up).dot(side)>0:tri(st,a,c+up,c);tri(st,a,a+up,c+up)
  else:tri(st,a,c,c+up);tri(st,a,c+up,a+up)
  if edge.length()>4:
   for d in range(2,int(edge.length())-1,4):
    for floor_index in range(1,int(height/3.05)+1):
     var p=a+edge.normalized()*d+Vector3.UP*(floor_index*3.05-1.2)+side*.035
     var right=edge.normalized()*.65;var vert=Vector3.UP*.75
     tri(window_mesh,p-right-vert,p+right+vert,p+right-vert);tri(window_mesh,p-right-vert,p-right+vert,p+right+vert)
     tri(window_mesh,p-right-vert,p+right-vert,p+right+vert);tri(window_mesh,p-right-vert,p+right+vert,p-right+vert)
 var indices=Geometry2D.triangulate_polygon(poly)
 for k in range(0,indices.size(),3):
  var a=poly[indices[k]];var c=poly[indices[k+1]];var d=poly[indices[k+2]]
  tri(st,Vector3(a.x,height,a.y),Vector3(d.x,height,d.y),Vector3(c.x,height,c.y))
 var shade=Color(.73,.72,.67) if center.z< -2100 else Color(.43,.48,.46)
 if b.id=="158542561":shade=Color(.84,.85,.82)
 var mat=material(shade,0,.78);mat.cull_mode=BaseMaterial3D.CULL_DISABLED
 surface(st,mat)
func landmark_entrance():
 var p=Vector3.ZERO
 var q=Vector3(.60,0,-50)
 var cladding=material(Color(.85,.87,.86),0,.82)
 # East-facing entrance and forecourt recreated from the supplied reference.
 box(p+Vector3(.03,1.5,-28),Vector3(.045,3,70),material(Color(.45,.44,.39),0,.9))
 box(q+Vector3(3,-.025,0),Vector3(6,.12,25),material(Color(.46,.44,.39),0,.95),true)
 box(q+Vector3(.08,1.55,0),Vector3(.18,3.1,4.2),dark)
 box(q+Vector3(.20,1.28,0),Vector3(.08,2.56,1.45),cladding)
 box(q+Vector3(.26,1.28,0),Vector3(.05,2.35,1.22),glass_mat)
 box(q+Vector3(.30,1.28,0),Vector3(.04,2.4,.055),cladding)
 var sign=label_at("5C",q+Vector3(.32,2.65,1.40),64,Color.WHITE,.006);sign.rotation.y=PI/2
 box(q+Vector3(.8,3.15,0),Vector3(1.8,.16,5.0),dark)
 for z in range(-62,7,3):
  box(p+Vector3(.065,13,z),Vector3(.04,23,.022),material(Color(.62,.65,.64),0,.9))
 for floor_index in range(1,8):
  var h=floor_index*3.05+.4
  for z in [3.0,-9.0]:
   box(p+Vector3(.9,h,z),Vector3(1.8,.16,3.0),cladding)
   box(p+Vector3(1.75,h+.52,z),Vector3(.10,1.0,3.0),cladding)
   tube(p+Vector3(1.78,h+1.06,z-1.5),p+Vector3(1.78,h+1.06,z+1.5),.035,metal)
 for spec in [[4,7,1.0],[7,-21,1.12],[6,-27,.95],[20,22,1.05],[24,-42,1.15],[-20,24,1.1]]:
  var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=p+Vector3(spec[0],0,spec[1]);tree.scale=Vector3.ONE*spec[2];tree.rotation.y=float(spec[1])*.4
 for z in [-7,6]:
  box(q+Vector3(4,.35,z),Vector3(2.8,.7,4.5),material(Color(.36,.30,.22),0,.95),true)
  for dx in [-.7,.1,.8]:ellipsoid(q+Vector3(4+dx,.95,z),Vector3(.9,.6,1.9),material(Color(.18,.30,.09),0,1))
 for z in [-3.2,-1.6]:box(q+Vector3(1.9,.35,z),Vector3(.08,.7,.08),metal)
 for x in [1.6,1.85,2.1]:box(q+Vector3(x,.73,-2.4),Vector3(.16,.10,2.5),material(Color(.37,.28,.17),0,.9))
 plaque("SEVALLAGATAN 5C",q+Vector3(5,2.4,11),Vector2(4,.6),0)

func frontage_entrances():
 var frame=material(Color(.78,.80,.77),.15,.7)
 for spec in [[-24,"5B"],[1,"5A"]]:
  box(Vector3(.22,1.3,spec[0]),Vector3(.18,2.6,1.45),dark)
  box(Vector3(.33,1.35,spec[0]),Vector3(.04,2.2,1.1),glass_mat)
  label_at(spec[1],Vector3(.39,2.8,spec[0]),54,Color.WHITE,.005).rotation.y=PI/2
