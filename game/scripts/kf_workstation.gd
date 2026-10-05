extends Control
const Simulation=preload("res://scripts/kf_simulation.gd")
const Display=preload("res://scripts/kf_display.gd")
var lab
var run=Simulation.new()
var viewport: SubViewport
var container: SubViewportContainer
var scene: Node3D
var camera: Camera3D
var model: Node3D
var target=Vector3(1.6,2,-.6)
var distance:=25.0
var yaw:=.12
var pitch:=.22
var dragging:=false
var selected: OptionButton
var flow: SpinBox
var release: SpinBox
var speed: OptionButton
var batch: LineEdit
var batch_id:="Batch 001"
var records: Array=[]
var history: RichTextLabel
var side: PanelContainer
var status_label: Label
var start_button: Button
var insert_button: Button
var blank_button: Button
var computer: Control
var instrument: Control
var plotted: Control
var particles: Array=[]
var phase:=0.0
var electron_phase:=0.0
var electron_speed:=.012
var refresh:=0.0
var recorded:=false
var blank:=80.0
var old_paused:=false
var old_enabled:=true
var old_physics:=true
var old_mouse:=Input.MOUSE_MODE_CAPTURED
var hovered: Node3D
var hover_materials: Array=[]
var electron_toggle: CheckButton
var electron_routes: Array=[]
var gas_routes: Array=[]
var bench: Node3D
var panning:=false
var looking:=false
func initialize(owner_lab) -> void:
	lab=owner_lab;z_index=100;set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);mouse_filter=Control.MOUSE_FILTER_STOP;hide()
	container=SubViewportContainer.new();container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);container.stretch=true;add_child(container)
	viewport=SubViewport.new();viewport.size=Vector2i(1280,720);viewport.msaa_3d=Viewport.MSAA_4X;viewport.own_world_3d=not (lab is Node3D);
	if lab is Node3D:viewport.world_3d=lab.get_world_3d()
	viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS;container.add_child(viewport)
	scene=Node3D.new();viewport.add_child(scene)
	var environment=WorldEnvironment.new();var env=Environment.new();env.background_mode=Environment.BG_COLOR;env.background_color=Color("172d37");env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.ambient_light_color=Color(.8,.88,1);env.ambient_light_energy=.8;environment.environment=env;scene.add_child(environment)
	var light=DirectionalLight3D.new();light.rotation_degrees=Vector3(-35,-25,0);light.light_energy=1.8;scene.add_child(light)
	model=load("res://art/kf/kf-station.glb").instantiate();scene.add_child(model)
	preload("res://scripts/kf_layout.gd").apply(model)
	camera=Camera3D.new();camera.fov=33;scene.add_child(camera);camera.current=true;update_camera()
	instrument=make_display(true,"CoulometerDisplay");computer=make_display(false,"ComputerDisplay")
	for spec in [["generator",Vector3(-.32,1.9,.1),Vector3(.75,2.6,.75)],["indicator",Vector3(.6,1.9,.3),Vector3(.5,3,.5)],["vial",Vector3(-3.9,1.5,-1.2),Vector3(.9,1.7,.9)],["coulometer",Vector3(3.7,2.15,-1.8),Vector3(2.5,1.9,1)],["computer",Vector3(10.2,3.8,.2),Vector3(5.1,3.4,.4)],["argon",Vector3(-6.1,1.7,-1.2),Vector3(.9,3,.9)],["vessel",Vector3(0,1.5,0),Vector3(2.5,2.5,2.5)],["start",Vector3(3.7,1.37,-1.20),Vector3(.7,.25,.12)]]:
		var area=Area3D.new();area.set_meta("part",spec[0]);area.position=spec[1];scene.add_child(area);var shape=CollisionShape3D.new();var box=BoxShape3D.new();box.size=spec[2]
		if spec[0]=="vessel":area.position.y=.2;box.size.y=.3
		shape.shape=box;area.add_child(shape)
	build_ui();build_particles();container.gui_input.connect(view_input)
	if FileAccess.file_exists("user://kf_results.json"):
		var saved=JSON.parse_string(FileAccess.get_file_as_string("user://kf_results.json"))
		if saved is Array:records=saved
	show_history();set_process(true)
	viewport.render_target_update_mode=SubViewport.UPDATE_DISABLED
