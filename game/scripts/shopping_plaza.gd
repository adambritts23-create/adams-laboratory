extends "res://scripts/lab_props.gd"
var land
var parked=[]
var customers
func build(l):
 land=l;name="ShoppingPlaza";init_materials()
 parking();gym();street_shops();playground();parking_lights();right_side_access()
 for mesh in find_children("*","GeometryInstance3D",true,false):
  mesh.layers=2;mesh.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
  if mesh.visibility_range_end==0:mesh.visibility_range_end=190
func parking():
 # Bays face the supermarket, leaving the east-west road at z=-855 clear.
 box(Vector3(47,-48.025,-865),Vector3(54,.05,10),land.asphalt,true)
 # Separate paving runs stop at the cross street instead of sharing its surface.
 box(Vector3(14,-48.025,-890.75),Vector3(7,.05,51.5),concrete,true)
 box(Vector3(14,-48.025,-925.25),Vector3(7,.05,3.5),concrete,true)
 customers=preload("res://scripts/beach_life.gd").new();add_child(customers)
 customers.name="ParkingCustomers";customers.land=land;customers.init_materials();customers.set_meta("dynamic",true)
 for i in 14:
  var x=23+i*3.5
  if absf(x-49)<3:continue
  for edge in [-1.6,1.6]:box(Vector3(x+edge,-47.984,-864),Vector3(.07,.012,5.5),paper)
  if i not in [1,5,11]:continue
  var car=load("res://art/vehicles/kenney/"+("sedan-sports" if i%2 else "suv-luxury")+".res").instantiate()
  add_child(car);car.position=Vector3(x,-47.98,-863.7);car.rotation.y=PI if i%3==0 else 0
  parked.append(car)
  var barrier=StaticBody3D.new();car.add_child(barrier)
  var collision=CollisionShape3D.new();barrier.add_child(collision);collision.position.y=.8
  collision.shape=BoxShape3D.new();collision.shape.size=Vector3(1.8,1.6,4.6)
  if i in [1,5,11]:
   var path=[Vector3(x-1.25,-48,-863.6),Vector3(x-1.25,-48,-868.5),Vector3(49.6 if i%4==0 else 48.4,-48,-868.5),Vector3(49.6 if i%4==0 else 48.4,-48,-880)]
   customers.person(path[0],"walk",i,path[-1]);customers.actors[-1]["path"]=path
   var person=customers.actors[-1].node
   var bag=box(Vector3(.33,.79,.03),Vector3(.20,.30,.15),material(Color(.78,.64,.40)))
   bag.reparent(person,false)
 # Rear cross street gives the showroom its own clear forecourt and connection.
 box(Vector3(31,-48.025,-937),Vector3(62,.05,5),land.asphalt,true)
