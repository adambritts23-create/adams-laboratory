extends "res://scripts/lab_props.gd"
func install(lab: Node3D) -> void:
	name="LaboratoryRefinements";lab.room.add_child(self);init_materials()
	var axel: Node3D=lab.room.actors[1]
	var target:=Area3D.new();target.name="AxelInteraction";target.collision_layer=4;target.collision_mask=0
	target.set_meta("interaction","axel");target.set_meta("title","Talk to Axel");axel.add_child(target)
	var shape:=CollisionShape3D.new();var capsule:=CapsuleShape3D.new();capsule.radius=.34;capsule.height=1.70;shape.shape=capsule;shape.position.y=.88;target.add_child(shape)
	powder_shelf()
func powder_shelf() -> void:
	var shelf:=Node3D.new();shelf.name="PowderChemicalShelf";add_child(shelf)
	var first:=get_child_count()
	# New shelving on the right wall beside the visitor, leaving the aisle clear.
	for z in [8.25,9.85]:box(Vector3(5.43,1.13,z),Vector3(.08,2.26,.08),metal,true)
	for height in [.57,1.18,1.79]:
		box(Vector3(5.12,height,9.05),Vector3(.74,.055,1.70),worn,true)
		box(Vector3(5.48,height+.21,9.05),Vector3(.04,.40,1.70),dark)
	plaque("DRY CHEMICALS / POWDERS",Vector3(4.72,2.22,9.05),Vector2(1.63,.23),-PI/2,true)
	var labels: Array[String]=["NaCl\nSODIUM CHLORIDE","CaCO3\nCALCIUM CARBONATE","NaHCO3\nSODIUM BICARBONATE"]
	var powder:=material(Color(.83,.81,.73),0,.98)
	var carton:=material(Color(.50,.39,.23),0,.95)
	for level in 3:
		var floor_y: float=[.60,1.21,1.82][level]
		for column in 3:
			var pos:=Vector3(5.05,floor_y,8.52+column*.53)
			var text: String=labels[(column+level)%3]
			if column==0:
				var powder_vessel:=vessel("beaker",pos,.55)
				var powder_start:=get_child_count()
				cylinder(pos+Vector3(0,.037,0),.087,.070,powder)
				for grain in 20:
					var a:=grain*2.399
					ellipsoid(pos+Vector3(cos(a)*.066,.075+sin(grain)*.004,sin(a)*.066),Vector3(.015,.009,.015),powder)
				for grain_node in get_children().slice(powder_start):grain_node.reparent(powder_vessel)
			elif column==1:
				cylinder(pos+Vector3(0,.12,0),.10,.24,material(Color(.78,.77,.69),0,.72))
				cylinder(pos+Vector3(0,.252,0),.108,.035,rubber)
			else:
				box(pos+Vector3(0,.14,0),Vector3(.21,.28,.26),carton)
				box(pos+Vector3(0,.282,0),Vector3(.215,.012,.265),paper)
			var sticker:=box(pos+Vector3(-.12,.14,0),Vector3(.012,.15,.43),paper)
			sticker.name="PowderLabel"
			label_at(text+("\nPOWDER" if column==0 else "\nREAGENT / SEALED"),pos+Vector3(-.13,.14,0),32,Color(.04,.04,.035),.00085).rotation.y=-PI/2
	var light:=OmniLight3D.new();light.position=Vector3(4.5,2.1,9.05);light.light_color=Color(.85,.83,.72);light.light_energy=.7;light.omni_range=2.5;add_child(light)

	for node in get_children().slice(first):node.reparent(shelf)
	shelf.position.z=-.35
