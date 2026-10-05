extends "res://scripts/valley_landscape.gd"
var data:Dictionary
var route_line:PackedVector3Array=[]
var navigation:Label
var nav_clock:=0.0
var heading_to_work:=true
var glass_mat:Material
var wall_mat:Material
var window_mesh:SurfaceTool
func point(a)->Vector3:return Vector3(float(a[0]),0,float(a[1]))
func build(r):
 route=r;init_materials();name="VasterasCommute"
 data=JSON.parse_string(FileAccess.get_file_as_string("res://data/commute.json"))
 asphalt=aged(Color(.15,.16,.16),Color(.085,.09,.095),0,2.4)
 verge=aged(Color(.20,.28,.11),Color(.07,.14,.045),0,.55)
 glass_mat=material(Color(.17,.25,.29),.25,.3);wall_mat=material(Color(.69,.69,.64),0,.8)
 var ground=box(Vector3(100,-.15,-2000),Vector3(4000,.3,3790),verge,true)
 # Continuous collision plane avoids tyre snagging on millimetre-high asphalt edges.
 for child in ground.get_children():
  if child is MeshInstance3D:child.position.y=-.025
 for p in data.route:route_line.append(point(p))
 var roadway=SurfaceTool.new();roadway.begin(Mesh.PRIMITIVE_TRIANGLES)
 var pavement=SurfaceTool.new();pavement.begin(Mesh.PRIMITIVE_TRIANGLES)
 var paint=SurfaceTool.new();paint.begin(Mesh.PRIMITIVE_TRIANGLES)
 for road in data.roads:
  var ps=PackedVector3Array()
  for p in road.points:ps.append(point(p))
  var walking=road.kind in ["footway","path","cycleway","pedestrian"]

  if not walking and not road.roundabout and road.kind!="service":
   for i in ps.size()-1:
    var length=ps[i].distance_to(ps[i+1]);var dir=(ps[i+1]-ps[i]).normalized();var side=dir.cross(Vector3.UP)*.055
    for d in range(3,int(length)-2,12):
     var a=ps[i]+dir*d+Vector3.UP*.012;var b=a+dir*3
     tri(paint,a-side,b+side,a+side);tri(paint,a-side,b-side,b+side)
 for triangle in data.road_triangles:flat_triangle(roadway,triangle,0.0)
 for triangle in data.paving_triangles:flat_triangle(pavement,triangle,-.01)
 surface(pavement,material(Color(.40,.41,.38),0,.94),false).cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
 surface(roadway,asphalt).cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
 surface(paint,paper,false).cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
 window_mesh=SurfaceTool.new();window_mesh.begin(Mesh.PRIMITIVE_TRIANGLES)
 for b in data.buildings:building(b)
 surface(window_mesh,glass_mat,false).cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
 landmark_entrance()
 street_furniture()
 work_route_guide()
 roundabout_islands()
 greenery()
 mapped_woodland()
 navigation=Label.new();var overlay=CanvasLayer.new();add_child(overlay);overlay.add_child(navigation)
 navigation.position=Vector2(24,root_height_hint());navigation.add_theme_font_size_override("font_size",16);navigation.add_theme_color_override("font_shadow_color",Color.BLACK);navigation.add_theme_constant_override("shadow_offset_x",2);navigation.add_theme_constant_override("shadow_offset_y",2)
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
func flat_triangle(st:SurfaceTool,t:Array,y:float):
 var a=point(t[0])+Vector3.UP*y;var b=point(t[1])+Vector3.UP*y;var c=point(t[2])+Vector3.UP*y
 if (b-a).cross(c-a).y>0:tri(st,a,c,b)
 else:tri(st,a,b,c)
