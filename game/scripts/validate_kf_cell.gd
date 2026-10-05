extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var furnishing = load("res://scripts/lab_furnishing.gd").new()
	root.add_child(furnishing)
	furnishing.setup()
	furnishing.instrument(Vector3.ZERO, "COULOMETER")
	await process_frame
	var cells := get_nodes_in_group("kf_cells")
	assert(cells.size() == 1, "Coulometer must install the shared KF cell")
	var cell = cells[0]
	assert(cell.find_child("anode", true, false) != null, "Separate anode")
	assert(cell.find_child("cathode", true, false) != null, "Separate cathode")
	var dryer = cell.find_child("dryer", true, false)
	assert(dryer != null and dryer.get_parent().name == "generator", "Dryer belongs inside generator")
	assert(cell.stir_bar != null, "Imported stir bar is addressable")
	assert(not cell.stirring, "Stirrer starts stopped")
	cell.toggle_stirrer()
	var before: float = cell.stir_bar.rotation.y
	cell._process(.1)
	assert(not is_equal_approx(before, cell.stir_bar.rotation.y), "Stir bar rotates")
	cell.toggle_stirrer()
	assert(not cell.is_processing(), "Stopped stirrer uses no process loop")
	print("PASS KF: original model, separate electrodes, nested dryer, interactive stirrer")
	furnishing.queue_free()
	await process_frame
	quit()
