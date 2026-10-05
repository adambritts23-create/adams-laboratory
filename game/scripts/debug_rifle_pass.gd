extends SceneTree
func _initialize():call_deferred("run")
func run():
	var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel()
	lab.expansion.pickup_rifle();await create_timer(.5).timeout
	print("RIFLE ",lab.expansion.held_rifle.transform," visible ",lab.expansion.held_rifle.is_visible_in_tree(),"children ",lab.expansion.held_rifle.get_child_count())
	for n in lab.expansion.held_rifle.get_children():
		if n is MeshInstance3D: print(n.name, " ", n.transform, " visible ",n.is_visible_in_tree())
	root.get_texture().get_image().save_png("res://validation/calculation-pass/rifle-debug.png")
	lab.queue_free();await process_frame;quit()
