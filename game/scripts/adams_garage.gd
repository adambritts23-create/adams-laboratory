extends "res://scripts/lab_props.gd"
var lab
var environment:Environment
var door:Node3D
var door_pivot:Node3D
var door_tween:Tween
var opened=false
var sample:Node3D
var liquid
var glasses:Array=[]
var last_sample_state:Array=[]
func contains(p:Vector3)->bool:
 var q=to_local(p)
 return absf(q.x)<6.6 and absf(q.z)<6.1 and q.y>-.5 and q.y<3.6
func build(route):
 lab=route.lab;name="AdamsGarage";position=Vector3(-61.5,-48,-996);init_materials()
 var wall=material(Color(.40,.46,.43),.1,.8)
 var top=material(Color(.10,.14,.14),.15,.5)
 box(Vector3(0,-.12,0),Vector3(13,.24,12),concrete,true)
 box(Vector3(11,-.04,-.5),Vector3(9,.08,6),concrete,true)
 box(Vector3(0,3.35,0),Vector3(13.4,.22,12.4),dark,true)
 for z in [-6,6]:box(Vector3(0,1.65,z),Vector3(13,3.3,.18),wall,true)
 box(Vector3(-6.5,1.65,0),Vector3(.18,3.3,12),wall,true)
 for z in [-4.5,4]:box(Vector3(6.5,1.65,z),Vector3(.18,3.3,3 if z<0 else 4),wall,true)
 box(Vector3(6.5,3.0,-.5),Vector3(.18,.6,5),wall,true)
 door=box(Vector3(6.5,1.35,-.5),Vector3(.12,2.7,5),painted,true,"garage_door","Adam's garage · open / close")
 for y in range(1,9):box(Vector3(6.58,y*.29,-.5),Vector3(.015,.025,4.9),metal).reparent(door)
 door_pivot=Node3D.new();add_child(door_pivot);door_pivot.position=Vector3(6.5,2.7,-.5);door.reparent(door_pivot)
 for x in [6.25,6.75]:box(Vector3(x,1.2,2.3),Vector3(.10,.3,.2),brass,true,"garage_door","Open / close garage")
 plaque("ADAM / GARAGE + LAB",Vector3(6.65,3.05,-.5),Vector2(3,.28),PI/2)
 # Connected wet bench, dry calculations desk and a separate wash station.
 box(Vector3(-3.5,.46,-5.25),Vector3(4.8,.92,1.2),painted,true)
 box(Vector3(-3.5,.96,-5.25),Vector3(5,.08,1.35),top,true)
 for x in [-5.3,-4.3,-3.3,-2.3,-1.3]:
  box(Vector3(x,.48,-4.635),Vector3(.85,.76,.025),wall)
  tube(Vector3(x-.2,.76,-4.59),Vector3(x+.2,.76,-4.59),.018,metal)
 sample=vessel("beaker",Vector3(-3.5,1.01,-5),1,null,"SAMPLE");sample.set_meta("protected_glass",true)
 liquid=liquid_visual(Vector3(-3.5,1.03,-5),.16,.38,Color(.40,.65,.72,.32))
 tube(Vector3(-3.1,1.03,-5.5),Vector3(-3.1,2.6,-5.5),.025,metal)
 tube(Vector3(-3.1,2.35,-5.5),Vector3(-3.5,2.35,-5),.02,metal)
 cylinder(Vector3(-3.5,2.02,-5),.036,.75,glass)
 tube(Vector3(-3.5,1.64,-5),Vector3(-3.5,1.45,-5),.009,glass)
 box(Vector3(-2.2,1.3,-5.4),Vector3(.85,.55,.08),dark,true,"garage_wet","Wet lab titration / calculations")
 label_at("WET LAB\nE · TITRATION",Vector3(-2.2,1.32,-5.35),25,Color(.7,.95,.94),.003)
 box(Vector3(-3.5,1.04,-4.55),Vector3(.7,.07,.15),brass,true,"garage_sample","Carry the current titration sample")
 box(Vector3(-5.7,.48,0),Vector3(1.2,.96,2.3),painted,true)
 box(Vector3(-5.7,.98,0),Vector3(1.3,.08,2.4),top,true)
 box(Vector3(-5.85,1.35,0),Vector3(.10,.62,1),dark,true,"garage_calculation","Calculations workstation")
 label_at("CALCULATIONS\nE · OPEN",Vector3(-5.78,1.4,0),23,Color(.7,.95,.94),.003).rotation.y=PI/2
 box(Vector3(-5.7,.48,3.5),Vector3(1.2,.96,2),painted,true)
 box(Vector3(-5.7,.99,3.5),Vector3(1.3,.08,2.1),metal,true,"garage_sink","Wash basin · empty carried contents")
 box(Vector3(-5.7,1.04,3.5),Vector3(.84,.04,.85),dark)
 tube(Vector3(-6.1,1.04,3.5),Vector3(-6.1,1.5,3.5),.025,metal)
 tube(Vector3(-6.1,1.5,3.5),Vector3(-5.7,1.5,3.5),.025,metal)
 for i in 3:
  var b=vessel("beaker",Vector3(-5.4+i*.38,1.02,-5.0),.65,null,"250 ml");glasses.append(b);lab.glassware.register_glass(b)
 box(Vector3(-2,1.15,5.75),Vector3(3.6,.7,.1),dark)
 for x in [-3,-2.5,-2,-1.5,-1]:tube(Vector3(x,1,5.65),Vector3(x,1.4,5.65),.025,metal)
 box(Vector3(-2,.9,5.4),Vector3(4,.08,.9),top,true,"garage_put","Put carried glassware on the worktop")
 box(Vector3(-5.8,1.8,-5.85),Vector3(1.0,.7,.09),dark,true,"garage_preparation","Periodic table / prepare chemical system")
 label_at("PREPARATION\nE · ELEMENTS",Vector3(-5.8,1.82,-5.79),23,Color(.7,.95,.94),.003)
 # Clear parking bay and garage storage leave the working aisle open.
 for z in [-2.2,1.2]:box(Vector3(2.1,.012,z),Vector3(6,.018,.07),paper)
 box(Vector3(2.1,.012,4.8),Vector3(2,.018,.8),dark)
 box(Vector3(2.1,.6,5.45),Vector3(1.8,1.2,.8),material(Color(.42,.055,.03),.2,.6),true)
 for y in [.3,.5,.7,.9]:
  box(Vector3(2.1,y,5.03),Vector3(1.65,.018,.04),dark)
  tube(Vector3(1.6,y+.08,4.98),Vector3(2.6,y+.08,4.98),.015,metal)
 for x in [-3.3,2.8]:
  for z in [-3,3]:
   box(Vector3(x,3.18,z),Vector3(2.1,.07,.30),material(Color(.88,.96,1),0,.8,2))
   var light=OmniLight3D.new();add_child(light);light.position=Vector3(x,2.75,z);light.light_color=Color(.88,.95,1);light.light_energy=1.7;light.omni_range=6;light.light_cull_mask=6
 for z in [-4,0,4]:box(Vector3(0,3.1,z),Vector3(13,.15,.12),metal)
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=4
 environment=Environment.new();environment.background_mode=Environment.BG_COLOR;environment.background_color=Color(.35,.42,.44);environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;environment.ambient_light_color=Color(.8,.88,.9);environment.ambient_light_energy=.65;environment.tonemap_mode=Environment.TONE_MAPPER_FILMIC
