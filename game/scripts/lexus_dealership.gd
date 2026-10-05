extends "res://scripts/lab_props.gd"
var displays={}
var lab
var owned={}
func build(world):
 lab=world
 init_materials();name="LexusShowroom";position=Vector3(49,-48,-917.6);rotation.y=PI
 var white=material(Color(.85,.86,.85),.15,.45)
 box(Vector3(0,-.1,0),Vector3(24,.2,15),white,true)
 var glazing=material(Color(.60,.80,.86,.12),.1,.12)
 for x in [-12,12]:
  box(Vector3(x,2.6,0),Vector3(.06,5.2,15),glazing,true)
  for z in [-7.5,-2.5,2.5,7.5]:box(Vector3(x,2.6,z),Vector3(.12,5.2,.12),metal)
 box(Vector3(0,2.6,-7.5),Vector3(24,5.2,.18),dark,true)
 box(Vector3(0,5.2,0),Vector3(24,.18,15),white)
 for x in [-11,-6,-1.4,1.4,6,11]:box(Vector3(x,2.5,7.4),Vector3(.09,5,.12),metal,true)
 for x in [-6.7,6.7]:box(Vector3(x,2.5,7.4),Vector3(10.2,5,.03),material(Color(.70,.85,.90,.09)),true)
 plaque("LEXUS  /  BJÖRKDAL",Vector3(0,4.45,7.55),Vector2(13,.65),0,true)
 var logo=material(Color(.9,.97,1),.15,.2,3.5)
 for i in 48:
  var a=i*TAU/48;var b=(i+1)*TAU/48
  tube(Vector3(cos(a)*1.8,7+sin(a)*1.25,7.6),Vector3(cos(b)*1.8,7+sin(b)*1.25,7.6),.07,logo)
 tube(Vector3(.3,7.9,7.61),Vector3(-.7,6.25,7.61),.12,logo)
 tube(Vector3(-.7,6.25,7.61),Vector3(1.2,6.25,7.61),.12,logo)
 box(Vector3(0,6.8,7.48),Vector3(4.3,3.2,.12),dark)
 for x in [-6,0,6]:
  box(Vector3(x,5.02,0),Vector3(.28,.035,10),material(Color(1,1,.95),0,.5,3))
  var l=OmniLight3D.new();add_child(l);l.position=Vector3(x,4,0);l.light_energy=2.8;l.omni_range=10;l.light_cull_mask=2
 for spec in [["rx","RX 450h",Vector3(-6,0,-3.6)],["is","IS 500",Vector3(6,0,-3.6)],["sedan","SPORT SEDAN",Vector3(-6,0,3.1)],["suv","LUXURY SUV",Vector3(6,0,3.1)]]:
  var root=Node3D.new();add_child(root);root.position=spec[2];root.set_meta("car_title",spec[1]);root.set_meta("dynamic",true)
  if spec[0] in ["rx","is"]:
   var first=get_child_count();car(Vector3.ZERO,spec[0]=="rx",Color(.018,.022,.027) if spec[0]=="rx" else Color(.035,.18,.67))
   for n in get_children().slice(first):n.reparent(root,false)
  else:
   var imported=load("res://art/vehicles/kenney/"+("sedan-sports" if spec[0]=="sedan" else "suv-luxury")+".res").instantiate();root.add_child(imported)
  displays[spec[0]]=root
  var q=spec[2]+Vector3(2.0,1.1,1.8)
  lab.economy.target(self,"dealer_"+spec[0],"Buy "+spec[1]+" · $100,000",q,Vector3(2.4,.7,.25))
 # Walkable forecourt connects to the neighboring shopping street.
 box(Vector3(0,-.02,12),Vector3(25,.04,9),concrete,true)
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=2
func deliver(id):
 if owned.has(id) or not displays.has(id):return
 var vehicle=preload("res://scripts/dealership_vehicle.gd").new();lab.staff_exit.grounds.add_child(vehicle)
 vehicle.build(lab,lab.staff_exit,id,displays[id])
 vehicle.global_transform=global_transform*Transform3D(Basis.IDENTITY,Vector3(-9+["rx","is","sedan","suv"].find(id)*6.0,.02,13))
 owned[id]=vehicle;lab.staff_exit.vehicles.append(vehicle)
func rounded(p,size,mat):
 # Beveled superellipse shell, smooth shared normals and rounded corners.
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 var rows=[]
 for ring_index in 13:
  var lat=-PI/2+ring_index*PI/12;var row=[]
  for i in 33:
   var a=i*TAU/32
   var v=Vector3(signf(cos(a))*pow(absf(cos(a)),.35)*pow(absf(cos(lat)),.4),signf(sin(lat))*pow(absf(sin(lat)),.35),signf(sin(a))*pow(absf(sin(a)),.35)*pow(absf(cos(lat)),.4))
   row.append(p+v*size*.5)
  rows.append(row)
 for j in 12:
  for i in 32:
   for v in [rows[j][i],rows[j+1][i+1],rows[j+1][i],rows[j][i],rows[j][i+1],rows[j+1][i+1]]:st.add_vertex(v)
 st.generate_normals();var mesh=MeshInstance3D.new();mesh.mesh=st.commit();mesh.material_override=mat;add_child(mesh)