func strip(st:SurfaceTool,ps:PackedVector3Array,width:float,y:float):
 for i in ps.size()-1:
  var a=ps[i]+Vector3.UP*y;var b=ps[i+1]+Vector3.UP*y
  if a.distance_to(b)<.01:continue
  var side=(b-a).cross(Vector3.UP).normalized()*width*.5
  tri(st,a-side,b+side,a+side);tri(st,a-side,b-side,b+side)
 # Small circular joins close gaps around the mapped bends and roundabouts.
 for p in ps:
  for k in 12:
   var a=p+Vector3(sin(k*TAU/12),0,cos(k*TAU/12))*width*.5+Vector3.UP*y
   var b=p+Vector3(sin((k+1)*TAU/12),0,cos((k+1)*TAU/12))*width*.5+Vector3.UP*y
   tri(st,p+Vector3.UP*y,a,b)
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
 if b.kind in ["industrial","warehouse","office"] or center.z> -1200:
  var nearest=route_line[0]
  for p in route_line:
   if p.distance_to(center)<nearest.distance_to(center):nearest=p
  var facing=(nearest-center).normalized();facing.y=0
  var edge_point=center
  var best=INF
  for i in poly.size():
   var a=Vector3(poly[i].x,0,poly[i].y);var c=Vector3(poly[(i+1)%poly.size()].x,0,poly[(i+1)%poly.size()].y)
   var q=Geometry3D.get_closest_point_to_segment(nearest,a,c)
   if q.distance_to(nearest)<best:best=q.distance_to(nearest);edge_point=q
  var door=box(edge_point+facing*.07+Vector3.UP*1.6,Vector3(2.5,3.2,.1),metal);door.rotation.y=atan2(facing.x,facing.z)
  if b.get("name","")!="":
   var title=label_at(b.name,edge_point+facing*.16+Vector3.UP*4.1,42,Color.WHITE,.007);title.rotation.y=atan2(facing.x,facing.z)
  box(center+Vector3.UP*(height+.45),Vector3(2,.9,2),metal)
func landmark_entrance():
 var p=point(data.entrance)
 var cladding=material(Color(.85,.87,.86),0,.82)
 # East-facing entrance and forecourt recreated from the supplied reference.
 box(p+Vector3(.03,1.5,-28),Vector3(.045,3,70),material(Color(.45,.44,.39),0,.9))
 box(p+Vector3(3,-.025,0),Vector3(6,.12,25),material(Color(.46,.44,.39),0,.95),true)
 box(p+Vector3(.08,1.55,0),Vector3(.18,3.1,4.2),dark)
 box(p+Vector3(.20,1.28,0),Vector3(.08,2.56,1.45),cladding)
 box(p+Vector3(.26,1.28,0),Vector3(.05,2.35,1.22),glass_mat)
 box(p+Vector3(.30,1.28,0),Vector3(.04,2.4,.055),cladding)
 var sign=label_at("5C",p+Vector3(.32,2.65,1.40),64,Color.WHITE,.006);sign.rotation.y=PI/2
 box(p+Vector3(.8,3.15,0),Vector3(1.8,.16,5.0),dark)
 for z in range(-62,7,3):
  box(p+Vector3(.065,13,z),Vector3(.04,23,.022),material(Color(.62,.65,.64),0,.9))
 for floor_index in range(1,8):
  var h=floor_index*3.05+.4
  for z in [3.0,-9.0]:
   box(p+Vector3(.9,h,z),Vector3(1.8,.16,3.0),cladding)
   box(p+Vector3(1.75,h+.52,z),Vector3(.10,1.0,3.0),cladding)
   tube(p+Vector3(1.78,h+1.06,z-1.5),p+Vector3(1.78,h+1.06,z+1.5),.035,metal)
 for spec in [[4,7,1.0],[5,-15,1.12],[4,-31,.95],[20,22,1.05],[24,-42,1.15],[-20,24,1.1]]:
  var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=p+Vector3(spec[0],0,spec[1]);tree.scale=Vector3.ONE*spec[2];tree.rotation.y=float(spec[1])*.4
 for z in [-7,6]:
  box(p+Vector3(4,.35,z),Vector3(2.8,.7,4.5),material(Color(.36,.30,.22),0,.95),true)
  for dx in [-.7,.1,.8]:ellipsoid(p+Vector3(4+dx,.95,z),Vector3(.9,.6,1.9),material(Color(.18,.30,.09),0,1))
 for z in [-3.2,-1.6]:box(p+Vector3(1.9,.35,z),Vector3(.08,.7,.08),metal)
 for x in [1.6,1.85,2.1]:box(p+Vector3(x,.73,-2.4),Vector3(.16,.10,2.5),material(Color(.37,.28,.17),0,.9))
 plaque("SEVALLAGATAN 5C",p+Vector3(5,2.4,11),Vector2(4,.6),0)
