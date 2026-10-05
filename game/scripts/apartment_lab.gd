extends "res://scripts/lab_props.gd"
var lab
var liquid
var residue:Node3D
var filtrate:Node3D
var mass_label:Label3D
var last_state=[]
var plain_residue:Node3D
var calculation_liquid
var calculation_state=[]
var titration_mass:Label3D
var titration_vessel:Node3D
var result_key=""
var filtration_label:Label3D
var output_key=""
func build(world):
 lab=world;set_meta("dynamic",true);name="ApartmentLaboratory";init_materials()
 var top=material(Color(.12,.17,.18),.15,.5)
 for x in [1.35,3.3,5.25]:
  box(Vector3(x,.46,9.6),Vector3(1.9,.92,1.15),painted,true)
  box(Vector3(x,.97,9.6),Vector3(1.95,.08,1.22),top,true)
  for dx in [-.45,.45]:
   box(Vector3(x+dx,.48,8.99),Vector3(.84,.75,.025),painted)
   tube(Vector3(x+dx-.15,.75,8.96),Vector3(x+dx+.15,.75,8.96),.015,metal)
 # Preparation screen uses the same element catalog as the main lab.
 box(Vector3(1.35,1.85,10.15),Vector3(1.9,1.12,.1),dark,true,"home_periodic","Periodic table / prepare solutions")
 for e in lab.workbench.catalog.elements:
  label_at(e.symbol,Vector3(2.23-(int(e.column)-1)*.104,2.22-(int(e.row)-1)*.10,10.08),18,Color(.5,1,.8),.002).rotation.y=PI
 label_at("PERIODIC TABLE",Vector3(1.35,2.45,10.08),26,Color.WHITE,.003).rotation.y=PI
 # Burette and carried sample station.
 titration_vessel=vessel("beaker",Vector3(3.1,1.02,9.35),1,null,"TITRATION")
 titration_mass=label_at("TITRATION · prepare a sample",Vector3(3.3,1.68,10.08),24,Color(.7,1,.9),.0025);titration_mass.rotation.y=PI
 liquid=liquid_visual(Vector3(3.1,1.04,9.35),.16,.38,Color(.4,.65,.72,.32))
 tube(Vector3(3.6,1.02,9.7),Vector3(3.6,2.5,9.7),.025,metal)
 tube(Vector3(3.6,2.3,9.7),Vector3(3.1,2.3,9.35),.02,metal)
 cylinder(Vector3(3.1,1.95,9.35),.035,.7,glass)
 station("acid","TITRATION",Vector3(3.3,1.25,9.02))
 station("sample","CARRY SAMPLE",Vector3(2.65,1.05,9.02))
 # Filtration apparatus and separate collection points.
 vessel("flask",Vector3(5.1,1.02,9.55),.9)
 cylinder(Vector3(5.1,1.5,9.55),.17,.17,paper)
 tube(Vector3(5.1,1.2,9.55),Vector3(5.65,1.15,9.55),.025,rubber)
 box(Vector3(5.8,1.13,9.65),Vector3(.4,.24,.4),metal)
 station("filter","SUCTION FILTRATION",Vector3(5.3,1.27,9.02))
 filtration_label=label_at("FILTRATION · bring a sample",Vector3(5.3,1.9,10.08),22,Color(.7,1,.9),.0025);filtration_label.rotation.y=PI
 # Dry workstation, balance, transfer vessel, and basin along the side wall.
 for z in [6.1,7.45]:
  box(Vector3(.7,.46,z),Vector3(1.1,.92,1.3),painted,true)
  box(Vector3(.7,.97,z),Vector3(1.2,.08,1.35),top,true)
 box(Vector3(.27,1.45,6.1),Vector3(.10,.65,.9),dark,true,"home_calculation","Calculations workstation")
 vessel("beaker",Vector3(.85,1.02,6.1),.72)
 calculation_liquid=liquid_visual(Vector3(.85,1.035,6.1),.115,.23,Color(.45,.66,.74,.35))
 station("calculation_sample","CARRY CALCULATION",Vector3(1.12,1.1,6.35))
 label_at("CALCULATIONS",Vector3(.34,1.5,6.1),24,Color(.5,1,.9),.003).rotation.y=PI/2
 box(Vector3(.7,1.02,7.45),Vector3(.85,.09,.85),metal,true,"home_sink","Wash basin / empty carried contents")
 box(Vector3(.7,1.075,7.45),Vector3(.63,.025,.63),dark)
 tube(Vector3(.28,1.05,7.45),Vector3(.28,1.48,7.45),.022,metal)
 tube(Vector3(.28,1.48,7.45),Vector3(.7,1.48,7.45),.022,metal)
 box(Vector3(3.25,.46,6.1),Vector3(2.65,.92,1),painted,true)
 box(Vector3(3.25,.97,6.1),Vector3(2.75,.08,1.1),top,true)
 box(Vector3(2.5,1.04,6.1),Vector3(.6,.10,.55),metal,true,"home_balance","Balance / place carried sample")
 mass_label=label_at("BALANCE",Vector3(2.5,1.15,6.45),22,Color(.6,1,.8),.0025)
 station("transfer","TRANSFER SOLIDS",Vector3(3.35,1.15,6.48))
 station("residue","RESIDUE",Vector3(4.6,1.12,8.93))
 station("filtrate","FILTRATE",Vector3(5.8,1.12,8.93))
 residue=Node3D.new();add_child(residue);residue.position=Vector3(4.6,1.12,9.2);lab.economy.chunk(residue)
 plain_residue=vessel("beaker",Vector3(4.6,1.02,9.2),.7)
 filtrate=vessel("beaker",Vector3(5.8,1.02,9.2),.7)
 for item in get_children():
  if item.is_in_group("laboratory_glass"):item.set_meta("protected_glass",true);item.set_meta("fixed_apparatus",true)
 for i in 3:
  var b=vessel("beaker",Vector3(3.65+i*.38,1.02,5.95),.6,null,"250 ml");lab.glassware.register_glass(b)
 for x in [1.6,4.6]:
  box(Vector3(x,2.65,7.9),Vector3(1.8,.06,.25),material(Color(.88,.95,1),0,.7,1.2))
  var light=OmniLight3D.new();add_child(light);light.position=Vector3(x,2.3,8.3);light.light_color=Color(.9,.95,1);light.light_energy=1.2;light.omni_range=4.8;light.light_cull_mask=4;light.shadow_enabled=false
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=4
func station(id,title,p):
 # Put controls on the cabinet fascia, leaving the glassware and sediment unobstructed.
 p.y=.78
 var rear=p.z>8
 var side=p.x<1.8 and not rear
 if rear:p.z=8.93
 elif side:p.x=1.33
 else:p.z=6.66
 box(p,Vector3(.10,.18,.58) if side else Vector3(.58,.18,.10),dark,true,"home_"+id,title)
 var offset=Vector3(.06,0,0) if side else Vector3(0,0,-.06 if rear else .06)
 var sign=label_at(title,p+offset,18,Color(.75,.95,.9),.002)
 sign.rotation.y=PI/2 if side else PI if rear else 0
