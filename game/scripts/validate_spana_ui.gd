extends SceneTree
var failures:=0
func _initialize():call_deferred("run")
func check(ok: bool,title: String):
	print(("PASS " if ok else "FAIL ")+title)
	if not ok:failures+=1
func shot(name: String):
	await process_frame;await process_frame;await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png("res://validation/"+name+".png")
func run():
	var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel()
	var w=lab.workbench;w.selected_forms.append("component:Fe%202%2B");w.selected_forms.append("component:e-")
	var c=lab.calculations;c.open()
	check(not c.results_view and c.dimension==0,"Setup starts in 2D")
	check(c.request_data().conditions.any(func(r):return r.get("axis","")=="x" and r.quantity=="pH"),"Default X is pH")
	await shot("spana-setup")
	var fe: Dictionary=c.conditions.filter(func(r):return r.name=="Fe 2+")[0];c.assign_axis(fe,"x",3)
	check(c.request_data().conditions.filter(func(r):return r.get("axis","")=="x").size()==1,"Axis reassignment keeps exactly one X")
	c.apply_dimension(0);c.rebuild();var e: Dictionary=c.conditions.filter(func(r):return r.role=="electron")[0];e.value=4
	c.manual_y=true;c.y_min=-9;c.y_max=1;c.run_calculation()
	for i in 2400:
		if not c.busy:break
		await process_frame
	check(not c.data.is_empty() and c.results_view,"Real calculation opens results")
	check(c.plot.y_bounds==Vector2(-9,1),"Manual Y limits reach plot")
	await shot("spana-result")
	c.results_view=false;c.apply_dimension(1);c.rebuild();await shot("spana-3d-setup")
	check(c.request_data().conditions.any(func(r):return r.get("axis","")=="y" and r.quantity=="pe"),"3D keeps explicit pe second axis")
	c.apply_dimension(0);c.manual_y=false;c.results_view=false;c.rebuild()
	lab.queue_free();await process_frame;quit(1 if failures else 0)
