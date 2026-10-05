extends Node

var clips := {}
var ambience: AudioStreamPlayer
var geiger_clock := 0.0
var equipment_clock := 8.0
var alarm_clock := 0.0
var click_rate := 0.9
var geiger: AudioStreamPlayer3D
var geiger_db := -21.0
var muted := false
var environmental_loops: Array[AudioStreamPlayer3D]=[]
var hood_sources: Array[AudioStreamPlayer3D]=[]
var machinery: AudioStreamPlayer3D
var drain: AudioStreamPlayer3D
var drip_clock:=3.2
var lab_bus: int
var pump_clock := 18.0
var detail_clock := 12.0
var liquid_clock := 0.0
var event_sources: Dictionary = {}
var recorded: Dictionary = {}
var geiger_events := 0


func _ready() -> void:
	lab_bus=AudioServer.get_bus_index("LabEnvironment")
	if lab_bus<0:
		AudioServer.add_bus()
		lab_bus=AudioServer.bus_count-1
		AudioServer.set_bus_name(lab_bus,"LabEnvironment")
	AudioServer.set_bus_mute(lab_bus,false)
	for kind in ["room", "step", "click", "beep", "alarm", "pump"]:
		clips[kind] = synth(kind)
	for id in ["relay","geiger_tick","beep","pump_cycle","clang","hiss","drops"]:
		recorded[id]=load("res://art/audio/phase6/"+id+".wav")
	clips.click=recorded.geiger_tick
	clips.beep=recorded.beep
	clips.pump=recorded.pump_cycle
	ambience=AudioStreamPlayer.new()
	ambience.name="RecordedHVAC"
	ambience.stream=recording("hvac")
	ambience.volume_db=-19
	ambience.bus="LabEnvironment"
	add_child(ambience);ambience.play()
	geiger=AudioStreamPlayer3D.new()
	geiger.stream=clips.click
	geiger.attenuation_model=AudioStreamPlayer3D.ATTENUATION_DISABLED
	geiger.panning_strength=0.8
	geiger.max_polyphony=8
	geiger.position=Vector3(2.8,1.6,-10.7)
	geiger.bus="LabEnvironment"
	add_child(geiger)
	for z in [6.0,0.0,-6.0]:
		for side in [-1,1]:
			if side==1 and z==0: continue
			var hood:=loop_source("hood",Vector3(side*4.55,2.55,z),-10,1.8,7.0)
			hood_sources.append(hood)
	machinery=loop_source("motor",Vector3(-8.25,2,-4.6),-12,3.5,20)
	loop_source("motor",Vector3(-13,2,-8),-18,4.0,23).pitch_scale=.83
	loop_source("transformer",Vector3(4.0,1.5,6),-19,1.3,5)
	loop_source("transformer",Vector3(4.4,1.5,-6),-23,1.0,4).pitch_scale=.94
	drain=loop_source("drain",Vector3(4.15,1.2,1.45),-24,1.1,4.5)
	for item in [["beep",Vector3(4.1,1.5,6),-21.0,12.0],["pump_cycle",Vector3(-10,1.0,-6.5),-15.0,22.0],["relay",Vector3(4.1,1.4,6),-16.0,8.0],["clang",Vector3(-12,-2,-9),-15.0,25.0],["hiss",Vector3(-5,3.3,-4),-20.0,12.0],["drops",Vector3(-3.8,1.4,6.1),-13.0,7.0]]:
		var voice:=AudioStreamPlayer3D.new()
		voice.name="Recorded_"+item[0]
		voice.stream=recorded[item[0]]
		voice.position=item[1];voice.volume_db=item[2];voice.max_distance=item[3]
		voice.unit_size=2.2;voice.bus="LabEnvironment"
		voice.attenuation_filter_cutoff_hz=4500
		add_child(voice);event_sources[item[0]]=voice

func recording(id: String) -> AudioStreamWAV:
	var stream:=load("res://art/audio/phase6/"+id+".wav").duplicate() as AudioStreamWAV
	stream.loop_mode=AudioStreamWAV.LOOP_FORWARD
	stream.loop_begin=0
	stream.loop_end=stream.data.size()/2
	return stream

func loop_source(id: String, pos: Vector3, level: float, near: float, distance: float) -> AudioStreamPlayer3D:
	var source:=AudioStreamPlayer3D.new()
	source.name=id+str(environmental_loops.size())
	source.stream=recording(id)
	source.position=pos
	source.volume_db=level
	source.unit_size=near
	source.max_distance=distance
	source.attenuation_model=AudioStreamPlayer3D.ATTENUATION_INVERSE_DISTANCE
	source.attenuation_filter_cutoff_hz=5000
	source.bus="LabEnvironment"
	add_child(source)
	source.play(fmod(float(environmental_loops.size())*1.73,source.stream.get_length()))
	environmental_loops.append(source)
	return source