func gym():
 var p=Vector3(49,-48,-892)
 var green_sign=material(Color(.36,.95,.16),0,.5,2.5)
 var glazing=material(Color(.52,.77,.83,.14),.1,.15)
 box(p+Vector3(0,9.2,-18),Vector3(52,4.2,.06),glazing,true)
 box(p+Vector3(26,9.2,0),Vector3(.15,4.2,36),glazing,true)
 box(p+Vector3(0,9.2,18),Vector3(52,4.2,.06),glazing,true)
 # Side door opens onto the ramp landing, with no hidden wall across it.
 box(p+Vector3(-26,9.2,-15),Vector3(.15,4.2,6),glazing,true)
 box(p+Vector3(-26,9.2,7),Vector3(.15,4.2,22),glazing,true)
 box(p+Vector3(-26,10.7,-9),Vector3(.15,1.2,6),dark,true)
 box(p+Vector3(0,11.35,0),Vector3(52.4,.22,36.4),dark)
 for x in range(-24,25,6):
  for z in [-18.04,18.04]:box(p+Vector3(x,9.2,z),Vector3(.10,4.2,.1),metal)
 box(p+Vector3(0,10.75,18.12),Vector3(30,1.0,.12),dark)
 var sign=label_at("NORDIC WELLNESS",p+Vector3(0,10.75,18.22),72,Color(.46,1,.25),.023)
 sign.name="NordicWellnessSign"
 box(p+Vector3(0,10.18,18.19),Vector3(29,.035,.03),green_sign)
 # Two short flights and generous landings; the upper flight clears the pawn-shop roof.
 stair_flight(Vector3(16,-48,-872),Vector3(16,-44.45,-882))
 box(Vector3(18,-44.55,-883),Vector3(7,.2,3),concrete,true).name="GymMidLanding"
 stair_flight(Vector3(20,-44.45,-884),Vector3(20,-40.9,-894))
 box(Vector3(20,-41,-897.5),Vector3(3,.2,7),concrete,true)
 box(Vector3(21.5,-41,-900),Vector3(5,.2,3),concrete,true).name="GymTopLanding"
 for x in [18.5,21.5]:tube(Vector3(x,-39.9,-894),Vector3(x,-39.9,-898.5),.045,metal)
 box(Vector3(16,-45.1,-872),Vector3(3.7,.15,2.4),dark)
 gym_details()
 var billboard=preload("res://scripts/centrum_billboard.gd").new();add_child(billboard);billboard.build(land)
 for x in [31,38,45,52,59,66]:
  var q=Vector3(x,-40.85,-880)
  box(q+Vector3.UP*.13,Vector3(1.2,.26,2.5),dark,true)
  box(q+Vector3.UP*.28,Vector3(.9,.025,2),rubber)
  for dx in [-.53,.53]:tube(q+Vector3(dx,.2,-.9),q+Vector3(dx,1.4,-.9),.035,metal)
  box(q+Vector3(0,1.45,-.9),Vector3(1.1,.3,.15),dark)
  box(q+Vector3(0,1.46,-.811),Vector3(.65,.2,.02),material(Color(.08,.42,.55),0,.4,.5))
 for x in [32,44,56,68]:
  var q=Vector3(x,-40.85,-901)
  box(q+Vector3.UP*.5,Vector3(.65,.15,2),rubber,true)
  for z in [-.7,.7]:box(q+Vector3(0,.25,z),Vector3(.08,.5,.08),metal)
  tube(q+Vector3(-1,1.2,-.7),q+Vector3(1,1.2,-.7),.035,metal)
  for dx in [-.8,.8]:
   var weight=cylinder(q+Vector3(dx,1.2,-.7),.25,.12,dark);weight.rotation.z=PI/2
 for x in [33,49,65]:
  box(Vector3(x,-37,-892),Vector3(10,.04,.4),material(Color(.9,1,.86),0,.5,1.5))
  var light=OmniLight3D.new();add_child(light);light.position=Vector3(x,-38.2,-892);light.omni_range=14;light.light_energy=1.5;light.light_cull_mask=2;light.shadow_enabled=false
func playground():
 var p=preload("res://scripts/shopping_orientation.gd").transform().affine_inverse()*Vector3(59,-48,-853)
 var sand=material(Color(.74,.57,.32),0,1);var blue=material(Color(.08,.42,.85),.15,.4);var red=material(Color(.9,.16,.06),.1,.4)
 box(p+Vector3(0,.02,0),Vector3(15,.06,12),sand).name="PlaygroundSand"
 for x in [-7.5,7.5]:box(p+Vector3(x,.15,0),Vector3(.15,.3,12),material(Color(.45,.28,.13)))
 for z in [-6,6]:
  if z<0:box(p+Vector3(0,.15,z),Vector3(15,.3,.15),material(Color(.45,.28,.13)))
  else:
   for x in [-4.5,4.5]:box(p+Vector3(x,.15,z),Vector3(6,.3,.15),material(Color(.45,.28,.13)))
 # Two-seat swing frame, outside the dealership's circulation space.
 for x in [-5,-1]:
  for z in [-1,1]:tube(p+Vector3(x,0,z),p+Vector3(x,2.7,0),.09,red)
 tube(p+Vector3(-5,2.7,0),p+Vector3(-1,2.7,0),.10,red)
 for x in [-4,-2]:
  for dx in [-.3,.3]:tube(p+Vector3(x+dx,2.7,0),p+Vector3(x+dx,.55,0),.022,metal)
  box(p+Vector3(x,.52,0),Vector3(.8,.10,.4),blue)
 for x in [2,4]:
  for z in [-2,0]:box(p+Vector3(x,.8,z),Vector3(.12,1.6,.12),material(Color(.45,.28,.13)))
 box(p+Vector3(3,1.6,-1),Vector3(2.1,.12,2.1),blue)
 for i in 6:box(p+Vector3(3,.15+i*.26,-3.2+i*.22),Vector3(1,.12,.28),material(Color(.45,.28,.13)))
 var slide=box(p+Vector3(3,.85,1.5),Vector3(1.1,.10,3.5),red);slide.rotation.x=.45
 for x in [2.4,3.6]:tube(p+Vector3(x,1.8,0),p+Vector3(x,.24,3),.055,blue)
 box(p+Vector3(0,.4,4),Vector3(3,.10,.55),material(Color(.45,.28,.13)))
