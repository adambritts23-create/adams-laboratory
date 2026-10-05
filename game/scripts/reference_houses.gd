extends "res://scripts/lab_props.gd"
var land
var garden
var trim:Material
var glazing:Material
var tiles:Material
var wood:Material
func build(l,p:Vector3,yaw:float,kind:String):
 land=l;garden=l.get_node("VillageGardens");position=p;rotation.y=yaw;init_materials()
 wood=material(Color(.40,.27,.14),0,.8);trim=material(Color(.83,.82,.72),0,.8);glazing=material(Color(.12,.24,.28),.4,.22);tiles=land.outdoor_material(Color(.23,.24,.22),2)
 if kind=="villa":name="SlopeVilla26";villa()
 elif kind=="summer":name="LakesideReferenceCottage";summer_cottage()
 else:name="NeighbourHouse";neighbour(kind=="red")
 var flag=preload("res://scripts/swedish_flag.gd").new();add_child(flag)
 flag.position=Vector3(-9,.15,10) if kind=="villa" else Vector3(7,0,6)
 flag.scale=Vector3.ONE*(.9 if kind=="summer" else .72);flag.build()
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
func roof(p:Vector3,w:float,d:float,rise:float,mat:Material):
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 var a=p+Vector3(-w/2,0,d/2);var b=p+Vector3(w/2,0,d/2);var c=p+Vector3(0,rise,d/2)
 var e=p+Vector3(-w/2,0,-d/2);var f=p+Vector3(w/2,0,-d/2);var g=p+Vector3(0,rise,-d/2)
 for v in [a,c,b,e,f,g,a,e,g,a,g,c,b,c,g,b,g,f]:st.set_uv(Vector2(v.x,v.z)*.3);st.add_vertex(v)
 st.generate_normals();var mesh=MeshInstance3D.new();mesh.mesh=st.commit();mesh.material_override=mat;add_child(mesh)
 for side in [-1,1]:tube(p+Vector3(side*w/2,0,-d/2),p+Vector3(side*w/2,0,d/2),.06,dark)
 for z in [-d/2,d/2]:
  tube(p+Vector3(-w/2,0,z),p+Vector3(0,rise,z),.065,trim);tube(p+Vector3(0,rise,z),p+Vector3(w/2,0,z),.065,trim)
func window(p:Vector3,w:float=1.4,h:float=1.6):
 box(p,Vector3(w+.18,h+.18,.10),trim)
 box(p+Vector3(0,0,.061),Vector3(w,h,.045),glazing)
 box(p+Vector3(0,0,.09),Vector3(.055,h,.025),trim)
 box(p+Vector3(0,0,.10),Vector3(w,.05,.025),trim)
 box(p+Vector3(0,-h/2-.12,.13),Vector3(w+.3,.07,.30),trim)
func railing(a:Vector3,b:Vector3):
 tube(a+Vector3.UP,b+Vector3.UP,.04,trim)
 tube(a+Vector3.UP*.15,b+Vector3.UP*.15,.03,trim)
 var count=int(a.distance_to(b)/.25)
 for i in count+1:box(a.lerp(b,float(i)/maxi(count,1))+Vector3.UP*.5,Vector3(.045,1,.045),trim)
