extends SceneTree
var failures=0
func _initialize():call_deferred("run")
func check(ok,title):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 var g=lab.staff_exit.grounds
 check(g.time_of_day=="Dusk","Dusk default")
 lab.staff_exit.apartment.interact("home_leave");lab.close_panel()
 for i in 4:await process_frame
 lab.staff_exit.outside=true
 var lights=g.find_child("DuskRoadLighting",true,false)
 g.cycle_time_of_day();g._process(1)
 check(g.time_of_day=="Night" and g.evening_sky.get_shader_parameter("moon_strength")==1.0,"Night moon enabled")
 check(lights.night,"Night streetlights")
 check(g.birds.stream_paused and g.bird_chorus.stream_paused,"No daytime birds at night")
 g.cycle_time_of_day();g._process(4)
 check(g.time_of_day=="Day" and g.evening_sky.get_shader_parameter("day_mode")==1.0,"Day sky enabled")
 check(not lights.night,"Day streetlights off")
 check(not g.bird_chorus.stream_paused and g.birds.volume_db> -20,"Day bird chorus")
 lab.sound.muted=true;g._process(1);check(g.birds.stream_paused and g.bird_chorus.stream_paused,"Mute silences both birds")
 lab.sound.muted=false;g.cycle_time_of_day();g._process(1)
 check(g.time_of_day=="Dusk" and g.evening_sky.get_shader_parameter("moon_strength")==0.0,"Return to dusk")
 lab.open_pause();check(lab.menu.get_children().any(func(n):return n is Button and n.text.begins_with("Outside: Dusk")),"Pause menu switch available")
 print("TIME FAILURES ",failures)
 lab.free();await process_frame;quit(failures)
