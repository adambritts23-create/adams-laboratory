extends "res://scripts/lab_props.gd"
var land
var drops=[]
var time=0.0
var residents
func build(l):
 land=l;name="CivicSquare";init_materials();set_meta("dynamic",true)
 roundabout();fountain();people();market();monument()
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=2
func annulus(center:Vector3,inner:float,outer:float,y:float,mat:Material,collision:bool):
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for i in 96:
  var a=i*TAU/96;var b=(i+1)*TAU/96
  var v=[Vector3(cos(a)*inner,y,sin(a)*inner),Vector3(cos(a)*outer,y,sin(a)*outer),Vector3(cos(b)*outer,y,sin(b)*outer),Vector3(cos(b)*inner,y,sin(b)*inner)]
  for j in [0,1,2,0,2,3]:st.set_uv(Vector2(v[j].x,v[j].z)*.1);st.add_vertex(center+v[j])
 st.generate_normals();var m=MeshInstance3D.new();add_child(m);m.mesh=st.commit();m.material_override=mat
 if collision:m.create_trimesh_collision()
 return m
func roundabout():
 var p=Vector3(0,-48,-765)
 annulus(p,5.5,13,.055,material(Color(.15,.16,.16),0,.94),true).name="RoundaboutRoad"
 annulus(p,12.5,12.62,.063,paper,false)
 cylinder(p+Vector3.UP*.40,5.5,.8,concrete).name="RaisedIsland"
 var body=StaticBody3D.new();add_child(body);body.position=p+Vector3.UP*.4
 var shape=CollisionShape3D.new();body.add_child(shape);shape.shape=CylinderShape3D.new();shape.shape.radius=5.5;shape.shape.height=.8
 cylinder(p+Vector3.UP*.83,5.25,.07,material(Color(.20,.3,.07)))
 # Four outward-facing backlit portraits, then the supplied emblem and crowns.
 var artwork=Node3D.new();add_child(artwork);artwork.name="CentralArtwork";artwork.position=p+Vector3(0,1.25,0);artwork.scale=Vector3.ONE*1.25
 var first=get_child_count()
 box(Vector3(0,.12,0),Vector3(2.9,.24,2.9),dark)
 lightbox(Vector3.UP*1.75,Vector2(2.05,2.8),"king")
 lightbox(Vector3.UP*4.15,Vector2(1.7,1.9),"emblem")
 lightbox(Vector3.UP*5.95,Vector2(2.2,1.46),"crowns")
 for child in get_children().slice(first):child.reparent(artwork,false)
 cylinder(p+Vector3.UP*1.02,2.25,.38,concrete)
 horse(Vector3(36,-47.88,-756))
 var flowers=preload("res://scripts/village_gardens.gd").new();add_child(flowers);flowers.land=land;flowers.init_materials();flowers.flower_mesh=SphereMesh.new();flowers.flower_mesh.radius=1;flowers.flower_mesh.height=2;flowers.flower_mesh.radial_segments=8;flowers.flower_mesh.rings=4;flowers.shrub_mesh=flowers.leaf_cluster();flowers.rng.seed=2187
 for i in 18:
  var a=i*TAU/18;var q=p+Vector3(cos(a)*4,.87,sin(a)*4)
  flowers.bush(q,.65,i%3==0)
  flowers.flower_patch(q+Vector3(cos(a)*.65,0,sin(a)*.65),.38,i)
 flowers.flush_batches()
 for sign_s in [-17,17]:
  var q=p+Vector3(7.7,0,sign_s)
  tube(q,q+Vector3.UP*2.6,.045,metal)
  var sign=cylinder(q+Vector3.UP*2.55,.42,.05,material(Color(.02,.12,.48),0,.5,.3));sign.rotation.x=PI/2
  label_at("↻",q+Vector3(0,2.55,.04*signf(sign_s)),46,Color.WHITE,.013).rotation.y=0 if sign_s>0 else PI
