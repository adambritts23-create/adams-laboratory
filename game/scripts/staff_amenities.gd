extends "res://scripts/lab_props.gd"
var route
func build(r):
 route=r;init_materials();name="StaffAmenities"
 var walls=material(Color(.81,.80,.73),0,.85)
 var timber=aged(Color(.57,.39,.22),Color(.38,.25,.13),0,1)
 for side in [-1,1]:
  var x:float=side*7
  box(Vector3(x,-.12,-26),Vector3(8,.24,8),timber,true)
  box(Vector3(x,3.2,-26),Vector3(8,.15,8),walls,true)
  box(Vector3(side*11,1.6,-26),Vector3(.18,3.2,8),walls,true)
  for z in [-22,-30]:box(Vector3(x,1.6,z),Vector3(8,3.2,.18),walls,true)
  for z in [-24,-28]:
   box(Vector3(x,3.04,z),Vector3(2.8,.06,.55),material(Color(1,.95,.82),0,.7,1.5))
   var lamp=OmniLight3D.new();lamp.position=Vector3(x,2.7,z);lamp.omni_range=6;lamp.light_energy=2.0;lamp.light_color=Color(1,.95,.84);add_child(lamp)
  plaque("COFFEE / LUNCH ROOM" if side<0 else "OFFICE SPACE",Vector3(side*3.1,2.5,-28.4),Vector2(2,.30),PI/2 if side>0 else -PI/2)
 # Lunch tables and chairs, coffee counter, refrigerator, sink and pinboard.
 for z in [-24.8,-27.7]:
  box(Vector3(-7,.77,z),Vector3(2.1,.09,1.05),timber,true)
  for x in [-7.8,-6.2]:
   for dz in [-.75,.75]:
    box(Vector3(x,.44,z+dz),Vector3(.45,.08,.45),material(Color(.24,.37,.28),0,.8),true)
    box(Vector3(x,.73,z+dz+signf(dz)*.2),Vector3(.45,.5,.055),timber,true)
    for dx in [-.16,.16]:box(Vector3(x+dx,.22,z+dz),Vector3(.045,.44,.33),metal)
  for x in [-7.5,-6.5]:cylinder(Vector3(x,.88,z),.065,.13,paper)
 box(Vector3(-10,.49,-25.5),Vector3(1.25,.98,5),material(Color(.57,.63,.55),0,.65),true)
 box(Vector3(-10,1.02,-25.5),Vector3(1.35,.08,5.1),paper)
 box(Vector3(-9.8,1.29,-24),Vector3(.65,.51,.55),dark,true,"exit_coffee","Make a coffee")
 label_at("FRESH COFFEE",Vector3(-9.8,1.38,-23.715),24,Color(.8,1,.76),.002)
 cylinder(Vector3(-9.8,1.1,-23.65),.065,.14,paper)
 box(Vector3(-10,1.08,-27),Vector3(.85,.04,.65),metal)
 tube(Vector3(-10.4,1.08,-27),Vector3(-10.4,1.4,-27),.025,metal)
 tube(Vector3(-10.4,1.4,-27),Vector3(-10.1,1.4,-27),.025,metal)
 box(Vector3(-4,1.03,-23),Vector3(.85,2.06,.72),paper,true)
 plaque("LUNCH ROOM\nTake a break",Vector3(-7,2.1,-22.12),Vector2(2.6,.65),PI)
 # Office desks with screens, task chairs and filing cabinets.
 for z in [-24,-27]:
  box(Vector3(8,.76,z),Vector3(2.7,.09,1.05),timber,true)
  for x in [6.85,9.15]:box(Vector3(x,.37,z),Vector3(.10,.74,.85),metal,true)
  box(Vector3(8,1.18,z+.2),Vector3(1.05,.61,.07),dark)
  box(Vector3(8,1.18,z+.155),Vector3(.94,.51,.012),material(Color(.11,.28,.31),0,.8,.5))
  label_at("ADAM'S LABORATORY\nOFFICE",Vector3(8,1.2,z+.14),22,Color(.8,.95,.93),.0016).rotation.y=PI
  box(Vector3(8,.83,z-.2),Vector3(.7,.025,.23),dark)
  cylinder(Vector3(8,.48,z-1),.30,.12,dark)
  box(Vector3(8,.83,z-1.2),Vector3(.57,.59,.09),dark)
 for x in [5,6]:box(Vector3(x,.82,-22.5),Vector3(.8,1.65,.6),material(Color(.40,.47,.45),.1,.7),true)
 plaque("OFFICE SPACE\nResearch / administration",Vector3(7,2.4,-22.12),Vector2(3,.65),PI)

 # Place both staff rooms east of the corridor, clear of the existing conversion hall.
 for n in get_children():
  if n is Node3D:
   if n.position.x<0:
    n.position.x=-n.position.x
    if n is Label3D and absf(n.position.x-3.1)<.1:n.rotation.y=-n.rotation.y
   else:n.position.x+=8
 # The shared lunch/office wall has a real walkable opening.
 for n in get_children():
  if n is StaticBody3D and absf(n.position.x-11)<.01 and absf(n.position.z+26)<.01:
   n.queue_free()
 box(Vector3(11,1.6,-24.5),Vector3(.18,3.2,5),walls,true)
 box(Vector3(11,1.6,-29.7),Vector3(.18,3.2,.6),walls,true)
 box(Vector3(11,2.95,-28.2),Vector3(.18,.5,2.4),walls,true)
