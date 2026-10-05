extends Node3D

const PlayerScript = preload("res://scripts/player.gd")
const RoomScript = preload("res://scripts/room.gd")
const SoundScript = preload("res://scripts/sound.gd")
enum Phase { FREE_EXPLORE }
var web_screens: Array=[]
var web_screen_time := 0.0
var web_frames := 0
var phase := Phase.FREE_EXPLORE
var elapsed := 0.0
var subtitle_time := 0.0
var paused := true
var current_target: Object
var player: CharacterBody3D
var room: Node3D
var sound: Node
var hud: Label
var subtitle: Label
var prompt: Label
var center: Label
var panel: PanelContainer
var menu: VBoxContainer
var controls_label: Label
var game_ui: CanvasLayer
var log_file: FileAccess
var staff_exit: Node3D
var accounting: Node3D
var zombies: Node3D
var economy
var companions
var calculations: Control
var glassware: Node3D
var polish: Node3D
var expansion: Node3D
var dialogue
var workbench: Control
var kf_workstation: Control

func _ready() -> void:
	configure_input()
	
	log_file = FileAccess.open("user://latest-run.log", FileAccess.WRITE)
	record("Launched free laboratory; native Wet Lab interface")
	var environment := WorldEnvironment.new()
	var settings := Environment.new()
	settings.background_mode = Environment.BG_COLOR
	settings.background_color = Color(0.025, 0.035, 0.04)
	settings.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	settings.ambient_light_color = Color(0.45, 0.54, 0.60)
	settings.ambient_light_energy = 0.68
	settings.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	settings.ssao_enabled=true
	settings.ssao_radius=0.5
	settings.ssao_intensity=0.8
	settings.glow_enabled=true
	settings.glow_intensity=0.35
	environment.environment = settings
	add_child(environment)
	sound = SoundScript.new()
	add_child(sound)
	room = RoomScript.new()
	add_child(room)
	print("WEB STARTUP: add_child(room)")
	player = PlayerScript.new()
	player.name = "Player"
	player.position = Vector3(0, 0.05, 9.4)
	add_child(player)
	build_ui()
	workbench = preload("res://scripts/science_workbench.gd").new()
	game_ui.add_child(workbench)
	workbench.initialize(self)
	print("WEB STARTUP: workbench.initialize(self)")
	preload("res://scripts/lab_refinements.gd").new().install(self)
	for item in room.pickups.values():
		item.hide()
		item.collision_layer = 0
	expansion=preload("res://scripts/bench_expansion.gd").new();add_child(expansion);expansion.build(self)
	calculations=preload("res://scripts/calculation_workstation.gd").new();game_ui.add_child(calculations);calculations.initialize(self)
	polish=preload("res://scripts/calculation_room_pass.gd").new();add_child(polish);polish.build(self)
	glassware=preload("res://scripts/glassware_workflow.gd").new();add_child(glassware);glassware.build(self)
	accounting=preload("res://scripts/sample_accounting.gd").new();add_child(accounting);accounting.build(self)
	staff_exit=preload("res://scripts/staff_exit.gd").new();add_child(staff_exit);staff_exit.build(self)
	print("WEB STARTUP: staff_exit=preload")
	staff_exit.initialize_home()
	print("WEB STARTUP: staff_exit.initialize_home()")
	# Start in the laboratory; the apartment remains accessible.
	economy=preload("res://scripts/world_economy.gd").new();add_child(economy);economy.build(self)
	print("WEB STARTUP: economy=preload")
	companions=preload("res://scripts/lab_companions.gd").new();add_child(companions);companions.build(self)
	print("WEB STARTUP: companions=preload")
	var zones=preload("res://scripts/world_activity.gd").new();add_child(zones);zones.initialize(self)
	dialogue=preload("res://scripts/voiced_dialogue.gd").new();add_child(dialogue);dialogue.build(self)
	staff_exit.initialize_aircraft()
	print("WEB STARTUP: staff_exit.initialize_aircraft()")
	kf_workstation=preload("res://scripts/kf_workstation.gd").new()
	game_ui.add_child(kf_workstation)
	kf_workstation.initialize(self)
	print("WEB STARTUP: kf_workstation.initialize(self)")
	var station=find_child("UpstairsKFStation",true,false)
	if station:station.bind_workstation(kf_workstation,self)
	phase = Phase.FREE_EXPLORE
	var web_nodes := find_children("*", "Node", true, false)
	var mesh_count := 0
	for node in web_nodes:
		if node is ReflectionProbe:
			node.visible=false
		if node is Light3D:
			node.shadow_enabled=false
		if node is SubViewport:
			node.msaa_3d=Viewport.MSAA_DISABLED
			node.render_target_update_mode=SubViewport.UPDATE_ONCE if node.get_camera_3d()==null else SubViewport.UPDATE_DISABLED
			if node.get_camera_3d()==null:web_screens.append(node)
		if node is GeometryInstance3D:
			mesh_count+=1
	print("WEB QUALITY: ",web_nodes.size()," nodes; ",mesh_count," meshes; reflections and shadows disabled")
	for node in web_nodes:
		if node is MeshInstance3D and node.mesh!=null:
			for surface in node.mesh.get_surface_count():
				var mat=node.get_active_material(surface)
				if mat is BaseMaterial3D:mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
	var diagnostic: String=JavaScriptBridge.eval("new URLSearchParams(location.search).get('render') || ''") if OS.has_feature("web") else ""
	if diagnostic=="off":get_viewport().disable_3d=true
	if diagnostic=="unshaded":get_viewport().debug_draw=Viewport.DEBUG_DRAW_UNSHADED
	if diagnostic=="simple":
		var simple:=StandardMaterial3D.new();simple.albedo_color=Color(.5,.6,.55);simple.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
		for node in web_nodes:
			if node is GeometryInstance3D:node.material_override=simple
	open_pause(true)
	print("WEB STARTUP: open_pause(true)")