func lightbox(p:Vector3,size:Vector2,image_name:String):
 box(p,Vector3(size.x+.12,size.y+.12,size.x+.12),material(Color(.035,.06,.10),.45,.3))
 var mat=StandardMaterial3D.new();var texture=load("res://art/town_monument/"+image_name+".png")
 mat.albedo_texture=texture;mat.albedo_color=Color(.55,.55,.55);mat.emission_enabled=true;mat.emission_texture=texture;mat.emission=Color(.35,.35,.35);mat.emission_energy_multiplier=.7;mat.roughness=.4
 for i in 4:
  var face=MeshInstance3D.new();add_child(face);face.name=image_name+"Panel";face.mesh=QuadMesh.new();face.mesh.size=size;face.material_override=mat;face.rotation.y=i*PI/2;face.position=p+Vector3(sin(i*PI/2),0,cos(i*PI/2))*(size.x*.5+.065)
func horse(p:Vector3):
 var red_paint=material(Color(.7,.045,.025),.1,.35)
 ellipsoid(p+Vector3(0,1.2,0),Vector3(.52,.72,1.0),red_paint)
 for x in [-.33,.33]:
  for z in [-.65,.65]:tube(p+Vector3(x,.1,z),p+Vector3(x,1.25,z),.14,red_paint)
 tube(p+Vector3(0,1.4,.7),p+Vector3(0,2.4,1.0),.28,red_paint)
 ellipsoid(p+Vector3(0,2.4,1.25),Vector3(.28,.28,.5),red_paint)
 for x in [-.18,.18]:tube(p+Vector3(x,2.48,1),p+Vector3(x,2.9,.96),.065,red_paint)
 tube(p+Vector3(0,1.5,-.85),p+Vector3(0,.8,-1.17),.10,red_paint)
 for side in [-1,1]:
  ellipsoid(p+Vector3(side*.50,1.48,-.10),Vector3(.03,.40,.59),paper)
  for i in 6:
   var a=i*TAU/6;ellipsoid(p+Vector3(side*.535,1.48+sin(a)*.22,-.1+cos(a)*.3),Vector3(.025,.10,.12),material(Color(.035,.23,.55)))
  ellipsoid(p+Vector3(side*.25,2.47,1.38),Vector3(.035,.04,.04),dark)
func fountain():
 var p=Vector3(31,-47.94,-736)
 cylinder(p+Vector3.UP*.15,3.5,.3,concrete)
 annulus(p,3.12,3.5,.62,concrete,false)
 var water=ShaderMaterial.new();water.shader=preload("res://materials/square_water.gdshader")
 annulus(p,.01,3.1,.47,water,false)
 cylinder(p+Vector3.UP*.95,.32,1.6,concrete)
 var spray=material(Color(.56,.84,.92,.65),.1,.18,.1)
 for i in 8:
  var a=i*TAU/8;var previous=p+Vector3.UP*1.8
  for j in range(1,17):
   var t=j/16.0;var next=p+Vector3(cos(a)*t*2.5,1.8+1.6*t-2.93*t*t,sin(a)*t*2.5)
   tube(previous,next,.024,spray);previous=next
  var drop=ellipsoid(previous,Vector3(.055,.08,.055),spray);drops.append({"node":drop,"angle":a,"origin":p})
 for q in [Vector3(25,-47.94,-736),Vector3(37,-47.94,-736),Vector3(31,-47.94,-742)]:
  var angle=atan2(p.x-q.x,p.z-q.z);bench(q,angle)
func bench(p:Vector3,yaw:float):
 var root=Node3D.new();add_child(root);root.position=p;root.rotation.y=yaw
 var first=get_child_count();var timber=material(Color(.38,.23,.11),0,.85)
 for i in 4:box(Vector3(0,.48,-.20+i*.13),Vector3(2.4,.06,.1),timber)
 for y in [.75,.94,1.13]:box(Vector3(0,y,-.30),Vector3(2.4,.12,.06),timber)
 for x in [-.9,.9]:box(Vector3(x,.23,0),Vector3(.07,.46,.5),metal)
 for item in get_children().slice(first):item.reparent(root,false)