func _process(_delta):
 if liquid==null:return
 var source=lab.room.sample_liquid
 var state=[source.visible,source.fill_level,source.sediment_amount,source.liquid_color]
 if state==last_sample_state:return
 last_sample_state=state
 liquid.visible=source.visible;liquid.fill_level=source.fill_level;liquid.sediment_amount=source.sediment_amount;liquid.liquid_color=source.liquid_color;liquid.apply_visuals()
func interact(id:String)->bool:
 if not id.begins_with("garage_"):return false
 match id:
  "garage_door":
   opened=not opened
   if door_tween!=null and door_tween.is_valid():door_tween.kill()
   door_tween=create_tween();door_tween.tween_property(door_pivot,"rotation:z",-PI/2 if opened else 0.0,.7)
  "garage_wet":
   if lab.glassware.holding():lab.glassware.return_to_station("acid",to_global(Vector3(-3.5,1.01,-5)))
   else:lab.workbench.open(false)
  "garage_preparation":lab.workbench.open(true)
  "garage_calculation":
   if lab.glassware.holding():lab.glassware.return_to_station("calculation",to_global(Vector3(-5.5,1.02,.7)))
   else:lab.calculations.open()
  "garage_sample":lab.expansion.take_sample()
  "garage_sink":lab.accounting.pour(true,to_global(Vector3(-5.7,1.1,3.5)))
  "garage_put":lab.glassware.put_down(to_global(Vector3(-2,.95,5.4)))
 return true