func make_display(is_instrument: bool,node_name: String) -> Control:
	var surface=SubViewport.new();surface.size=Vector2i(1024,640);surface.transparent_bg=false;surface.render_target_update_mode=SubViewport.UPDATE_ALWAYS;add_child(surface)
	var display=Display.new();display.size=Vector2(1024,640);display.instrument=is_instrument;display.run=run;surface.add_child(display)
	var node=model.find_child(node_name,true,false)
	if node is MeshInstance3D:
		var mat=StandardMaterial3D.new();mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;mat.albedo_texture=surface.get_texture();mat.uv1_scale=Vector3(1,-1,1);mat.uv1_offset=Vector3(0,1,0);mat.texture_filter=BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS;mat.cull_mode=BaseMaterial3D.CULL_DISABLED;node.material_override=mat
	return display
func button(parent: Node,text: String,callback: Callable) -> Button:
	var b=Button.new();b.text=text;b.pressed.connect(callback);parent.add_child(b);return b
func build_ui() -> void:
	var top=HBoxContainer.new();top.position=Vector2(16,14);add_child(top)
	button(top,"E · Return to lab",close)
	button(top,"Full setup",func():target=Vector3(1.6,2,-.6);distance=25;side.hide();update_camera())
	button(top,"Vials / Computer",func():side.visible=not side.visible)
	start_button=button(top,"Start",start_run)
	electron_toggle=CheckButton.new();electron_toggle.text="Electron flow";electron_toggle.button_pressed=true;top.add_child(electron_toggle)
	speed=OptionButton.new();for n in [1,10,30,60]:speed.add_item(str(n)+"×")
	speed.select(1);top.add_child(speed)
	status_label=Label.new();status_label.position=Vector2(20,62);add_child(status_label)
	var help=Label.new();help.text="Left drag: orbit · Middle/Shift drag: pan · Right drag: look · Right + WASD/QZ: fly · Wheel: zoom toward cursor";help.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT);help.position=Vector2(20,-35);add_child(help)
	side=PanelContainer.new();side.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT);side.position=Vector2(-430,100);side.size=Vector2(410,540);add_child(side)
	var style=StyleBoxFlat.new();style.bg_color=Color("102337");style.border_color=Color("456180");style.set_border_width_all(1);style.set_content_margin_all(10);side.add_theme_stylebox_override("panel",style)
	var scroll=ScrollContainer.new();scroll.custom_minimum_size=Vector2(410,540);side.add_child(scroll);var stack=VBoxContainer.new();stack.size_flags_horizontal=Control.SIZE_EXPAND_FILL;scroll.add_child(stack)
	button(stack,"Close panel",func():side.hide())
	selected=OptionButton.new();for v in Simulation.VIALS:selected.add_item("%s · %.3f g · %.0f ppm"%[v.id,v.mass,v.ppm])
	stack.add_child(selected);selected.item_selected.connect(func(i):release.value=Simulation.VIALS[i].k)
	var label=Label.new();label.text="Argon mL/min · release constant / min";stack.add_child(label)
	flow=SpinBox.new();flow.min_value=40;flow.max_value=60;flow.value=50;stack.add_child(flow)
	release=SpinBox.new();release.min_value=.1;release.max_value=5;release.step=.05;release.value=1.05;stack.add_child(release)
	insert_button=button(stack,"Insert prepared vial",insert_vial)
	batch=LineEdit.new();batch.text="Batch 001";batch.placeholder_text="Batch ID";stack.add_child(batch)
	button(stack,"New batch",func():batch.text="Batch %03d"%(records.size()+1))
	button(stack,"Abort run",func():run.abort())
	blank_button=button(stack,"Use measured blank",func():blank=run.gross())
	# Plot remains on the large model screen; the side pane is reserved for records.
	history=RichTextLabel.new();history.custom_minimum_size=Vector2(390,220);history.fit_content=true;stack.add_child(history)
	var note=Label.new();note.text="Approximate teaching model. 10 mL perfect mixing.\nGradual sample release; 400 mA maximum.\nResting drift 3 µg/min; 80 µg vial blank.\nResults retained locally. Colour is illustrative.";stack.add_child(note);side.hide()