func people():
 residents=preload("res://scripts/beach_life.gd").new();add_child(residents);residents.land=land;residents.init_materials();residents.set_meta("dynamic",true)
 for i in 4:
  var a=Vector3(14+i*.65,-47.9,-767);var b=Vector3(14+i*.65,-47.9,-742)
  residents.person(a,"walk",i,b)
 for i in 3:residents.person(Vector3(37+i*.85,-47.9,-741),"talk",i+4,Vector3.ZERO)
 residents.person(Vector3(25,-47.94,-736),"sit",2,Vector3.ZERO).rotation.y=PI/2
 var vendor=preload("res://scripts/beach_life.gd").new();add_child(vendor);vendor.land=land;vendor.init_materials();vendor.ice_cream();vendor.position=Vector3(-20,.06,71)
func _process(dt):
 if land==null or land.route.lab.paused:return
 time+=dt
 for i in drops.size():
  var t=fposmod(time*.8+i*.13,1);var d=drops[i]
  d.node.position=d.origin+Vector3(cos(d.angle)*t*2.5,1.8+1.6*t-2.93*t*t,sin(d.angle)*t*2.5)


func market():
 var cloths=[Color(.78,.14,.12),Color(.15,.36,.66),Color(.16,.47,.27)]
 for row in 2:
  for col in 3:
   var p=Vector3(19+col*6,-47.92,-760+row*12)
   var fabric=material(cloths[col],0,.9)
   box(p+Vector3.UP*.8,Vector3(3.6,.14,1.3),material(Color(.48,.29,.12)),true)
   for x in [-1.6,1.6]:
    for z in [-.55,.55]:tube(p+Vector3(x,0,z),p+Vector3(x,2.5,z),.045,metal)
   box(p+Vector3.UP*2.5,Vector3(4,.1,2),fabric)
   label_at("LOPPIS",p+Vector3(0,2.24,.74),24,Color.WHITE,.008)
   for i in 9:
    var q=p+Vector3(-1.4+(i%5)*.62,.99,-.27+(i/5)*.5)
    if i%3==0:cylinder(q,.12,.28,paper)
    else:box(q,Vector3(.34,.12+.07*(i%3),.24),material(cloths[(i+col)%3]))
   residents.person(p+Vector3(0,0,-1.2),"talk",col+row*3,Vector3.ZERO)
 for i in 16:
  var x=15+(i%8)*3.3
  var path=[Vector3(x,-47.9,-767),Vector3(39,-47.9,-767),Vector3(39,-47.9,-743),Vector3(15,-47.9,-743),Vector3(15,-47.9,-767)]
  residents.person(path[0],"walk",i,path[-1]);residents.actors[-1]["path"]=path
 for p in [Vector3(14,-47.9,-770),Vector3(40,-47.9,-770),Vector3(14,-47.9,-734),Vector3(40,-47.9,-734),Vector3(17,-47.9,-750),Vector3(40,-47.9,-747)]:
  cylinder(p+Vector3.UP*.14,.22,.28,metal)
  cylinder(p+Vector3.UP*1.65,.065,3.3,metal)
  box(p+Vector3.UP*3.37,Vector3(.45,.62,.45),material(Color(1,.76,.40),0,.5,1.2))
  box(p+Vector3.UP*3.72,Vector3(.64,.12,.64),dark)
  var light=OmniLight3D.new();add_child(light);light.position=p+Vector3.UP*3.3;light.light_color=Color(1,.79,.48);light.light_energy=1.3;light.omni_range=11;light.shadow_enabled=false;light.light_cull_mask=2;light.distance_fade_enabled=true;light.distance_fade_begin=75;light.distance_fade_length=20