func street_furniture():
 var seen={}
 for step in data.steps:
  if step.name=="" or seen.has(step.name):continue
  seen[step.name]=true
  var p=point(step.point)+Vector3(6,0,7)
  cylinder(p+Vector3.UP*1.6,.06,3.2,metal)
  box(p+Vector3.UP*3,Vector3(5,.65,.06),paper)
  label_at(step.name.to_upper(),p+Vector3(0,3,.045),36,Color(.08,.12,.14),.004)
  label_at(step.name.to_upper(),p+Vector3(0,3,-.045),36,Color(.08,.12,.14),.004).rotation.y=PI
 for i in range(3,route_line.size()-1,4):
  var p=route_line[i];var side=(route_line[i+1]-p).normalized().cross(Vector3.UP)
  p+=side*6
  cylinder(p+Vector3.UP*3.5,.065,7,metal)
  tube(p+Vector3.UP*6.9,p+Vector3.UP*6.9-side*1.5,.05,metal)
  box(p+Vector3.UP*6.85-side*1.5,Vector3(.8,.12,.35),dark)
func greenery():
 var rng=RandomNumberGenerator.new();rng.seed=9913
 var scene=null
 for road in data.roads:
  if road.name not in ["Lugna gatan","Österleden"]:continue
  var ps=road.points
  for i in ps.size()-1:
   var a=point(ps[i]);var b=point(ps[i+1]);var dir=(b-a).normalized();var side=dir.cross(Vector3.UP)
   for d in range(12,int(a.distance_to(b)),22):
    for sign_value in [-1,1]:
     var p=a+dir*d+side*sign_value*rng.randf_range(14,27)
     if clear_ground(p):tree_at(scene,p,rng.randf_range(.85,1.5),rng.randf_range(0,TAU))
 # Continuous green verges also cover stretches represented by short OSM segments.
 var since=0.0
 for i in route_line.size()-1:
  var a=route_line[i];var b=route_line[i+1];var length=a.distance_to(b);since+=length
  if since<38:continue
  since=0
  var side=(b-a).normalized().cross(Vector3.UP)
  for sign_value in [-1,1]:
   var p=b+side*sign_value*rng.randf_range(17,30)
   if clear_ground(p):tree_at(scene,p,rng.randf_range(.9,1.4),rng.randf_range(0,TAU))
func clear_ground(p:Vector3)->bool:
 if p.distance_to(point(data.entrance))<70:return false
 for road in data.roads:
  for i in road.points.size()-1:
   if p.distance_to(Geometry3D.get_closest_point_to_segment(p,point(road.points[i]),point(road.points[i+1])))<float(road.width)*.5+4:return false
 for b in data.buildings:
  var poly=PackedVector2Array()
  for q in b.points:poly.append(Vector2(q[0],q[1]))
  if Geometry2D.is_point_in_polygon(Vector2(p.x,p.z),poly):return false
 return true
func _process(delta):
 if navigation==null:return
 navigation.position.y=root_height_hint()
 navigation.visible=route.outside and not route.lab.paused and not route.apartment.inside
 nav_clock-=delta
 if nav_clock>0:return
 nav_clock=.4
 var position=route.lab.player.global_position;var closest=INF;var index=0
 for i in route_line.size():
  var d=position.distance_to(route_line[i])
  if d<closest:closest=d;index=i
 var remaining=position.distance_to(route_line[index])
 if heading_to_work:
  for i in range(0,index):remaining+=route_line[i].distance_to(route_line[i+1])
 else:
  for i in range(index,route_line.size()-1):remaining+=route_line[i].distance_to(route_line[i+1])
 var text=("Bränslegatan 1" if heading_to_work else "Sevallagatan 5C")+" · %.1f km"%(remaining/1000)
 var road_name="";var road_distance=INF
 for road in data.roads:
  if road.name=="" or road.kind in ["footway","path","cycleway"]:continue
  for j in road.points.size()-1:
   var dist=position.distance_to(Geometry3D.get_closest_point_to_segment(position,point(road.points[j]),point(road.points[j+1])))
   if dist<road_distance:road_distance=dist;road_name=road.name
 text=road_name+" → "+text
 if not heading_to_work and position.distance_to(route_line[-1])<35:text="Sevallagatan 5C · Arrived"
 navigation.text="RED ROUTE → WORK\n"+text+"\nMap data © OpenStreetMap contributors · ODbL"

