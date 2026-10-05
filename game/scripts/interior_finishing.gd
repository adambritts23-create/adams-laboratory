extends "res://scripts/lab_props.gd"
func build_apartment(a):
 init_materials();name="ApartmentFinishingDetails"
 var white=material(Color(.84,.83,.76),0,.85)
 var wood=material(Color(.39,.25,.13),0,.75)
 # Skirting, curtain tracks and radiators under rear windows.
 box(Vector3(3.3,.075,4.91),Vector3(6.4,.15,.035),white)
 box(Vector3(.09,.075,2.5),Vector3(.035,.15,4.8),white)
 for z in [3.95]:
  box(Vector3(6.46,.4,z),Vector3(.12,.52,.8),white)
  for i in 9:box(Vector3(6.37,.4,z-.35+i*.087),Vector3(.055,.48,.045),white)
  tube(Vector3(6.35,2.54,z-.52),Vector3(6.35,2.54,z+.52),.019,metal)
 # Hall key shelf, hooks and a small notice frame.
 box(Vector3(.48,1.7,-1.50),Vector3(.6,.65,.06),wood)
 label_at("HEMMA\nSevallagatan 5C",Vector3(.48,1.74,-1.455),25,Color(.92,.9,.8),.0024)
 # Dining pendant.
 tube(Vector3(5.88,2.75,-1.2),Vector3(5.88,2.16,-1.2),.012,dark)
 cylinder(Vector3(5.88,2.09,-1.2),.22,.17,dark)
 # Bathroom mirror, towel rail and folded towels.
 box(Vector3(.51,1.65,-3.34),Vector3(.04,.72,.58),metal)
 tube(Vector3(.55,1.15,-2.1),Vector3(.55,1.15,-2.65),.018,metal)
 box(Vector3(.57,.94,-2.35),Vector3(.03,.42,.38),material(Color(.52,.67,.62),0,1))
 # Desk keyboard, screen, cup; cushions and a book on the coffee table.
 box(Vector3(.45,.815,1.1),Vector3(.32,.025,.13),dark)
 box(Vector3(.20,1.07,.92),Vector3(.06,.42,.58),dark)
 cylinder(Vector3(.62,.91,.53),.055,.15,white)
 for p in [Vector3(2.95,.81,4.26),Vector3(4.15,.81,4.26)]:
  var cushion=box(p,Vector3(.5,.19,.42),material(Color(.17,.26,.29),0,1));cushion.rotation.z=.12
 box(Vector3(3.45,.588,2.76),Vector3(.3,.04,.42),material(Color(.32,.13,.07),0,.9))
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=4
func build_exit(r):
 init_materials();name="StaffEntranceDetails"
 var white=material(Color(.79,.83,.78),0,.75)
 var teal=material(Color(.12,.26,.24),0,.7)
 # Wall-mounted fittings keep the central change / scan / exit route clear.
 for side in [-1,1]:
  box(Vector3(side*2.87,.12,-15.4),Vector3(.04,.24,6.8),teal)
  box(Vector3(side*2.87,.12,-27),Vector3(.04,.24,5.5),teal)
 for z in [-13.6,-28.7]:
  box(Vector3(-2.84,1.6,z),Vector3(.09,.78,1.1),teal)
  var text=label_at("PERSONALUTGÅNG\nOmklädning → Kontroll → Utgång" if z>-20 else "TACK FÖR IDAG\nParkering / Björkdal",Vector3(-2.78,1.65,z),26,Color(.94,.92,.81),.0024);text.rotation.y=PI/2
 box(Vector3(2.8,1.15,-13.5),Vector3(.18,.40,.24),white)
 box(Vector3(2.68,1.13,-13.5),Vector3(.08,.10,.10),dark)
 cylinder(Vector3(2.66,.65,-18.4),.15,.80,material(Color(.55,.025,.018),0,.55))
 tube(Vector3(2.67,1.06,-18.4),Vector3(2.5,1.02,-18.4),.025,dark)
 box(Vector3(0,.012,-29.1),Vector3(1.5,.024,1.15),rubber)
 # Timber slatted bench and shoe tray beyond the scanner.
 box(Vector3(2.56,.08,-28.5),Vector3(.65,.16,.85),rubber)
 for z in [-28.72,-28.31]:ellipsoid(Vector3(2.53,.21,z),Vector3(.25,.12,.13),dark)
 for z in [-14.6,-27.9]:
  box(Vector3(2.84,2.25,z),Vector3(.12,.18,.55),white)
  var l=OmniLight3D.new();add_child(l);l.position=Vector3(2.45,2.24,z);l.light_energy=.35;l.omni_range=2.5;l.light_color=Color(1,.91,.74)
 # Exterior welcome canopy, timber trim, lamp and planted pots.
 box(Vector3(0,2.93,-30.8),Vector3(4,.14,1.7),teal)
 for x in [-1.7,1.7]:
  cylinder(Vector3(x,.26,-31.5),.28,.52,teal)
  for i in 7:ellipsoid(Vector3(x+sin(i*2.4)*.15,.65+float(i%3)*.09,-31.5+cos(i*2.4)*.15),Vector3(.21,.32,.17),green)
 label_at("VÄLKOMMEN  ·  ADAMS LABORATORIUM",Vector3(0,2.7,-31.67),30,Color(.95,.92,.81),.004).rotation.y=PI
 for node in find_children("*","GeometryInstance3D",true,false):
  if node.position.z< -30:node.layers=2
 var flag=preload("res://scripts/swedish_flag.gd").new();r.add_child(flag);flag.position=Vector3(11,0,-37);flag.build()
