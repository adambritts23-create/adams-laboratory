extends SceneTree
var checks: Array[String]=[]
var failures: Array[String]=[]
func _initialize() -> void: call_deferred("run")
func verify(ok: bool, message: String) -> void:
	if ok: checks.append(message);print("PASS "+message)
	else: failures.append(message);push_error(message)
func run() -> void:
	var lab: Node3D=load("res://scenes/lab_b.tscn").instantiate()
	root.add_child(lab);current_scene=lab
	for i in 12: await physics_frame
	var f: Node3D=lab.room.facility
	verify(f.liquid.radius>=4.0 and f.liquid.radius<5.0 and f.liquid.height>=8,"Principal vessel retains industrial height with reduced visual diameter")
	verify(f.districts.size()==6,"Vessel, tank, filter, furnace, storage and restricted districts exist")
	verify(f.companion_liquids.size()==2 and f.rotors.size()==8,"Three solution vessels and six filter rotors are present")
	verify(f.static_instances>3000,"Thousands of static parts are spatially instanced")
	verify(f.district_audio.size()==5,"Five distinct positional district layers loaded")
	for source in f.district_audio:
		verify(source.playing and source.bus=="LabEnvironment" and source.stream is AudioStreamWAV,source.name+" plays a recorded loop through the existing mute bus")
	lab.sound.toggle_mute()
	verify(AudioServer.is_bus_mute(lab.sound.lab_bus),"Facility audio follows existing global mute")
	lab.sound.toggle_mute()
	var sound_before: float=f.district_audio[0].get_playback_position()
	for i in 8: await physics_frame
	verify(f.district_audio[0].get_playback_position()!=sound_before,"District playback advances")
	f.set_response(0)
	verify(not f.deposit.visible and not f.liquid.sediment_bed.visible,"Clear vessel starts without suspended solids or bed")
	f.set_response(.60)
	verify(f.liquid.cloudiness>.8 and f.deposit.visible and not f.liquid.sediment_bed.visible,"Turbidity and fine suspension precede sediment bed")
	var suspended: Transform3D=f.deposit.multimesh.get_instance_transform(0)
	f.set_response(.74)
	var settling: Transform3D=f.deposit.multimesh.get_instance_transform(0)
	verify(settling.origin.y<suspended.origin.y and f.liquid.sediment_bed.visible,"Visible flocs descend while irregular sediment grows")
	f.set_response(1)
	verify(f.settled and f.liquid.emission_strength==0 and f.companion_liquids[0].sediment_amount==1,"Handoff settles the complete vessel group and removes fluorescence")
	f.set_response(0)
	verify(not f.settled and not f.liquid.sediment_bed.visible,"Reset clears the full process presentation")
	var q:=PhysicsRayQueryParameters3D.create(Vector3(-44,0,18),Vector3(-44,-12,18))
	var hit: Dictionary=lab.get_world_3d().direct_space_state.intersect_ray(q)
	verify(not hit.is_empty() and absf(hit.position.y+6)<.05,"Hall floor collider lies six metres below Lab B")
	# Test an actual sightline, excluding the translucent collision pane.
	q=PhysicsRayQueryParameters3D.create(Vector3(-1.5,1.62,6.1),f.focus)
	hit=lab.get_world_3d().direct_space_state.intersect_ray(q)
	verify(not hit.is_empty() and absf(hit.position.x+6)<.15,"Mission camera line reaches observation glazing without a blocking bench")
	var out:=FileAccess.open("res://validation/phase7/expansion-checks.json",FileAccess.WRITE)
	out.store_string(JSON.stringify({"passed":checks,"failed":failures},"\t"));out.close()
	print("RESULT %d passed / %d failed"%[checks.size(),failures.size()])
	lab.queue_free()
	for i in 5: await physics_frame
	quit(0 if failures.is_empty() else 1)