func street_shops():
 var p=Vector3(20.3,-48,-895)
 var glazing=material(Color(.6,.8,.85,.12),.1,.2)
 box(p+Vector3(0,.04,0),Vector3(5,.08,28.5),concrete,true)
 box(p+Vector3(2.45,1.3,0),Vector3(.1,2.6,28.5),painted,true)
 for side in [-1,1]:
  box(p+Vector3(0,1.3,side*14.25),Vector3(5,2.6,.12),painted,true)
  box(p+Vector3(-2.5,1.15,side*7.65),Vector3(.06,2.3,13.2),glazing,true)
 box(p+Vector3(0,2.65,0),Vector3(5.2,.14,28.7),dark,true)
 var sign=label_at("BJÖRKDALS PANTBANK",p+Vector3(-2.62,2.42,0),48,Color(1,.78,.25),.015);sign.rotation.y=-PI/2
 box(p+Vector3(.1,.48,-4),Vector3(3.3,.96,.75),material(Color(.35,.20,.09)),true)
 var clerk=preload("res://scripts/town_resident.gd").new();add_child(clerk);clerk.name="PawnShopkeeper";clerk.position=p+Vector3(.2,0,-5);clerk.build(3);clerk.rotation.y=-PI/2
 for z in [-11,-8,5,8,11]:
  for y in [.5,1.1,1.7]:
   box(p+Vector3(.8,y,z),Vector3(2.2,.06,.75),metal)
   for i in 5:box(p+Vector3(i*.38,y+.15,z),Vector3(.25,.27,.35),material(Color(.23+i*.08,.32,.39)))
 for z in [-9,0,9]:
  box(p+Vector3(0,2.5,z),Vector3(3,.04,.3),material(Color(1,.92,.76),0,.5,1.5))
  var light=OmniLight3D.new();add_child(light);light.position=p+Vector3(0,2,z);light.light_energy=1.2;light.omni_range=7;light.light_cull_mask=2;light.shadow_enabled=false

func parking_lights():
 # Warm, downward light at each end and the middle; no extra shadow maps.
 for x in [23,47,71]:
  var p=Vector3(x,-48,-868.8)
  cylinder(p+Vector3.UP*3.4,.075,6.8,metal)
  tube(p+Vector3.UP*6.8,p+Vector3(0,6.8,1.1),.06,metal)
  box(p+Vector3(0,6.75,1.1),Vector3(1.0,.12,.55),dark)
  box(p+Vector3(0,6.67,1.1),Vector3(.85,.035,.43),material(Color(1,.84,.60),0,.6,2))
  var light=SpotLight3D.new();add_child(light);light.name="ParkingLotLight";light.position=p+Vector3(0,6.6,1.1);light.rotation_degrees.x=-90;light.spot_range=20;light.spot_angle=68;light.light_energy=3.4;light.light_color=Color(1,.84,.64);light.light_cull_mask=2;light.shadow_enabled=false
  light.distance_fade_enabled=true;light.distance_fade_begin=100;light.distance_fade_length=30

func right_side_access():
 var inverse=preload("res://scripts/shopping_orientation.gd").transform().affine_inverse()
 # Continuous pedestrian route around the north end, away from the car delivery bays.
 for spec in [[Vector3(44,-48.025,-838.5),Vector3(33,.05,3)],[Vector3(51,-48.025,-846.5),Vector3(3,.05,13)]]:
  var tile=box(Vector3.ZERO,spec[1],concrete,true)
  tile.transform=inverse*Transform3D(Basis.IDENTITY,spec[0])
 for station in [847,850,856,859]:cylinder(inverse*Vector3(52,-47.55,-station),.07,.9,metal)