func shrub(p:Vector3,size_value:float,roses:bool=false):garden.bush(position+basis*p,size_value,roses)
func villa():
 var pale=material(Color(.79,.80,.74),0,.86)
 tiles=material(Color(.17,.18,.17),0,.9)
 tiles.normal_enabled=true;tiles.normal_texture=load("res://art/environment/exterior/pbr/clay_roof_tiles_02_nor_gl.jpg");tiles.uv1_triplanar=true;tiles.uv1_scale=Vector3.ONE*.5
 var stone=aged(Color(.42,.43,.39),Color(.29,.30,.28),0,2)
 box(Vector3(0,-.43,0),Vector3(24,1.14,27),stone,true)
 # Elevated pale villa and the double garage below its terrace.
 box(Vector3(-2,1.5,-3),Vector3(13,3,11),stone,true)
 box(Vector3(-2,6,-3),Vector3(13,6,10),pale,true)
 roof(Vector3(-2,9,-3),13.8,10.8,2.3,tiles)
 for y in range(31):box(Vector3(-2,3.1+y*.19,2.025),Vector3(12.85,.021,.025),trim)
 for y in [4.65,7.55]:
  for x in [-6.4,-2,2.3]:window(Vector3(x,y,2.08),1.65,1.8)
 # Front gable projection and white decorative truss.
 box(Vector3(-1.8,7.6,2.4),Vector3(3.5,2.7,.9),pale)
 roof(Vector3(-1.8,8.95,2.4),4.0,1.4,1.55,tiles)
 window(Vector3(-1.8,7.65,2.89),2.6,1.9)
 tube(Vector3(-3.5,9.1,3.13),Vector3(-.1,9.1,3.13),.04,trim)
 tube(Vector3(-1.8,9.1,3.13),Vector3(-1.8,10.2,3.13),.04,trim)
 # Upper left balcony, terrace doorway and rain pipes.
 box(Vector3(-6.5,6.1,3.3),Vector3(3.6,.2,2.6),trim,true)
 railing(Vector3(-8.3,6.2,4.55),Vector3(-4.7,6.2,4.55))
 railing(Vector3(-8.3,6.2,2),Vector3(-8.3,6.2,4.55))
 for x in [-8.45,4.45]:tube(Vector3(x,8.95,2.15),Vector3(x,3,2.15),.065,trim)
 box(Vector3(4.0,1.45,5.0),Vector3(9.5,2.9,6.2),pale,true)
 # Narrow tiled canopy in front of the flat terrace, as in the reference.
 roof(Vector3(4,2.95,7.2),10.2,2.3,.70,tiles)
 box(Vector3(4,3.02,4.1),Vector3(9.9,.16,4.0),trim,true)
 railing(Vector3(-.9,3.13,6.05),Vector3(8.9,3.13,6.05))
 for x in [1.65,6.25]:
  box(Vector3(x,1.30,8.13),Vector3(4.25,2.5,.07),trim)
  for y in [.35,.91,1.47,2.03]:
   for dx in [-1.45,-.48,.48,1.45]:box(Vector3(x+dx,y,8.18),Vector3(.87,.46,.025),material(Color(.73,.75,.72),0,.7))
 roof(Vector3(4,3.2,8.0),2.5,.7,.85,tiles)
 label_at("26",Vector3(4,3.53,8.39),36,Color(.10,.12,.10),.009)
 # Broad stone stairs to the left of the garage, stone retaining walls and niche.
 for i in 16:
  box(Vector3(-4.0,(i+1)*.19*.5,12.1-i*.48),Vector3(3.1,(i+1)*.19,.5),stone,true)
  for j in 4:box(Vector3(-5.1+j*.73,(i+1)*.19+.01,12.1-i*.48),Vector3(.69,.025,.46),material(Color(.32+j*.023,.35,.33),0,.9))
 for x in [-6.0,-2.0]:box(Vector3(x,1.1,8.0),Vector3(.45,2.2,7),stone,true)
 box(Vector3(-8,1.5,5.7),Vector3(4,3,.40),stone,true)
 box(Vector3(-8,1.7,5.92),Vector3(.95,1.2,.10),dark)
 ellipsoid(Vector3(-8,1.83,6.03),Vector3(.19,.27,.17),trim)
 box(Vector3(-8,1.39,6.0),Vector3(.50,.32,.3),trim)
 for i in 16:shrub(Vector3(-9+sin(i*1.8)*1.3,0,2+i*.72),1.4,i%5==0)
 for i in 10:shrub(Vector3(10,0,-5+i*2),1.5,i%3==0)
 shrub(Vector3(-1.2,3.0,3.6),1.3);shrub(Vector3(-6,3.0,1),1.6)
 var audi=load("res://art/environment/exterior/audi_a6_black.glb").instantiate();add_child(audi);audi.position=Vector3(6.0,.18,11.4);audi.rotation.y=0
 var obstruction=box(Vector3(6,.73,11.4),Vector3(1.9,1.45,4.9),dark,true);obstruction.get_child(1).hide()
