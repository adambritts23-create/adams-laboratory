extends SceneTree
var lab: Node3D
var capture: AudioEffectCapture
var results: Array=[]
var sim_audio:=false
var distance:=15.0
func _process(delta: float) -> bool:
	if sim_audio and is_instance_valid(lab): lab.sound.update_audio(delta,distance,0)
	return false
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
	wav.save_to_wav("res://validation/coherence/audio-"+id+".wav")
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
	for n in lab.find_children("*","AudioStreamPlayer",true,false): n.stop()
	for n in lab.find_children("*","AudioStreamPlayer3D",true,false): n.stop()
	lab.sound.equipment_clock=999;lab.sound.pump_clock=999;lab.sound.detail_clock=999;lab.sound.drip_clock=999
	sim_audio=true
	distance=15
	var far:=await clip("geiger-lab-baseline",Vector3(0,1.62,4),5)
	distance=.8
	var near:=await clip("geiger-closed-cabinet",Vector3(2.8,1.62,-9.6),5)
	lab.sound.toggle_mute()
	var mute:=await clip("geiger-muted",Vector3(2.8,1.62,-9.6),2)
	sim_audio=false
	var passed:=near>far*2 and near>.0001 and mute<.000001
	for row in results: passed=passed and row.peak<1.0 and row.frames>0
	var out:=FileAccess.open("res://validation/coherence/geiger-review.json",FileAccess.WRITE)
	out.store_string(JSON.stringify({"passed":passed,"near_far_ratio":near/maxf(far,.000001),"muted_rms":mute,"clips":results},"\t"));out.close()
	AudioServer.remove_bus_effect(bus,0)
	lab.queue_free();await seconds(.2)
	print("AUDIO PASS" if passed else "AUDIO FAIL")
	quit(0 if passed else 1)
