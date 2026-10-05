extends "res://scripts/lab_props.gd"
var economy
var doors={}
var signs={}
var home_lab
func build(e):
 economy=e;init_materials();name="NeighborApartments"
 var a=get_parent()
 # Purchase markers stand on the wall beside the piano and beside the front entrance.
 economy.target(self,"buy_piano","Buy neighbor apartment · USD $100,000",Vector3(5.95,1.3,4.87),Vector3(.7,.6,.12))
 economy.target(self,"buy_hall","Buy other neighbor apartment · USD $100,000",Vector3(-2.35,1.3,-1.47),Vector3(.7,.6,.12))
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=128 if absf(to_local(mesh.global_position).z-5.0)<.02 else 4
func open_room(id):
 if doors.has(id):return
 doors[id]=true
 if signs.has(id):signs[id].hide()
 for area in find_children("*","Area3D",false,false):
  if area.get_meta("interaction","")==id:area.collision_layer=0
 var a=get_parent();var piano=id=="buy_piano"
 var old=a.get_node("PurchaseWallPiano" if piano else "PurchaseWallHall")
 old.hide();old.collision_layer=0
 var wall=material(Color(.83,.8,.71),0,.9)
 var z=5.0 if piano else -1.6;var lo=0.0 if piano else -3.2;var hi=6.6 if piano else 1.8;var centre=5.95 if piano else -2.35
 for span in [Vector2(lo,centre-.55),Vector2(centre+.55,hi)]:
  if span.y>span.x:box(Vector3((span.x+span.y)*.5,1.35,z),Vector3(span.y-span.x,2.7,.14),wall,true)
 box(Vector3(centre,2.5,z),Vector3(1.1,.4,.14),wall,true)
 var origin=Vector3(3.3,0,7.65) if piano else Vector3(-3.5,0,-4.4);var size=Vector2(6.6,5.3) if piano else Vector2(7,5.6)
 box(origin+Vector3(0,-.1,0),Vector3(size.x,.2,size.y),material(Color(.49,.33,.19),0,.8),true)
 box(origin+Vector3(0,2.8,0),Vector3(size.x,.2,size.y),wall,true)
 for x in [-size.x*.5,size.x*.5]:box(origin+Vector3(x,1.35,0),Vector3(.14,2.7,size.y),wall,true)
 box(origin+Vector3(0,1.35,(1 if piano else -1)*size.y*.5),Vector3(size.x,2.7,.14),wall,true)
 # Close the remaining shared boundary outside the purchased connection.
 if not piano:box(Vector3(-5.1,1.35,-1.6),Vector3(3.8,2.7,.14),wall,true)
 if piano:
  home_lab=preload("res://scripts/apartment_lab.gd").new();add_child(home_lab);home_lab.build(economy.lab)
 else:
  var cave=preload("res://scripts/man_cave.gd").new();add_child(cave);cave.build(economy)
 var lamp=OmniLight3D.new();add_child(lamp);lamp.position=origin+Vector3(0,2.3,0);lamp.light_color=Color(1,.76,.48);lamp.light_energy=.8;lamp.omni_range=6;lamp.light_cull_mask=4
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=128 if absf(to_local(mesh.global_position).z-5.0)<.02 else 4
func wood_mat():return material(Color(.39,.24,.13),0,.7)
