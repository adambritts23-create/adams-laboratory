extends SceneTree
var lab: Node3D
var capture: AudioEffectCapture
var results: Array=[]
func _initialize() -> void: call_deferred("run")
func wait_seconds(seconds: float) -> void:
	var end:=Time.get_ticks_msec()+int(seconds*1000)
	while Time.get_ticks_msec()<end: await process_frame
func record_clip(id: String, source: Node, listener: Vector3, seconds: float=2.0) -> float:
	lab.player.camera.global_position=listener
	capture.clear_buffer()
	source.play()
	await wait_seconds(.25)
	capture.clear_buffer()
	await wait_seconds(seconds)
	var buffer:=capture.get_buffer(capture.get_frames_available())
	source.stop()
	var bytes:=PackedByteArray();bytes.resize(buffer.size()*4)
	var power:=0.0
	var peak:=0.0
	for i in buffer.size():
		power+=buffer[i].length_squared()
		peak=maxf(peak,maxf(absf(buffer[i].x),absf(buffer[i].y)))
		bytes.encode_s16(i*4,int(clampf(buffer[i].x,-1,1)*32767))
		bytes.encode_s16(i*4+2,int(clampf(buffer[i].y,-1,1)*32767))
	var rms:=sqrt(power/maxi(1,buffer.size()*2))
	var wav:=AudioStreamWAV.new();wav.format=AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate=int(AudioServer.get_mix_rate());wav.stereo=true;wav.data=bytes
	wav.save_to_wav("res://validation/phase6/audio-"+id+".wav")
	results.append({"layer":id,"frames":buffer.size(),"rms":rms,"peak":peak,"listener":str(listener)})
	return rms
func run() -> void:
	Engine.max_fps=60
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab)
	current_scene=lab
	lab.paused=true;lab.player.enabled=false;lab.player.set_physics_process(false)
	await wait_seconds(1)
	for n in lab.sound.get_children():
		if n is AudioStreamPlayer or n is AudioStreamPlayer3D: n.stop()
	capture=AudioEffectCapture.new();capture.buffer_length=35.0
	var bus:=AudioServer.get_bus_index("LabEnvironment")
	AudioServer.add_bus_effect(bus,capture)
	await record_clip("hvac",lab.sound.get_node("RecordedHVAC"),Vector3(0,1.62,6))
	var hood: AudioStreamPlayer3D=lab.sound.hood_sources[0]
	var near:=await record_clip("hood-near",hood,hood.position+Vector3(1.0,-.5,0))
	var far:=await record_clip("hood-far",hood,hood.position+Vector3(5.5,-.5,0))
	await record_clip("machinery",lab.sound.machinery,Vector3(-5.7,1.62,-4.6))
	# Intermittent sounds need repeated events to capture useful review clips.
	var events:=AudioStreamPlayer.new();events.bus="LabEnvironment";events.volume_db=-20;lab.sound.add_child(events)
	for id in ["beep","pump","step","click","alarm"]:
		events.stream=lab.sound.clips[id]
		# record_clip clears after 250ms, so delay the event until recording starts.
		get_tree_timer_play(events,.4)
		await record_clip(id,events,Vector3(0,1.62,6),1.0)
	get_tree_timer_play(lab.sound.drain,.4)
	await record_clip("sink",lab.sound.drain,Vector3(3.5,1.5,1.45),1.0)
	for id in ["relay","clang","hiss","drops"]:
		var source: AudioStreamPlayer3D=lab.sound.event_sources[id]
		get_tree_timer_play(source,.4)
		await record_clip(id,source,source.position+Vector3(1,.2,1),2.0)
	for distance in [30.0,1.0]:
		lab.player.camera.global_position=Vector3(2.8,1.62,-10.7+distance)
		capture.clear_buffer()
		var before: int=lab.sound.geiger_events
		var end:=Time.get_ticks_msec()+4000
		var last:=Time.get_ticks_msec()
		while Time.get_ticks_msec()<end:
			await process_frame
			var now:=Time.get_ticks_msec()
			lab.sound.update_audio((now-last)/1000.0,distance,0)
			last=now
		results.append({"geiger_distance":distance,"events_in_four_seconds":lab.sound.geiger_events-before,"rate":lab.sound.click_rate,"volume_db":lab.sound.geiger_db})
		write_mix("geiger-"+str(int(distance))+"m")
	# Full recorded environment walkthrough: entrance, hood, glass gallery, storage.
	lab.sound.ambience.play()
	for n in lab.sound.environmental_loops:n.play()
	capture.clear_buffer()
	var route: Array[Vector3]=[Vector3(0,1.62,9),Vector3(-3.4,1.62,6),Vector3(-5.7,1.62,-4.6),Vector3(2.8,1.62,-9.7)]
	var start:=Time.get_ticks_msec();var last:=start
	while Time.get_ticks_msec()-start<24000:
		await process_frame
		var now:=Time.get_ticks_msec()
		var t: float=(now-start)/1000.0
		var segment:=mini(int(t/8),2)
		var pos:=route[segment].lerp(route[segment+1],clampf((t-segment*8)/8,0,1))
		lab.player.camera.global_position=pos
		lab.sound.update_audio((now-last)/1000.0,pos.distance_to(Vector3(2.8,1.62,-10.7)),0)
		last=now
	write_mix("walkthrough")
	var f:=FileAccess.open("res://validation/phase6/audio-review.json",FileAccess.WRITE)
	f.store_string(JSON.stringify({"layers":results,"hood_near_greater_than_far":near>far*2,"near_far_ratio":near/maxf(far,.000001)},"	"));f.close()
	AudioServer.remove_bus_effect(bus,0)
	lab.queue_free();await wait_seconds(.3)
	quit(0 if near>far*2 else 1)
func get_tree_timer_play(source: Node, delay: float) -> void:
	create_timer(delay).timeout.connect(func(): source.play())

func write_mix(id: String) -> void:
	var buffer:=capture.get_buffer(capture.get_frames_available())
	var bytes:=PackedByteArray();bytes.resize(buffer.size()*4)
	var peak:=0.0
	for i in buffer.size():
		peak=maxf(peak,maxf(absf(buffer[i].x),absf(buffer[i].y)))
		bytes.encode_s16(i*4,int(clampf(buffer[i].x,-1,1)*32767))
		bytes.encode_s16(i*4+2,int(clampf(buffer[i].y,-1,1)*32767))
	var wav:=AudioStreamWAV.new();wav.format=AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate=int(AudioServer.get_mix_rate());wav.stereo=true;wav.data=bytes
	wav.save_to_wav("res://validation/phase6/audio-"+id+".wav")
	results.append({"mix":id,"frames":buffer.size(),"peak":peak,"clipping":peak>=1.0})