func configure_input() -> void:
	var bindings := {"forward": [KEY_W], "back": [KEY_S], "left": [KEY_A], "right": [KEY_D], "jump": [KEY_SPACE], "sprint": [KEY_SHIFT], "crouch": [KEY_CTRL, KEY_C], "interact": [KEY_E]}
	for action in bindings:
		if not InputMap.has_action(action): InputMap.add_action(action)
		for key in bindings[action]:
			var event := InputEventKey.new()
			event.physical_keycode = key
			InputMap.action_add_event(action, event)

func record(message: String) -> void:
	print(message)
	if log_file:
		log_file.store_line(message)
		log_file.flush()

func text_label(text: String, size: int = 20) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", Color(0.83, 0.90, 0.87))
	return label

func button(text: String, action: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size.y = 42
	b.pressed.connect(action)
	menu.add_child(b)
	return b

func build_ui() -> void:
	game_ui = CanvasLayer.new()
	add_child(game_ui)
	var base := Control.new()
	base.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	base.mouse_filter = Control.MOUSE_FILTER_IGNORE
	game_ui.add_child(base)
	hud = text_label("", 17)
	hud.add_theme_color_override("font_shadow_color",Color(0,0,0,.85))
	hud.add_theme_constant_override("shadow_offset_x",1)
	hud.add_theme_constant_override("shadow_offset_y",2)
	hud.add_theme_constant_override("line_spacing",6)
	hud.position = Vector2(26, 22)
	base.add_child(hud)
	controls_label = text_label("WASD move  ·  Shift sprint  ·  C/Ctrl crouch  ·  Space jump  ·  E interact  ·  Esc pause", 15)
	controls_label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	controls_label.position = Vector2(26, -32)
	base.add_child(controls_label)
	controls_label.hide()
	subtitle = text_label("", 20)
	subtitle.add_theme_color_override("font_shadow_color",Color(0,0,0,.95))
	subtitle.add_theme_constant_override("shadow_offset_x",1)
	subtitle.add_theme_constant_override("shadow_offset_y",2)
	subtitle.anchor_left=.12
	subtitle.anchor_right=.88
	subtitle.anchor_top=1
	subtitle.anchor_bottom=1
	subtitle.offset_top=-100
	subtitle.offset_bottom=-30
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	base.add_child(subtitle)
	prompt = text_label("", 19)
	prompt.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	prompt.position = Vector2(-350, 40)
	prompt.custom_minimum_size.x = 700
	prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	base.add_child(prompt)
	center = text_label("·", 22)
	center.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	center.position = Vector2(-7, -15)
	base.add_child(center)
	panel = PanelContainer.new()
	var menu_center := CenterContainer.new()
	menu_center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	menu_center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	base.add_child(menu_center)
	panel.custom_minimum_size = Vector2(600, 480)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.018, 0.036, 0.04, 0.98)
	style.border_color = Color(0.37, 0.65, 0.53)
	style.set_border_width_all(2)
	style.set_content_margin_all(24)
	panel.add_theme_stylebox_override("panel", style)
	menu_center.add_child(panel)
	menu = VBoxContainer.new()
	menu.add_theme_constant_override("separation", 6)
	panel.add_child(menu)

