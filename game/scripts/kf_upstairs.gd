extends Node3D
var model: Node3D
var view
var lab
var mirrors: Array=[]
var held_index:=-1
var held: Node3D
var rack: Array=[]
func _ready() -> void:
	name="UpstairsKFStation"
	position+=transform.basis.z*.35
	set_meta("dynamic",true)
	model=preload("res://art/kf/kf-station.glb").instantiate()
	model.scale=Vector3.ONE*.15
	add_child(model)
	preload("res://scripts/kf_layout.gd").apply(model)
	var material=StandardMaterial3D.new();material.albedo_color=Color(.18,.28,.29);material.metallic=.5
	for spec in [[Vector3(.555,.085,-.27),Vector3(.32,.17,.12)],[Vector3(1.53,.07,.07),Vector3(.30,.14,.20)],[Vector3(-.585,.035,-.18),Vector3(.20,.07,.13)]]:
		var support=MeshInstance3D.new();var box_mesh=BoxMesh.new();box_mesh.size=spec[1];support.mesh=box_mesh;support.position=spec[0];support.material_override=material;add_child(support)
	interaction("kf_station","KF cell · Inspect",Vector3(0,.3,0),Vector3(.4,.6,.4))
	interaction("kf_station","Coulometer · Inspect",Vector3(.555,.36,-.27),Vector3(.36,.22,.18))
	interaction("kf_station","Computer · Inspect",Vector3(1.53,.57,.03),Vector3(.8,.6,.1))
	var start_mesh=MeshInstance3D.new();var start_box=BoxMesh.new();start_box.size=Vector3(.12,.045,.03);start_mesh.mesh=start_box;start_mesh.position=Vector3(.555,.205,-.172);var start_mat=StandardMaterial3D.new();start_mat.albedo_color=Color(.2,.85,.4);start_mat.emission_enabled=true;start_mat.emission=Color(.08,.4,.14);start_mesh.material_override=start_mat;add_child(start_mesh)
	var start_tag=Label3D.new();start_tag.text="START";start_tag.font_size=28;start_tag.pixel_size=.00065;start_tag.modulate=Color(.025,.08,.035);start_tag.outline_size=0;start_tag.position=Vector3(.555,.205,-.154);add_child(start_tag)
	interaction("kf_start","Coulometer · START titration",Vector3(.555,.205,-.172),Vector3(.16,.09,.06))
	# The button collider is in front of the general inspection collider.
	interaction("kf_place","KF heater · Place carried vial",Vector3(-.585,.20,-.05),Vector3(.22,.4,.20))
	var rack_base=MeshInstance3D.new();var rack_mesh=BoxMesh.new();rack_mesh.size=Vector3(.76,.025,.16);rack_base.mesh=rack_mesh;rack_base.material_override=material;rack_base.position=Vector3(-.82,.017,.13);add_child(rack_base)
	for i in 5:
		var vial=make_vial(i);vial.position=Vector3(-1.10+i*.14,.035,.13);add_child(vial);rack.append(vial)
		interaction("kf_pick_"+str(i),"Pick up "+preload("res://scripts/kf_simulation.gd").VIALS[i].id,vial.position+Vector3(0,.06,0),Vector3(.10,.15,.10))
func interaction(id: String,title: String,pos: Vector3,size: Vector3) -> void:
	var area=Area3D.new();area.collision_layer=4;area.collision_mask=0;area.position=pos;area.set_meta("interaction",id);area.set_meta("title",title);add_child(area)
	var shape=CollisionShape3D.new();var box=BoxShape3D.new();box.size=size;shape.shape=box;area.add_child(shape)
func make_vial(index: int) -> Node3D:
	var vial=Node3D.new()
	var data=preload("res://scripts/kf_simulation.gd").VIALS[index]
	for spec in [[.034,.11,.055,Color(.5,.75,.8,.35)],[.036,.017,.119,Color(.15,.45,.7)],[.027,.025,.025,data.color]]:
		var mesh=MeshInstance3D.new();var cylinder=CylinderMesh.new();cylinder.top_radius=spec[0];cylinder.bottom_radius=spec[0];cylinder.height=spec[1];mesh.mesh=cylinder;mesh.position.y=spec[2]
		var mat=StandardMaterial3D.new();mat.albedo_color=spec[3];if mat.albedo_color.a<1:mat.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA
		mesh.material_override=mat;vial.add_child(mesh)
	var label=Label3D.new();label.text=data.id;label.font_size=26;label.pixel_size=.0006;label.position=Vector3(0,.16,0);label.billboard=BaseMaterial3D.BILLBOARD_ENABLED;vial.add_child(label)
	return vial
func handle_vial(id: String) -> void:
	if view==null:return
	if id=="kf_start":
		if view.run.status!="ready":lab.say("Insert a fresh vial before starting another titration.",3);return
		view.start_run();lab.say("KF titration started · "+view.run.vial.id,4);return
	if id.begins_with("kf_pick_"):
		if held_index>=0:lab.say("Place the carried vial on the KF heater first.",3);return
		held_index=int(id.trim_prefix("kf_pick_"));rack[held_index].hide();held=make_vial(held_index);lab.player.camera.add_child(held);held.position=Vector3(.22,-.24,-.45)
		lab.say("Carrying "+view.Simulation.VIALS[held_index].id+" · E at the KF heater to insert",5)
	elif held_index>=0:
		if view.run.status=="running":lab.say("Wait for the current titration to finish, or abort it in the station.",4);return
		view.selected.select(held_index);view.release.value=view.Simulation.VIALS[held_index].k;view.insert_vial();rack[held_index].show();held.queue_free();held=null;held_index=-1;lab.say("Vial inserted · Aim at the coulometer START button and press E",4)
	else:lab.say("Pick up a prepared vial from the rack first.",3)
func bind_workstation(workstation,owner_lab) -> void:
	view=workstation;lab=owner_lab
	for node_name in ["CoulometerDisplay","ComputerDisplay"]:
		model.find_child(node_name,true,false).material_override=view.model.find_child(node_name,true,false).material_override
	for source in view.particles:
		var copy=source.duplicate();model.add_child(copy);mirrors.append([source,copy])
	for route in view.electron_routes+view.gas_routes:
		for source in route.arrows:
			var copy=source.duplicate();model.add_child(copy);mirrors.append([source,copy])
	view.use_lab_scene(self)
func _process(_delta: float) -> void:
	if view==null:return
	for pair in mirrors:
		pair[1].transform=pair[0].transform;pair[1].visible=pair[0].visible
		for i in pair[0].get_child_count():
			if pair[0].get_child(i) is Label3D:pair[1].get_child(i).text=pair[0].get_child(i).text
	var stir=model.find_child("*magnetic*stir*bar*",true,false)
	if stir:stir.rotation=view.model.find_child("*magnetic*stir*bar*",true,false).rotation
	var powder=model.find_child("SamplePowder",true,false);var source=view.model.find_child("SamplePowder",true,false)
	if powder and source:
		powder.visible=source.visible
		for i in mini(powder.get_child_count(),source.get_child_count()):powder.get_child(i).material_override=source.get_child(i).material_override