func stair_flight(a:Vector3,b:Vector3):
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for v in [a+Vector3(-1.5,0,0),b+Vector3(1.5,0,0),a+Vector3(1.5,0,0),a+Vector3(-1.5,0,0),b+Vector3(-1.5,0,0),b+Vector3(1.5,0,0)]:st.add_vertex(v)
 st.generate_normals();var ramp=MeshInstance3D.new();add_child(ramp);ramp.mesh=st.commit();ramp.create_trimesh_collision();ramp.hide();ramp.name="GymStairCollision"
 for i in 20:
  var q=a.lerp(b,(i+1.0)/20)+Vector3(0,-.09,.25)
  box(q,Vector3(3,.18,.5),concrete)
  box(q+Vector3(0,.095,.20),Vector3(3,.01,.04),paper)
 for side in [-1,1]:
  tube(a+Vector3(side*1.5,1,0),b+Vector3(side*1.5,1,0),.045,metal)
  for i in 6:
   var q=a.lerp(b,i/5.0)+Vector3(side*1.5,0,0);tube(q,q+Vector3.UP,.035,metal)

func gym_details():
 var floor_y=-40.89
 var oak=material(Color(.43,.28,.16),0,.8)
 box(Vector3(49,floor_y-.025,-892),Vector3(51,.05,35),rubber)
 box(Vector3(29,floor_y+.008,-899),Vector3(9,.015,7),oak)
 for x in [34,40,46]:box(Vector3(x,floor_y+.008,-889),Vector3(2,.015,3),material(Color(.12,.25,.23)))
 for x in [58,65]:
  box(Vector3(x,floor_y+.48,-896),Vector3(3,.12,.6),oak,true)
  for dx in [-1,1]:box(Vector3(x+dx,floor_y+.22,-896),Vector3(.12,.44,.5),metal)
 box(Vector3(29,floor_y+.55,-897),Vector3(3.4,1.1,1.1),oak,true)
 box(Vector3(29,floor_y+1.14,-897),Vector3(3.6,.12,1.2),dark)
 box(Vector3(29.7,floor_y+1.45,-897),Vector3(.6,.45,.09),dark)
 for x in [60,64,68]:
  box(Vector3(x,floor_y+.035,-891),Vector3(1.4,.07,3),material(Color(.16,.4,.3)))
  cylinder(Vector3(x,floor_y+.3,-892),.22,.5,dark)
 for x in [34,40,46]:
  var q=Vector3(x,floor_y,-889)
  box(q+Vector3(0,.15,0),Vector3(.9,.3,1.7),dark,true)
  tube(q+Vector3(0,.2,-.5),q+Vector3(0,1.25,0),.07,metal)
  box(q+Vector3(0,1.2,0),Vector3(.45,.12,.5),rubber)
  tube(q+Vector3(0,.2,.6),q+Vector3(0,1.4,.6),.05,metal)
  tube(q+Vector3(-.4,1.4,.6),q+Vector3(.4,1.4,.6),.045,metal)
  for side in [-1,1]:box(q+Vector3(side*.3,.45,.1),Vector3(.25,.08,.15),rubber)
 for x in [35,47,59]:
  for dx in [-1,1]:tube(Vector3(x+dx,floor_y,-904),Vector3(x+dx,floor_y+2.4,-904),.065,metal)
  tube(Vector3(x-1,floor_y+2.4,-904),Vector3(x+1,floor_y+2.4,-904),.065,metal)
 box(Vector3(49,floor_y+.65,-907),Vector3(17,.15,.65),metal,true)
 for i in 16:
  var q=Vector3(41+i,floor_y+.86,-907)
  tube(q+Vector3(-.2,0,0),q+Vector3(.2,0,0),.045,metal)
  for dx in [-.2,.2]:ellipsoid(q+Vector3(dx,0,0),Vector3(.12,.17,.17),dark)