func insert_vial() -> void:
	if run.status=="running":return
	run=Simulation.new(selected.selected,flow.value,blank);run.vial.k=release.value;recorded=false;instrument.run=run;computer.run=run;side.hide()
func start_run() -> void:
	batch_id=batch.text.strip_edges();run.start()
func show_history() -> void:
	history.text="BATCHES & PAST RESULTS\n"
	for i in range(records.size()-1,-1,-1):
		var r=records[i];history.text+="%s · %s\n%s\n"%[r.batch,r.id,r.result]
func open() -> void:
	old_paused=lab.paused;old_enabled=lab.player.enabled;old_mouse=Input.mouse_mode
	old_physics=lab.player.is_physics_processing();lab.player.set_physics_process(false)
	lab.paused=true;lab.player.enabled=false;lab.prompt.text="";Input.mouse_mode=Input.MOUSE_MODE_VISIBLE;viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS;show();set_process(true)
func close() -> void:
	if not visible:return
	hide();looking=false;panning=false;dragging=false;highlight("");set_process(true);viewport.render_target_update_mode=SubViewport.UPDATE_DISABLED;lab.paused=old_paused;lab.player.enabled=old_enabled;lab.player.set_physics_process(old_physics);Input.mouse_mode=old_mouse
func _input(event: InputEvent) -> void:
	if not visible:return
	if event is InputEventKey and event.pressed and not event.echo and event.physical_keycode in [KEY_E,KEY_ESCAPE]:
		if get_viewport().gui_get_focus_owner() is LineEdit and event.physical_keycode==KEY_E:return
		close();get_viewport().set_input_as_handled()
func use_lab_scene(station: Node3D) -> void:
	bench=station
	# Share the real laboratory world, but keep the simulation's source meshes hidden.
	for node in scene.get_children():
		if node is WorldEnvironment:node.queue_free()
		elif node is Area3D:
			var proxy=node.duplicate();proxy.collision_layer=8;bench.model.add_child(proxy);node.collision_layer=0
		elif node is DirectionalLight3D:node.hide()
	scene.hide()
	assert(viewport.world_3d==lab.get_world_3d())
	update_camera()
func camera_offset() -> Vector3:
	return Vector3(sin(yaw)*cos(pitch),sin(pitch),cos(yaw)*cos(pitch))*distance
func update_camera() -> void:
	var eye=target+camera_offset()
	camera.position=bench.to_global(eye*.15) if bench else eye
	camera.look_at(bench.to_global(target*.15) if bench else target)
func zoom_at(point: Vector2,amount: float) -> void:
	var ray=camera.project_ray_normal(point*Vector2(viewport.size)/container.size)
	if bench:ray=bench.global_basis.inverse()*ray
	target+=ray*distance*amount;update_camera()