func synth(kind: String) -> AudioStreamWAV:
	var duration := 6.0 if kind == "room" else (0.7 if kind in ["alarm", "pump"] else 0.15)
	var rate := 22050
	var count := int(duration * rate)
	var bytes := PackedByteArray()
	bytes.resize(count * 2)
	var rng := RandomNumberGenerator.new()
	rng.seed = 457
	var filtered := 0.0
	for i in count:
		var t := float(i) / rate
		var noise := rng.randf_range(-1, 1)
		filtered = filtered * 0.965 + noise * 0.035
		var value := 0.0
		match kind:
			"room": value = 0.17 * sin(TAU * 50 * t) + 0.14 * sin(TAU * 83 * t) + filtered * 2.4 + noise * 0.018
			"step": value = (filtered * 3 + noise * 0.2 + sin(TAU * 92 * t) * 0.3) * exp(-t * 28)
			"click": value = (noise*.85+sin(TAU*2100*t)*.18) * exp(-t * 210)
			"beep": value = sin(TAU * 780 * t) * 0.25 * sin(PI * t / duration)
			"alarm": value = sin(TAU * (440 * t + 22 * sin(t * 14))) * 0.28 * sin(PI * t / duration)
			"pump": value = (sin(TAU * 63 * t) * 0.4 + filtered * 2) * sin(PI * t / duration)
		bytes.encode_s16(i * 2, int(clampf(value, -0.95, 0.95) * 32767))
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = rate
	stream.data = bytes
	if kind == "room":
		stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
		stream.loop_end = count
	return stream

func one_shot(kind: String, db: float = -18.0, pitch: float = 1.0) -> void:
	if muted: return
	if kind=="pump":
		if not event_sources.pump_cycle.playing: event_sources.pump_cycle.play()
		return
	var voice := AudioStreamPlayer.new()
	voice.stream = clips[kind]
	voice.bus="LabEnvironment"
	voice.volume_db = db
	voice.pitch_scale = pitch
	add_child(voice)
	voice.finished.connect(voice.queue_free)
	voice.play()

func update_audio(delta: float, distance: float, urgency: float) -> void:
	# The presentation state only changes sound intensity, never mission outcomes.
	var scene:=get_parent()
	if scene.get("room")!=null and scene.room.facility!=null:
		var r: float=scene.room.facility.response
		machinery.volume_db=-12+sin(r*PI)*4
		liquid_clock-=delta
		if scene.room.presentation and liquid_clock<=0:
			if not muted: event_sources.drops.play()
			liquid_clock=2.5
		elif not scene.room.presentation:
			event_sources.drops.stop();liquid_clock=0.0
	var proximity:=pow(clampf(1.0-distance/12.0,0,1),2.0)
	click_rate=lerpf(.7,12.0,pow(proximity,.70))
	geiger_db=lerpf(-32,-20,pow(proximity,.65))
	geiger_clock -= delta
	if geiger_clock <= 0:
		if not muted:
			geiger.volume_db=geiger_db
			geiger.play()
			geiger_events+=1
		geiger_clock = randf_range(0.65, 1.2) / click_rate
	equipment_clock -= delta
	if equipment_clock <= 0:
		if randf()<.5:
			if not muted: event_sources.relay.play()
		else:
			if not muted: event_sources.beep.play()
		equipment_clock = randf_range(7, 15) / (1 + urgency)
	pump_clock-=delta
	if pump_clock<=0:
		if not muted and not event_sources.pump_cycle.playing: event_sources.pump_cycle.play()
		pump_clock=randf_range(70,110)
	detail_clock-=delta
	if detail_clock<=0:
		var kind: String="clang" if randf()<.45 else "hiss"
		if not muted: event_sources[kind].play()
		detail_clock=randf_range(24,48)
	alarm_clock -= delta
	if urgency > 0.55 and alarm_clock <= 0:
		one_shot("alarm", -19 + urgency * 4)
		alarm_clock = lerpf(7, 1.2, urgency)

func toggle_mute() -> void:
	muted = not muted
	AudioServer.set_bus_mute(lab_bus,muted)
	if muted: geiger.stop()

func _exit_tree() -> void:
	for child in get_children():
		if child is AudioStreamPlayer or child is AudioStreamPlayer3D:
			child.stop()
			child.stream = null
	clips.clear()