func clear_menu() -> void:
	for child in menu.get_children():
		menu.remove_child(child)
		child.queue_free()

func menu_text(text: String, size: int = 20) -> Label:
	var label := text_label(text, size)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.custom_minimum_size.x = 550
	menu.add_child(label)
	return label

func open_pause(initial: bool = false) -> void:
	paused = true
	player.enabled = false
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	clear_menu()
	panel.show()
	menu_text("ADAM’S LABORATORY  /  VÄSTERÅS", 30)
	menu_text("A first-person laboratory prototype", 18)
	menu_text("Lab, apartment and the road between them.\nWASD walk · Mouse look · Shift sprint · E interact\nEsc pause · G put down glassware · V vehicle view", 17)
	button("Enter laboratory" if initial else "Resume", close_panel)
	button("Adam’s Home", func(): staff_exit.start_at_home();close_panel())
	button("Outside Adam’s Home", func(): staff_exit.start_at_home();staff_exit.apartment.interact("home_leave");close_panel())
	button("Return to laboratory", func(): staff_exit.start_at_lab();player.camera.environment=null;close_panel())
	button("Workstations", open_workstations)
	button("Outside: " + staff_exit.grounds.time_of_day + " · change", func(): staff_exit.grounds.cycle_time_of_day(); open_pause(initial))
	button("Sound on/off", func(): sound.toggle_mute())

func open_workstations() -> void:
	clear_menu()
	menu_text("LABORATORY WORKSTATIONS",24)
	button("Wet lab",func():workbench.open(false))
	button("Periodic table",func():workbench.open(true))
	button("Calculations",func():calculations.open())
	button("Karl Fischer",func():close_panel();kf_workstation.open())
	button("Back",func():open_pause())

func close_panel() -> void:
	paused = false
	panel.hide()
	player.enabled = not (staff_exit!=null and staff_exit.vehicle!=null and staff_exit.vehicle.driving)
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
	if economy!=null and economy.handle(event):return
	if staff_exit!=null and staff_exit.vehicle!=null and staff_exit.vehicle.handle(event):return
	if accounting!=null and accounting.handle(event):return
	if glassware!=null and glassware.handle_input(event):return
	if expansion!=null and expansion.handle_input(event):return
	if event.is_action_pressed("ui_cancel"):
		if calculations!=null and calculations.visible:calculations.close();return
		if workbench.visible:
			workbench.close()
			return
		if panel.visible: close_panel()
		else: open_pause()
	if event.is_action_pressed("interact") and player.enabled and current_target != null:
		interact(str(current_target.get_meta("interaction")))

func say(text: String, duration: float = 8) -> void:
	subtitle.text = text
	subtitle_time = duration
	record(text)

func _process(delta: float) -> void:
	web_frames+=1
	if web_frames in [1,2,10,30,60]:print("WEB FRAME ",web_frames," FPS ",Engine.get_frames_per_second())
	web_screen_time += delta
	if web_screen_time > .15:
		web_screen_time=0.0
		for view in web_screens:
			if is_instance_valid(view) and view.is_inside_tree():view.render_target_update_mode=SubViewport.UPDATE_ONCE
	if paused: return
	elapsed += delta
	subtitle_time -= delta
	if subtitle_time <= 0: subtitle.text = ""
	if room.visible:
		for actor in room.actors:
			if int(actor.get_meta("health",100))>0:actor.animate(delta, player.global_position, subtitle.text.begins_with(actor.identity.to_upper()+":"))
		room.facility.animate(delta)
	sound.update_audio(delta, player.position.distance_to(Vector3(2.8,0,-10.7)), 0.0)
	hud.text = "Lab B · Free laboratory