func car(p,suv,color):
 var paint=material(color,.7,.20);var chrome=material(Color(.72,.77,.80),.95,.16);var glass=material(Color(.025,.06,.075),.45,.18)
 var length=4.89 if suv else 4.76;var width=1.90 if suv else 1.84;var roof=1.68 if suv else 1.43
 rounded(p+Vector3(0,.69,0),Vector3(width,.77,length),paint)
 cabin(p,suv,paint,material(Color(.16,.23,.27),.15,.24),chrome)
 for side in [-1,1]:
  tube(p+Vector3(side*width*.46,.97,-1.8),p+Vector3(side*width*.46,.97,1.20),.019,chrome)
  for z in [-1.42,1.40]:
   var tire=cylinder(p+Vector3(side*(width*.5-.09),.37,z),.36,.22,rubber);tire.rotation.z=PI/2
   var rim=cylinder(p+Vector3(side*(width*.5+.025),.37,z),.27,.025,chrome);rim.rotation.z=PI/2
   for k in 5:
    var angle=k*TAU/5; tube(p+Vector3(side*(width*.5+.044),.37,z),p+Vector3(side*(width*.5+.044),.37+sin(angle)*.25,z+cos(angle)*.25),.023,dark)
  rounded(p+Vector3(side*1.0,1.15,.60),Vector3(.24,.15,.31),paint)
  for z in [-.8,.55]:box(p+Vector3(side*.94,.94,z),Vector3(.03,.035,.20),chrome)
  # Narrow L-shaped headlamps and tail lamps.
  tube(p+Vector3(side*.54,.91,length*.5),p+Vector3(side*.86,.91,length*.5-.14),.025,material(Color(.9,.96,1),0,.3,1.2))
  tube(p+Vector3(side*.54,.91,length*.5),p+Vector3(side*.68,.85,length*.5),.018,white_material())
  box(p+Vector3(side*.62,.91,-length*.5),Vector3(.48,.09,.035),material(Color(.7,.015,.02),.15,.3,1))
 # Recognizable spindle grille outline with chrome edges.
 var outline=[Vector3(-.50,.98,0),Vector3(.50,.98,0),Vector3(.37,.68,0),Vector3(.66,.34,0),Vector3(-.66,.34,0),Vector3(-.37,.68,0)]
 box(p+Vector3(0,.65,length*.5+.01),Vector3(1.05,.59,.035),dark)
 for i in outline.size():tube(p+outline[i]+Vector3(0,0,length*.5+.035),p+outline[(i+1)%outline.size()]+Vector3(0,0,length*.5+.035),.019,chrome)
 for i in 9:box(p+Vector3(0,.39+i*.061,length*.5+.034),Vector3(.85,.014,.015),chrome)
 label_at("L",p+Vector3(0,.79,length*.5+.061),30,Color(.82,.88,.93),.005)
 label_at("RX 450h" if suv else "IS 500",p+Vector3(.5,.98,-length*.5-.04),20,Color.WHITE,.003).rotation.y=PI
 if not suv:
  for side in [-1,1]:
   for y in [.25,.35]:var tip=cylinder(p+Vector3(side*.67,y,-2.4),.055,.13,chrome);tip.rotation.x=PI/2
 else:
  for side in [-1,1]:tube(p+Vector3(side*.65,roof+.04,-1.2),p+Vector3(side*.65,roof+.04,.7),.024,chrome)
 box(p+Vector3(0,.7,0),Vector3(width,1.4,length),material(Color(1,1,1,0)),true)
func white_material():return material(Color(.9,.97,1),0,.4,1)

func cabin(p,suv,paint,glazing,chrome):
 var front=.80 if suv else 1.0;var rear=-1.95 if suv else -1.65
 var roof_front=.12 if suv else .25;var roof_rear=-1.55 if suv else -.95
 var h=1.68 if suv else 1.43;var base=1.0;var w=.84 if suv else .80;var top=.69
 var corners=[Vector3(-w,base,front),Vector3(w,base,front),Vector3(top,h,roof_front),Vector3(-top,h,roof_front),Vector3(-w,base,rear),Vector3(w,base,rear),Vector3(top,h,roof_rear),Vector3(-top,h,roof_rear)]
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for face in [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2]]:
  for i in [0,1,2,0,2,3]:st.add_vertex(p+corners[face[i]])
 st.generate_normals();var panel=MeshInstance3D.new();add_child(panel);panel.mesh=st.commit();panel.material_override=glazing
 rounded(p+Vector3(0,h+.015,(roof_front+roof_rear)*.5),Vector3(top*2+.10,.10,roof_front-roof_rear+.08),paint)
 for pair in [[0,3],[1,2],[4,7],[5,6]]:tube(p+corners[pair[0]],p+corners[pair[1]],.033,paint)
 for side in [-1,1]:
  tube(p+Vector3(side*w,base,-.48),p+Vector3(side*top,h,-.48),.033,dark)
  tube(p+Vector3(side*w,base,rear),p+Vector3(side*w,base,front),.015,chrome)
  tube(p+Vector3(side*top,h,roof_rear),p+Vector3(side*top,h,roof_front),.016,chrome)