func interact(id):
 if not id.begins_with("home_"):return false
 match id:
  "home_periodic":lab.workbench.open(true)
  "home_acid":
   if lab.glassware.holding():lab.glassware.return_to_station("acid",to_global(Vector3(3.1,1.02,9.35)))
   else:lab.workbench.open(false)
  "home_sample":lab.expansion.take_sample()
  "home_calculation":
   if lab.glassware.holding():lab.glassware.return_to_station("calculation",to_global(Vector3(.7,1.02,6.1)))
   else:lab.calculations.open()
  "home_calculation_sample":lab.glassware.take_calculation_beaker()
  "home_filter":
   lab.expansion.use_filter()
   if lab.expansion.filtering and lab.expansion.filtering_vessel!=null:
    var sample=lab.expansion.filtering_vessel;sample.reparent(self);sample.position=Vector3(5.85,1.02,10.0)
    for mesh in sample.find_children("*","GeometryInstance3D",true,false):mesh.layers=4
  "home_residue":lab.polish.take_output("residue")
  "home_filtrate":lab.polish.take_output("filtrate")
  "home_sink":lab.accounting.pour(true,to_global(Vector3(.7,1.1,7.45)))
  "home_transfer":lab.accounting.transfer(to_global(Vector3(3.35,1.02,6.1)))
  "home_balance":
   var held=lab.accounting.held_node()
   if held!=null:
    var inv=held.get_meta("inventory",{});mass_label.text="%s g" % str(inv.get("drySolidMassG","—"));lab.glassware.put_down(to_global(Vector3(2.5,1.12,6.1)))
   else:lab.say("Place a carried sample on the balance.")
  _:return false
 return true