[E] Interact   [G] Put down glassware   [1/2/3] Hands / crowbar / rifle · [I] Inventory · [M] Markings"
	if glassware!=null and glassware.holding():hud.text+="\nLeft click · throw contents (keep beaker)"
	find_target()
	if staff_exit!=null:
		if staff_exit.vehicle!=null and staff_exit.vehicle.driving:hud.text=staff_exit.vehicle.driving_hint()
		elif staff_exit.apartment!=null and staff_exit.apartment.inside:hud.text="Sevallagatan 5C · Third-floor apartment\nWASD walk · E at the entrance door to return outside"
		elif staff_exit.outside:hud.text="Björkdal · Factory / Sevallagatan 5C\n[E] Interact / enter car · WASD walk · Esc pause"
		elif player.position.z< -24:hud.text="Staff area · Personal lockers / coffee / offices\n[E] Interact · WASD walk · Esc pause"

func find_target() -> void:
	current_target = null
	prompt.text = ""
	if not player.enabled: return
	var origin: Vector3 = player.camera.global_position
	var query := PhysicsRayQueryParameters3D.create(origin, origin - player.camera.global_basis.z * 3.0)
	query.exclude = [player.get_rid()]
	query.collide_with_areas = true
	query.collision_mask=5
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	if not hit.is_empty() and hit.collider.has_meta("interaction"):
		current_target = hit.collider
		prompt.text = "[E] " + str(current_target.get_meta("title"))
		if glassware!=null and glassware.holding():
			var action: String=current_target.get_meta("interaction","")
			if action in ["acid","carry_sample"]:prompt.text="[E] Put beaker in Acid–Base Titration workstation"
			if action in ["calculation","calculation_beaker"]:prompt.text="[E] Put beaker in Calculation workstation"
			if action=="axel":prompt.text="[E] Discuss isolated solids with Axel"

func interact(id: String) -> void:
	if id.begins_with("kf_pick_") or id in ["kf_place","kf_start"]:
		var station=find_child("UpstairsKFStation",true,false)
		if station:station.handle_vial(id)
		return
	if id == "kf_station":
		if kf_workstation==null:
			kf_workstation=preload("res://scripts/kf_workstation.gd").new()
			game_ui.add_child(kf_workstation)
			kf_workstation.initialize(self)
		kf_workstation.open()
		return
	if id == "kf_stirrer" and is_instance_valid(current_target):
		var cell = current_target.get_parent()
		cell.toggle_stirrer()
		say("KF cell · Stirrer " + ("on" if cell.stirring else "off") + " · red Pt anode (+), blue cathode (−)", 4)
		return
	if economy!=null and economy.interact(id):return
	if staff_exit!=null and staff_exit.interact(id):return
	if id=="pour_basin":accounting.pour(true);return
	if id=="axel" and accounting.held_node()!=null:
		accounting.sell();return
	if id=="solid_transfer":accounting.transfer();return
	if glassware!=null and glassware.interact(id):return
	if id == "calculation":calculations.open()
	elif polish!=null and polish.interact(id):pass
	elif id == "acid":
		if expansion.carrying:expansion.return_sample()
		else:workbench.open(false)
	elif id == "carry_sample":
		if expansion.carrying:expansion.return_sample()
		else:expansion.take_sample()
	elif id == "filtration":expansion.use_filter()
	elif id == "rifle":expansion.pickup_rifle()
	elif id == "prep" or id == "periodic":
		workbench.open(true)
	elif id == "plant_gate":
		say("CONVERSION SEALED · UF6 ALARM / NOx GAS ALARM ACTIVE",5)
	elif id == "lower_gate":
		room.lower_lab.unlock()
	elif id == "adam":
		companions.toggle_follow()
	elif id == "axel":
		if int(room.actors[1].get_meta("health",100))<=0:return
		say("AXEL: I fear for Adam's mental state lately.", 9)
	elif id == "cabinet": say("Restricted storage · atmospheric Geiger ambience")
	else: say("This station is available for inspection. Chemistry preparation is at the periodic table.")

func restart() -> void:
	get_tree().reload_current_scene()