func view_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index==MOUSE_BUTTON_WHEEL_UP and event.pressed:zoom_at(event.position,.1)
		if event.button_index==MOUSE_BUTTON_WHEEL_DOWN and event.pressed:zoom_at(event.position,-.1)
		if event.button_index==MOUSE_BUTTON_MIDDLE:panning=event.pressed
		if event.button_index==MOUSE_BUTTON_RIGHT:looking=event.pressed
		if event.button_index==MOUSE_BUTTON_LEFT:
			dragging=event.pressed
			if event.pressed:
				var hit=pick(event.position)
				if not hit.is_empty():
					var part: String=hit.collider.get_meta("part","")
					if event.double_click:target=bench.to_local(hit.position)/.15 if bench else hit.collider.position;distance=4 if part in ["generator","indicator"] else 7;side.hide();update_camera()
					elif part=="start":start_run()
					elif part=="coulometer":target=Vector3(3.7,2.28,-1.285);distance=5;yaw=0;pitch=0;side.hide();update_camera()
					elif part in ["vial","computer"]:side.show()
	elif event is InputEventMouseMotion:
		if panning or (dragging and event.shift_pressed):
			var basis=camera.global_basis
			if bench:basis=bench.global_basis.inverse()*basis
			target+=(-basis.x*event.relative.x+basis.y*event.relative.y)*distance*.0015;update_camera()
		elif looking:
			var eye=target+camera_offset();yaw-=event.relative.x*.005;pitch=clampf(pitch+event.relative.y*.005,-1.5,1.5);target=eye-camera_offset();update_camera()
		elif dragging:yaw-=event.relative.x*.008;pitch=clampf(pitch+event.relative.y*.008,-1.5,1.5);update_camera()
		else:
			var hit=pick(event.position);highlight(str(hit.collider.get_meta("part","")) if not hit.is_empty() else "")
func pick(point: Vector2) -> Dictionary:
	var uv=point*Vector2(viewport.size)/container.size;var origin=camera.project_ray_origin(uv)
	var query=PhysicsRayQueryParameters3D.create(origin,origin+camera.project_ray_normal(uv)*100);query.collide_with_areas=true;query.collide_with_bodies=false
	if bench:query.collision_mask=8
	return scene.get_world_3d().direct_space_state.intersect_ray(query)
func highlight(part: String) -> void:
	var node=(bench.model if bench else model).find_child(part,true,false) if part!="" else null
	if node==hovered:return
	for item in hover_materials:item[0].material_override=item[1]
	hover_materials.clear();hovered=node
	if node==null:return
	for child in node.find_children("*","MeshInstance3D",true,false):
		if str(child.name).ends_with("Display"):continue
		var mat=child.get_active_material(0)
		if mat is StandardMaterial3D:
			var vivid=mat.duplicate();vivid.emission_enabled=true;vivid.emission=Color(.12,.28,.25);vivid.emission_energy_multiplier=.5;hover_materials.append([child,child.material_override]);child.material_override=vivid
func particle(color: Color,radius: float=.045) -> MeshInstance3D:
	var node=MeshInstance3D.new();var sphere=SphereMesh.new();sphere.radius=radius;sphere.height=radius*2;sphere.radial_segments=12;sphere.rings=6;node.mesh=sphere;var mat=StandardMaterial3D.new();mat.albedo_color=color;node.material_override=mat;scene.add_child(node);return node
