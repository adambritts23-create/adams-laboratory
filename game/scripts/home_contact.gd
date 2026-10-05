extends "res://scripts/lab_props.gd"
func build(e):
 init_materials();name="HomeContact";position=Vector3(-52.3,-48,-972.5);rotation.y=PI/2
 var timber=material(Color(.32,.19,.09),0,.8)
 for z in [-.16,.02,.20]:box(Vector3(0,.48,z),Vector3(1.8,.07,.14),timber,true)
 for y in [.76,.95]:box(Vector3(0,y,-.27),Vector3(1.8,.13,.07),timber,true)
 for x in [-.73,.73]:
  box(Vector3(x,.24,0),Vector3(.07,.48,.44),metal,true)
  box(Vector3(x,.74,-.28),Vector3(.05,.65,.05),metal,true)
 var person=preload("res://scripts/town_resident.gd").new();add_child(person);person.build(0);person.position.y=-.46;person.name="SeatedBuyer"
 # Keep the rigged upper body, replacing straight standing legs with a relaxed seated pose.
 for n in person.find_children("*","MeshInstance3D",true,false):
  if "Legs" in str(n.name) or "Feet" in str(n.name):n.hide()
 for n in person.get_children():
  if n is MeshInstance3D and n.position.y<.6:n.hide()
 var trousers=material(Color(.12,.105,.08),0,.9)
 for x in [-.12,.12]:
  tube(Vector3(x,.53,0),Vector3(x,.53,.43),.10,trousers)
  tube(Vector3(x,.53,.43),Vector3(x,.12,.46),.085,trousers)
  ellipsoid(Vector3(x,.08,.54),Vector3(.10,.075,.18),dark)
 e.target(self,"home_buyer","Sell uranium precipitate · $100/g · E",Vector3(0,.9,.25),Vector3(.9,1.3,.65))
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