func summer_cottage():
 var red= garden.falu;var base=land.outdoor_material(Color(.71,.68,.57),3)
 box(Vector3(0,.8,0),Vector3(10.6,1.6,6.8),base,true)
 box(Vector3(0,3.12,0),Vector3(10.6,3.05,6.8),red,true)
 # Ridge runs along the broad facade, rather than a front-facing gable.
 var first=get_child_count();roof(Vector3.ZERO,7.6,11.3,1.15,tiles)
 for i in range(first,get_child_count()):
  var n=get_child(i);n.position=Vector3(0,4.65,0)+Basis(Vector3.UP,PI/2)*n.position;n.rotation.y+=PI/2
 for x in [-5.26,5.26]:box(Vector3(x,3.1,3.44),Vector3(.17,3.05,.10),trim)
 for x in [.1,2.45]:window(Vector3(x,3.5,3.47),2.04,1.6)
 window(Vector3(-3.25,3.5,3.47),2.55,1.65)
 box(Vector3(-1.45,2.86,3.48),Vector3(.90,2.35,.10),trim)
 box(Vector3(-1.45,3.14,3.55),Vector3(.72,1.49,.03),glazing)
 # Natural wood lower doors and raised terrace under a white canvas awning.
 box(Vector3(1.7,.85,3.47),Vector3(3.35,1.6,.12),material(Color(.62,.46,.27),0,.88))
 for i in 20:box(Vector3(.1+i*.166,.85,3.54),Vector3(.018,1.57,.02),wood)
 box(Vector3(-3.2,1.66,4.4),Vector3(4.8,.18,2.1),wood,true)
 for x in [-5.4,-1.0]:box(Vector3(x,.83,5.2),Vector3(.14,1.66,.14),wood)
 railing(Vector3(-5.5,1.75,5.4),Vector3(-.9,1.75,5.4))
 var awning=box(Vector3(-3.2,4.27,4.55),Vector3(4.85,.055,2.25),trim);awning.rotation.x=.14
 for x in [-5.5,-.9]:tube(Vector3(x,1.78,5.4),Vector3(x,4.1,5.4),.028,metal)
 box(Vector3(-3.2,4.1,5.63),Vector3(4.85,.18,.045),trim)
 box(Vector3(-2.3,5.48,-.45),Vector3(.65,2.7,.7),material(Color(.51,.25,.12),0,.9))
 box(Vector3(-2.3,6.85,-.45),Vector3(.8,.14,.86),dark)
 for i in 9:box(Vector3(-6.2,(i+1)*.19*.5,6.5-i*.33),Vector3(1.2,(i+1)*.19,.35),base,true)
 for i in 12:shrub(Vector3(-7+sin(i)*.5,0,-4+i*.9),1.3,i%3==0)
 for i in 11:shrub(Vector3(6.3+sin(i)*.8,0,-4+i),1.2,i%2==0)
 # Empty outdoor furniture and pots; no people from the reference photograph.
 box(Vector3(0,.74,8),Vector3(2.8,.08,1.1),wood,true)
 for x in [-1.2,1.2]:box(Vector3(x,.37,8),Vector3(.09,.74,.9),dark)
 for z in [6.95,9.05]:box(Vector3(0,.43,z),Vector3(2.8,.10,.36),wood,true)
 for x in [-4.8,-1.4]:
  cylinder(Vector3(x,1.94,4.7),.15,.30,trim)
  shrub(Vector3(x,2.08,4.7),.35,true)
func neighbour(red:bool):
 var wall=garden.falu if red else land.outdoor_material(Color(.71,.70,.57),3)
 box(Vector3(0,-.35,0),Vector3(13,.7,13),concrete,true)
 box(Vector3(0,2.65,0),Vector3(8.7,5.3,7.4),wall,true)
 roof(Vector3(0,5.3,0),9.4,8.1,1.8,tiles)
 for y in [1.5,4]:
  for x in [-2.7,2.7]:window(Vector3(x,y,3.76),1.45,1.5)
 box(Vector3(0,1.1,3.79),Vector3(1,2.2,.10),trim)
 for i in 3:box(Vector3(0,(i+1)*.15*.5,4.8-i*.3),Vector3(1.6,(i+1)*.15,.34),concrete,true)
 for i in 6:shrub(Vector3(-5.4,0,-4+i*1.8),1,i%2==0)
 for i in 4:shrub(Vector3(3+i*.7,0,5.5),.8,true)