func build_particles() -> void:
	for points in [[Vector3(-5.3,3,-1.2),Vector3(-4.4,3,-1.2),Vector3(-3.98,2.85,-1.2)],[Vector3(-3.98,2.85,-1.2),Vector3(-3.98,1.85,-1.2)],[Vector3(-3.8,1.96,-1.2),Vector3(-3.8,2.65,-1.2)],[Vector3(-3.8,2.65,-1.2),Vector3(-3.3,3.9,-1.2),Vector3(-2.05,4,.05)],[Vector3(-2.05,4,.05),Vector3(-1.74,3.9,.05),Vector3(-1.56,3.7,.05),Vector3(-.8,.60,.05)]]:
		var curve=Curve3D.new()
		for i in points.size():
			var tangent: Vector3=(points[mini(i+1,points.size()-1)]-points[maxi(i-1,0)])/6 if points.size()==3 else Vector3.ZERO
			curve.add_point(points[i],-tangent,tangent)
		var arrows: Array=[]
		for i in 2:
			var arrow=MeshInstance3D.new();var cone=CylinderMesh.new();cone.top_radius=0;cone.bottom_radius=.07;cone.height=.18;arrow.mesh=cone
			var mat=StandardMaterial3D.new();mat.albedo_color=Color("ffe7a1");mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;arrow.material_override=mat;scene.add_child(arrow);arrows.append(arrow);arrow.hide()
		gas_routes.append({"curve":curve,"arrows":arrows})
	for route in [[Vector3(-.035,.70,.1),Vector3(-.035,3.28,.1)],[Vector3(-.035,3.28,.1),Vector3(.3,3.9,-.2),Vector3(2.2,3.7,-2.6),Vector3(3.1,2.7,-2.6),Vector3(3.1,2.2,-2.48)],[Vector3(3.65,2.2,-2.48),Vector3(3.65,2.9,-2.8),Vector3(1.9,4.2,-2.8),Vector3(-.8,4,-.2),Vector3(-.565,3.28,.1)],[Vector3(-.565,3.28,.1),Vector3(-.565,1.01,.1),Vector3(-.43,.94,.135)]]:
		var curve=Curve3D.new()
		for i in route.size():
			var tangent: Vector3=(route[mini(i+1,route.size()-1)]-route[maxi(i-1,0)])/6 if route.size()>3 else Vector3.ZERO
			curve.add_point(route[i],-tangent,tangent)
		var arrows: Array=[]
		for i in 2:
			var arrow=MeshInstance3D.new();var cone=CylinderMesh.new();cone.top_radius=0;cone.bottom_radius=.055;cone.height=.15;arrow.mesh=cone
			var mat=StandardMaterial3D.new();mat.albedo_color=Color("ffb4ac") if electron_routes.size()<2 else Color("9cd5ff");mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;arrow.material_override=mat;scene.add_child(arrow);arrows.append(arrow)
		electron_routes.append({"curve":curve,"arrows":arrows})
	for i in 12:particles.append(particle(Color(.83,.88,.84),.025))
	for i in 2:particles.append(particle(Color(.42,.72,.48),.023))
	for i in 4:
		var atom=particle(Color("ed3535"));particles.append(atom);var tag=Label3D.new();tag.text="I⁻";tag.font_size=40;tag.pixel_size=.002;tag.position.y=.13;tag.billboard=BaseMaterial3D.BILLBOARD_ENABLED;tag.no_depth_test=true;atom.add_child(tag)
	for i in 2:
		var atom=particle(Color("9ccc77"));particles.append(atom);var tag=Label3D.new();tag.text="BH⁺";tag.font_size=38;tag.pixel_size=.002;tag.position.y=.12;tag.billboard=BaseMaterial3D.BILLBOARD_ENABLED;atom.add_child(tag)
