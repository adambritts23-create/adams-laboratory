extends "res://scripts/lab_props.gd"
func build(route):
 init_materials();name="EntranceWeaponDisplay";position.x=.95
 var rack=material(Color(.19,.22,.20),.25,.7)
 # Apartment hallway's long north wall, clear of the entrance and bathroom doorway.
 box(Vector3(-1.25,1.73,-1.46),Vector3(2.55,1.28,.07),rack)
 var model=route.lab.expansion.rifle();model.reparent(self,false);model.name="UsableApartmentAK47"
 model.position=Vector3(-1.25,1.7,-1.32);model.rotation.y=PI/2
 for x in [-1.6,-.95]:box(Vector3(x,1.64,-1.38),Vector3(.045,.025,.12),metal)
 var pickup=Area3D.new();add_child(pickup);pickup.name="ApartmentAKPickup";pickup.position=Vector3(-1.25,1.62,-1.26);pickup.collision_layer=4;pickup.collision_mask=0
 var shape=CollisionShape3D.new();shape.shape=BoxShape3D.new();shape.shape.size=Vector3(1.3,.55,.28);pickup.add_child(shape)
 pickup.set_meta("interaction","apartment_rifle");pickup.set_meta("title","Pick up AK-47 · usable")
 box(Vector3(-1.25,.76,-1.35),Vector3(2.30,.075,.24),material(Color(.37,.25,.14),0,.8),true)
 for x in [-2.30,-.20]:box(Vector3(x,.38,-1.30),Vector3(.07,.76,.07),metal)
 for i in 3:
  var p=Vector3(-1.95+i*.38,.86,-1.35)
  box(p,Vector3(.30,.14,.20),material(Color(.23,.29,.15),0,.9),true,"apartment_ammo","Load a 30-round magazine")
  label_at("AMMO",p+Vector3(0,.083,0),20,Color(.88,.81,.56),.0015).rotation.x=-PI/2
 for i in 6:cylinder(Vector3(-.65+i*.055,.83,-1.30),.012,.07,brass)
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=4