func root_height_hint()->float:return maxf(340,get_viewport().get_visible_rect().size.y-105)

func mapped_woodland():
 var rng=RandomNumberGenerator.new();rng.seed=5173
 var scene=null
 var count=0
 for woodland in data.get("woodlands",[]):
  var poly=PackedVector2Array();var bounds=Rect2(Vector2(woodland.points[0][0],woodland.points[0][1]),Vector2.ZERO)
  for q in woodland.points:
   var v=Vector2(q[0],q[1]);poly.append(v);bounds=bounds.expand(v)
  for x in range(int(bounds.position.x),int(bounds.end.x),18):
   for z in range(int(bounds.position.y),int(bounds.end.y),18):
    var p=Vector3(x+rng.randf_range(-6,6),0,z+rng.randf_range(-6,6))
    var distance=INF
    for i in route_line.size()-1:distance=minf(distance,p.distance_to(Geometry3D.get_closest_point_to_segment(p,route_line[i],route_line[i+1])))
    if distance>210 or not Geometry2D.is_point_in_polygon(Vector2(p.x,p.z),poly) or not clear_ground(p):continue
    tree_at(scene,p,rng.randf_range(1.0,1.8),rng.randf_range(0,TAU));count+=1
    if count>=450:return

func roundabout_islands():
 var groups={}
 for road in data.roads:
  if not road.roundabout or road.name=="":continue
  if not groups.has(road.name):groups[road.name]=[]
  for q in road.points:groups[road.name].append(point(q))
 for title in groups:
  var ps=groups[title];var center=Vector3.ZERO
  for p in ps:center+=p
  center/=ps.size()
  var radius=INF
  for p in ps:radius=minf(radius,center.distance_to(p))
  radius-=6
  if radius<2:continue
  cylinder(center+Vector3.UP*.06,radius,.12,material(Color(.40,.42,.37),0,.9))
  cylinder(center+Vector3.UP*.13,radius-.5,.14,verge)
  for angle in [0,PI*.5,PI,PI*1.5]:
   var p=center+Vector3(sin(angle),0,cos(angle))*(radius-.5)
   var sign=box(p+Vector3.UP*.7,Vector3(1.4,.40,.055),material(Color(.08,.22,.62),0,.65));sign.rotation.y=angle
   var text=label_at("→ →",p+Vector3.UP*.7+Vector3(sin(angle),0,cos(angle))*.04,48,Color.WHITE,.004);text.rotation.y=angle

func work_route_guide():
 # Visible road paint, not a collider: follow the route from home towards work.
 var guide=SurfaceTool.new();guide.begin(Mesh.PRIMITIVE_TRIANGLES)
 var points=route_line.duplicate();points.reverse();points.append(Vector3(0,0,-43))
 strip(guide,points,.42,.045)
 for i in points.size()-1:
  var a=points[i];var b=points[i+1];var delta=b-a
  if delta.length()<.1:continue
  var forward=delta.normalized();var side=forward.cross(Vector3.UP)
  for d in range(3,int(delta.length()),12):
   var tip=a+forward*d+Vector3.UP*.052
   tri(guide,tip,tip-forward*2+side*.95,tip-forward*2-side*.95)
 var red_route=StandardMaterial3D.new();red_route.albedo_color=Color(1,.035,.025);red_route.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;red_route.cull_mode=BaseMaterial3D.CULL_DISABLED
 var mesh=surface(guide,red_route,false);mesh.name="RedRouteToWork";mesh.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
 var marker=label_at("WORK / LABORATORY\nBränslegatan 1\nE · open gate",Vector3(0,4,-62),52,Color(1,.15,.08),.014);marker.billboard=BaseMaterial3D.BILLBOARD_ENABLED
