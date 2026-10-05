extends SceneTree
var failures:=0
func _initialize():call_deferred("run")
func check(value: bool,title: String):
	print(("PASS " if value else "FAIL ")+title)
	if not value:failures+=1
func shot(name: String):
	await process_frame;await process_frame;await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://validation/"+name+".png")
func run():
	var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel()
	var w=lab.workbench;var c=lab.calculations
	w.open(true);w.choose_element("Fe")
	var forms=w.box.find_child("VisibleComponentForms",true,false)
	check(forms.get_child_count()>=2 and forms.get_child(0) is Button,"All iron forms visible without dropdown")
	w.toggle_form("component:Fe%202%2B");w.toggle_form("component:Fe%203%2B");w.choose_element("Fe")
	check(not "component:Fe%202%2B" in w.selected_forms and not "component:Fe%203%2B" in w.selected_forms,"Element click clears all associated forms")
	w.toggle_form("component:Fe%202%2B");w.toggle_form("component:e-")
	check("component:e-" in c.components(),"Electron selection reaches calculation components")
	await shot("selector-periodic");w.close();c.open()
	var req=c.request_data();var electron=req.conditions.filter(func(r):return r.componentId=="component:e-")[0]
	check(electron.mode=="LA" and electron.quantity=="pe","Electron defaults to fixed pe, not concentration")
	check(req.conditions.any(func(r):return r.get("axis","")=="x" and r.quantity=="pH"),"pH defaults to X axis")
	check(c.dimension==0 and c.diagram_key=="log-concentration:","2D log concentration defaults")
	await shot("selector-calculation-setup")
	c.data=JSON.parse_string(FileAccess.get_file_as_string("res://validation/selector-redox.json"));c.rebuild();await shot("selector-calculation-result")
	check(c.plot.series_index==-1 and c.data.counts.converged==15,"All species rendered for accepted redox sweep")
	c.apply_dimension(1);req=c.request_data()
	check(req.conditions.any(func(r):return r.get("axis","")=="y" and r.quantity=="pe"),"3D assigns pe as second axis")
	c.apply_dimension(0);check(not c.request_data().conditions.any(func(r):return r.get("axis","")=="y"),"Returning to 2D removes Y sweep")
	c.close();w.open(true);w.toggle_form("component:e-");check(not "component:e-" in c.components(),"Electron can be deselected")
	lab.queue_free();await process_frame;quit(1 if failures else 0)