func _process(_dt):
 if lab==null:return
 update_titration()
 update_filtration()
 if lab.glassware.calculation_fluid!=null:calculation_state=sync_liquid(lab.glassware.calculation_fluid,calculation_liquid,calculation_state)
 var ready=lab.expansion.output_solid.visible and not lab.expansion.outputs.is_empty()
 var green=lab.economy.uranium_residue(lab.expansion.output_solid.get_meta("inventory",{}))
 residue.visible=ready and green
 plain_residue.visible=ready and not green
 filtrate.visible=lab.expansion.output_liquid.visible and not lab.expansion.outputs.is_empty()

func sync_liquid(source,destination,previous:Array)->Array:
 var keys=["visible","fill_level","sediment_amount","settling_progress","precipitation_progress","sediment_color","liquid_color","cloudiness","emission_strength"]
 var state=[]
 for key in keys:state.append(source.get(key))
 if state!=previous:
  for i in keys.size():destination.set(keys[i],state[i])
  destination.apply_visuals()
 return state


func update_titration():
 var w=lab.workbench
 var p:Dictionary={} if w.points.is_empty() else w.points[w.chosen]
 var key=str([w.serial,w.solve_count,w.chosen,w.points.size(),p.get("inventory",{}).get("drySolidMassG"),p.get("visual",{}).get("bedHeight"),lab.expansion.sample_away])
 if key==result_key:return
 result_key=key
 var accepted=not p.is_empty() and p.get("y")!=null
 liquid.visible=accepted and not lab.expansion.sample_away
 liquid.fill_level=clampf(float(p.get("volume",100))/(float(w.setup.sample.volumeMl)+float(w.setup.titrant.volumeMl))*.94,.04,.94)
 liquid.sediment_amount=clampf(float(p.get("visual",{}).get("bedHeight",0))/56.0,0,1) if accepted else 0.0
 liquid.settling_progress=minf(liquid.sediment_amount,liquid.fill_level*1.1);liquid.precipitation_progress=liquid.sediment_amount;liquid.apply_visuals()
 var inv:Dictionary=p.get("inventory",{}) if accepted else {}
 lab.accounting.annotate(titration_vessel,inv.duplicate(true))
 for mesh in titration_vessel.find_children("*","GeometryInstance3D",true,false):mesh.layers=4
 var mass=inv.get("drySolidMassG")
 titration_mass.text=("TITRATION · %.2f mL\nDry precipitate: %s" % [float(p.get("x",0)),("%.6f g" % float(mass)) if mass!=null else "unavailable"]) if accepted else "TITRATION · no accepted result"

func update_filtration():
 var e=lab.expansion
 if e.filtering:
  filtration_label.text="FILTRATION · %d%%" % mini(100,int(e.filter_time/5.0*100));return
 var key=str([e.outputs,e.output_solid.visible,e.output_liquid.visible])
 if key==output_key:return
 output_key=key
 if e.outputs.is_empty():filtration_label.text="FILTRATION · bring a sample";return
 var solid=e.output_solid.get_meta("inventory",{})
 var solution=e.output_liquid.get_meta("inventory",{})
 lab.accounting.annotate(plain_residue,solid.duplicate(true));lab.accounting.annotate(filtrate,solution.duplicate(true))
 var mass=solid.get("drySolidMassG")
 filtration_label.text="FILTERED · %s g retained" % ("%.6f" % float(mass) if mass!=null else "unknown")