func _process(delta: float) -> void:
	if not visible and lab.paused:return
	if visible and looking:
		var move=Vector3(float(Input.is_physical_key_pressed(KEY_D))-float(Input.is_physical_key_pressed(KEY_A)),float(Input.is_physical_key_pressed(KEY_Q))-float(Input.is_physical_key_pressed(KEY_Z)),float(Input.is_physical_key_pressed(KEY_S))-float(Input.is_physical_key_pressed(KEY_W)))
		var basis=camera.global_basis
		if bench:basis=bench.global_basis.inverse()*basis
		target+=basis*move*delta*4;update_camera()
	phase+=delta;run.step(minf(delta,.1)*([1,10,30,60][speed.selected] if visible else 1)/60.0)
	# Compress the rate range for legibility; idle is deliberately very slow.
	electron_speed=.012+.11*sqrt(maxf(0,run.rate-3)/100.0)
	electron_speed=minf(electron_speed,.5)
	electron_phase=fmod(electron_phase+delta*electron_speed,1.0)
	for route in electron_routes+gas_routes:
		var length: float=route.curve.get_baked_length()
		for i in route.arrows.size():
			var arrow=route.arrows[i];arrow.visible=run.status=="running" if route in gas_routes else electron_toggle.button_pressed
			var offset: float=fmod((phase*.22 if route in gas_routes else electron_phase)+i*.5,1.0)*length
			arrow.position=route.curve.sample_baked(offset)
			var direction: Vector3=route.curve.sample_baked(minf(offset+.01,length))-route.curve.sample_baked(maxf(offset-.01,0))
			if direction.length()>.0001:arrow.quaternion=Quaternion(Vector3.UP,direction.normalized())
	for i in 12:
		particles[i].visible=run.status=="running";particles[i].position=Vector3(-.8+.03*sin(phase+i),.64+fmod(phase*.35+i*.06,.7),.05)
	for i in 2:particles[12+i].position=Vector3(-.43,.96+fmod(phase*.14+i*.3,.5),.14)
	var q=fmod(phase/12,1.0);var a=Vector3(.34,.65,.48);var b=Vector3(.34,.93,.48);var c=Vector3(.84,.93,.48);var d=Vector3(.84,.65,.48)
	var pos=a.lerp(b,q*4) if q<.25 else (b.lerp(c,(q-.25)*4) if q<.5 else (c.lerp(d,(q-.5)*4) if q<.75 else d.lerp(a,(q-.75)*4)))
	for i in 2:
		var atom=particles[14+i];atom.position=pos+Vector3((i-.5)*(.065 if q>=.25 and q<.5 else .16),0,0);atom.material_override.albedo_color=Color("9e3824") if q>=.25 and q<.5 else Color("ed3535");atom.get_child(0).text=("I₂" if i==0 else "") if q>=.25 and q<.5 else "I⁻"
	for i in 2:
		var atom=particles[16+i];var t=fmod(phase/7,1.0);atom.position=Vector3(-1.05+i*.16,.45,.45).lerp(Vector3(-.62,.71,.25),t*2) if t<.5 else Vector3(-.62,.71,.25).lerp(Vector3(-1.1,.42,.55),(t-.5)*2)+Vector3((i-.5)*.06,0,0);atom.material_override.albedo_color=Color("ed3535") if t<.5 else Color("9e3824");atom.get_child(0).text="I⁻" if t<.5 else ("I₂" if i==0 else "")
	for i in 2:
		var atom=particles[18+i];var t=fmod(phase/9,1.0);atom.position=Vector3(-.95,1.2+i*.16,.24).lerp(Vector3(-.43,.96,.135),t*2) if t<.5 else Vector3(-.43,.96,.135).lerp(Vector3(-.85,1.18+i*.16,.25),(t-.5)*2);atom.get_child(0).text="BH⁺" if t<.5 else "B"
	var stir=model.find_child("*magnetic*stir*bar*",true,false)
	if stir:stir.rotation.y+=delta*4
	refresh+=delta
	if refresh<.15:return
	refresh=0;instrument.queue_redraw();computer.queue_redraw()
	start_button.disabled=run.status!="ready";insert_button.disabled=run.status=="running";blank_button.disabled=not(run.status=="complete" and run.vial.get("blank",false))
	status_label.text="%s · %s · %.2f min · %.1f µg/min · %.1f mV"%[run.vial.id,run.status,run.t,run.rate,run.voltage]
	var powder=model.find_child("SamplePowder",true,false)
	if powder:
		powder.visible=not run.vial.get("blank",false)
		for grain in powder.get_children():
			if grain is MeshInstance3D:
				var mat=StandardMaterial3D.new();mat.albedo_color=run.vial.color.lerp(Color("e26724"),1-run.solid/run.total) if run.vial.get("orange",false) else run.vial.color;mat.emission_enabled=run.vial.get("glow",false);mat.emission=mat.albedo_color;mat.emission_energy_multiplier=.4;grain.material_override=mat
	if run.status=="complete" and not recorded:
		recorded=true;records.append({"batch":batch_id,"id":run.vial.id,"result":"%.3f g · %.2f µg · %.1f ppm · %.2f min"%[run.vial.mass,run.corrected(),run.ppm(),run.t]});if records.size()>200:records.pop_front()
		var file=FileAccess.open("user://kf_results.json",FileAccess.WRITE);if file:file.store_string(JSON.stringify(records))
		show_history()
