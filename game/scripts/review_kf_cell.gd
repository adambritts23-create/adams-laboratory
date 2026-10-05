extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	root.size = Vector2i(1200,850)
	var stage := Node3D.new()
	root.add_child(stage)
	var furnishing = load("res://scripts/lab_furnishing.gd").new()
	stage.add_child(furnishing)
	furnishing.setup()
	# Same placement and cabinetry as both downstairs coulometry stations.
	furnishing.bench(Vector3(5.55,0,-8.3),2.8,-PI/2)
	furnishing.instrument(Vector3(5.4,1.14,-8.3),"COULOMETER")
	var environment := WorldEnvironment.new()
	var settings := Environment.new()
	settings.background_mode = Environment.BG_COLOR
	settings.background_color = Color(.045,.07,.09)
	settings.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	settings.ambient_light_color = Color(.8,.87,.95)
	settings.ambient_light_energy = .8
	environment.environment = settings
	stage.add_child(environment)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-35,-30,0)
	light.light_energy = 1.3
	stage.add_child(light)
	var camera := Camera3D.new()
	stage.add_child(camera)
	camera.position = Vector3(4.3,1.95,-6.65)
	camera.look_at(Vector3(5.48,1.36,-7.98))
	camera.fov = 42
	camera.current = true
	for i in 20: await process_frame
	await RenderingServer.frame_post_draw
	var error := root.get_texture().get_image().save_png("C:/Users/adamb/Documents/Codex/2026-09-09/the/outputs/kf-game-bench.png")
	print("KF bench screenshot: ", error)
	quit(error)
