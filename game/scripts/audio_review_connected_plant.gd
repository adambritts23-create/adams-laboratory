extends SceneTree
var lab: Node3D
var capture: AudioEffectCapture
var results: Array=[]
func _initialize() -> void: call_deferred("run")
func seconds(t: float) -> void:
	var end:=Time.get_ticks_msec()+int(t*1000)
	while Time.get_ticks_msec()<end: await process_frame
func clip(id: String, eye: Vector3, duration: float=2.0) -> float:
	lab.player.camera.global_position=eye
	await seconds(.3)
	capture.clear_buffer()
	await seconds(duration)
	var buffer:=capture.get_buffer(capture.get_frames_available())
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
	wav.save_to_wav("res://validation/connected-plant/audio-"+id+".wav")
	results.append({"clip":id,"frames":buffer.size(),"rms":rms,"peak":peak})
	return rms
func run() -> void:
	Engine.max_fps=60
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
	lab.paused=true;lab.player.enabled=false;lab.player.set_physics_process(false)
	await seconds(1)
	capture=AudioEffectCapture.new();capture.buffer_length=12
	# Capture downstream of LabEnvironment: a bus-local effect is before its mute.
	var bus: int=0
	AudioServer.add_bus_effect(bus,capture)
	await clip("lab-window",Vector3(-4.9,1.7,3),4)
	for n in lab.sound.get_children():
		if n is AudioStreamPlayer or n is AudioStreamPlayer3D: n.stop()
	var f: Node3D=lab.room.facility
	await clip("filter-district",Vector3(-32,-4,2),4)
	await clip("furnace-district",Vector3(-48,1,18),4)
	for source in f.district_audio: source.stop()
	for source in lab.find_children("*","AudioStreamPlayer3D",true,false): source.stop()
	var source: AudioStreamPlayer3D=f.district_audio[1]
	source.play()
	var near:=await clip("filter-near",source.position+Vector3(1,0,0))
	var far:=await clip("filter-far",source.position+Vector3(25,0,0))
	lab.sound.toggle_mute()
	var mute:=await clip("muted",source.position+Vector3(1,0,0),1)
	var passed:=near>far*2 and near>.0001 and mute<.000001
	for row in results: passed=passed and row.peak<1.0 and row.frames>0
	var out:=FileAccess.open("res://validation/connected-plant/audio-review.json",FileAccess.WRITE)
	out.store_string(JSON.stringify({"passed":passed,"near_far_ratio":near/maxf(far,.000001),"muted_rms":mute,"clips":results},"\t"));out.close()
	AudioServer.remove_bus_effect(bus,0)
	lab.queue_free();await seconds(.2)
	print("AUDIO PASS" if passed else "AUDIO FAIL")
	quit(0 if passed else 1)
