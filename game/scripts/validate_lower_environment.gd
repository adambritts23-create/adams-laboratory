extends "res://scripts/validate_coherence.gd"
func run() -> void:
	Engine.time_scale=5
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
	await frames(16);lab.close_panel();lab.paused=true
	var lower: Node3D=lab.room.lower_lab
	verify(not lower.unlocked,"Lower laboratory starts locked")
	lab.player.position=Vector3(0,.05,9);lab.player.velocity=Vector3.ZERO
	var upper_ok:=true
	for point in [Vector3(0,0,1),Vector3(2.3,0,-2),Vector3(2.3,0,-5.5),Vector3(2.3,0,-8.95),Vector3(3.8,0,-8.95)]:
		if not await walk_to(point):upper_ok=false;break
	verify(upper_ok,"Upper mission aisle remains walkable from entry past sample bench to washing area")
	verify(is_equal_approx(lower.FLOOR_AREA/288.0,1.6666667),"Lower laboratory is approximately 67 percent larger")
	verify(lower.icp_count==4 and lower.coulometer_count==2 and lower.hood_count==2,"Four ICP instruments, two coulometers and two fume hoods are present")
	lab.player.position=Vector3(.6,.05,-9.15);lab.player.look_at(Vector3(.6,.05,-7))
	Input.action_press("forward");await frames(75);Input.action_release("forward")
	verify(lab.player.position.z< -8.70,"Locked lower access physically prevents early entry")
	lab.success_time=60;lab.advance_handoff()
	verify(not lower.unlocked,"Lower access remains locked during plant response")
	lab.success_time=84;lab.advance_handoff()
	verify(lower.unlocked and lab.room.facility.access.unlocked,"Both exploration accesses release together after successful plant completion")
	lab.paused=false;lower._process(3);lab.paused=true
	verify(lower.opened,"Lower door lifts fully clear")
	var left: Vector3=Vector3.UP.cross(lower.DESCENT_DIRECTION)
	var glass_offset: Vector3=Vector3(lower.ICP_GLASS_X,lower.FLOOR,lower.STAIR_FOOT.z)-lower.STAIR_FOOT
	verify(left.dot(glass_offset)>1 and glass_offset.length()<1.5,"ICP glazing lies immediately LEFT of the final descent direction")
	verify(lower.STAIR_TOP.x<6 and lower.STAIR_TOP.z> -12,"Stair entrance is inside upper Lab B")

	for liquid in [lab.room.sample_liquid,lab.room.facility.liquid]:
		liquid.set_treatment(.30)
		verify(liquid.sediment.multimesh.visible_instance_count>300 and not liquid.sediment_bed.visible,"Solids develop in suspension during addition")
		liquid.set_treatment(.60)
		verify(liquid.precipitation_progress==1 and liquid.settling_progress==0,"Suspension completes at the endpoint before settling")
		liquid.set_treatment(1)
		var fraction: float=liquid.sediment_bed.mesh.get_aabb().size.y*liquid.sediment_bed.scale.y/liquid.usable_vessel_depth
		verify(fraction>.19 and fraction<.23,"Final visible bed occupies approximately twenty percent of usable depth")

	lab.player.position=lower.route_points[0]+Vector3(0,.05,0);lab.player.velocity=Vector3.ZERO;lab.player.enabled=true
	await frames(8)
	var route_ok:=true
	for point in lower.route_points.slice(1):
		if not await walk_to(point):route_ok=false;break
	verify(route_ok,"Actual player controller descends, tours preparation and analytical rooms, and returns upstairs")
	lab.player.position=Vector3(4.8,-4.5,4);lab.player.velocity=Vector3.ZERO;lab.player.look_at(Vector3(8,-4.5,4))
	Input.action_press("forward");await frames(75);Input.action_release("forward")
	verify(lab.player.position.x<5.91,"ICP glazing physically prevents entry while allowing observation")
	lab.restart();await frames(16);lab=current_scene
	verify(not lab.room.lower_lab.unlocked and not lab.room.facility.access.unlocked,"Restart relocks both exploration doors")
	var out:=FileAccess.open("res://validation/lower-environment/checks.json",FileAccess.WRITE)
	out.store_string(JSON.stringify({"passed":checks,"failed":failures,"routes":route_results},"\t"));out.close()
	print("RESULT %d passed / %d failed"%[checks.size(),failures.size()])
	lab.queue_free();await frames(5);Engine.time_scale=1;quit(0 if failures.is_empty() else 1)