func clocktower():
 var tower=Node3D.new();add_child(tower);tower.name="SquareClocktower";tower.position=Vector3(29,-47.9,-754)
 var first=get_child_count()
 var stone=aged(Color(.65,.52,.34),Color(.32,.26,.19),0,2)
 var trim=material(Color(.76,.65,.44),.1,.75)
 box(Vector3(0,.2,0),Vector3(4,.4,4),concrete,true)
 box(Vector3(0,4.2,0),Vector3(2.8,8,2.8),stone,true)
 for y in [.65,6.4,8.4,10.4]:box(Vector3(0,y,0),Vector3(3.3,.24,3.3),trim)
 box(Vector3(0,9.35,0),Vector3(3.1,1.8,3.1),stone)
 for x in [-1.45,1.45]:
  for z in [-1.45,1.45]:box(Vector3(x,4.5,z),Vector3(.18,7.6,.18),trim)
 var roof=MeshInstance3D.new();add_child(roof);roof.mesh=CylinderMesh.new();roof.mesh.top_radius=.08;roof.mesh.bottom_radius=2.25;roof.mesh.height=2.8;roof.mesh.radial_segments=4;roof.position.y=11.85;roof.rotation.y=PI/4;roof.material_override=dark
 tube(Vector3(0,13.2,0),Vector3(0,14.1,0),.04,brass)
 var face=material(Color(1,.86,.55),0,.7,1.5)
 var crown=StandardMaterial3D.new();crown.albedo_texture=load("res://art/town_monument/crowns.png");crown.emission_enabled=true;crown.emission_texture=crown.albedo_texture;crown.emission=Color(.5,.5,.5)
 for side in 4:
  var face_root=Node3D.new();add_child(face_root);face_root.position=Vector3(sin(side*PI/2)*1.57,9.3,cos(side*PI/2)*1.57);face_root.rotation.y=side*PI/2
  var start=get_child_count()
  var disc=cylinder(Vector3.ZERO,1.02,.06,face);disc.rotation.x=PI/2
  for hour in 12:
   var angle=hour*TAU/12
   tube(Vector3(sin(angle)*.8,cos(angle)*.8,.05),Vector3(sin(angle)*.93,cos(angle)*.93,.05),.022,dark)
  tube(Vector3(0,0,.075),Vector3(.47,.36,.075),.035,dark)
  tube(Vector3(0,0,.085),Vector3(-.40,.67,.085),.025,dark)
  ellipsoid(Vector3(0,0,.1),Vector3(.075,.075,.025),brass)
  var emblem=MeshInstance3D.new();add_child(emblem);emblem.mesh=QuadMesh.new();emblem.mesh.size=Vector2(1.45,.97);emblem.position=Vector3(0,-2.15,.015);emblem.material_override=crown
  for item in get_children().slice(start):item.reparent(face_root,false)
 for item in get_children().slice(first):item.reparent(tower,false)

func monument():
 var p=Vector3(18,-47.9,-735)
 var bronze=material(Color(.18,.38,.32),.75,.4)
 box(p+Vector3.UP*.25,Vector3(2.6,.5,2.6),concrete,true)
 box(p+Vector3.UP*.9,Vector3(1.6,.8,1.6),dark,true)
 # Intertwined bronze arcs celebrate the town's woodland and industrial heritage.
 for side in [-1,1]:
  for i in 24:
   var a=i*PI/24;var b=(i+1)*PI/24
   tube(p+Vector3(side*.42+cos(a)*.7,1.3+sin(a)*2.1,side*.25),p+Vector3(side*.42+cos(b)*.7,1.3+sin(b)*2.1,side*.25),.09,bronze)
 label_at("BJÖRKDAL\nSKOG · ARBETE · FRAMTID",p+Vector3(0,.95,.815),22,Color(.85,.77,.54),.006)
