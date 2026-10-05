extends Node
# Offline speech clips are replaceable without changing the scene triggers.
var lab
var seen={}
var adam:AudioStreamPlayer
var buyer:AudioStreamPlayer3D
var home_contact:Node3D
var elapsed=0.0
var voice_enabled:=false
var voice_bus=0
func build(world):
 lab=world
 voice_bus=AudioServer.get_bus_index("Dialogue")
 if voice_bus<0:
  AudioServer.add_bus();voice_bus=AudioServer.bus_count-1;AudioServer.set_bus_name(voice_bus,"Dialogue")
 adam=AudioStreamPlayer.new();add_child(adam);adam.stream=load("res://audio/dialogue/adam.wav");adam.volume_db=-4
 buyer=AudioStreamPlayer3D.new();add_child(buyer);buyer.stream=load("res://audio/dialogue/buyer.wav");buyer.unit_size=5;buyer.max_distance=24;buyer.volume_db=0;buyer.pitch_scale=.95
 adam.bus="Dialogue";buyer.bus="Dialogue"
 home_contact=lab.find_child("HomeContact",true,false)
func busy()->bool:
 return adam.playing or buyer.playing
func speak(id:String,p:Vector3=Vector3.ZERO):
 if seen.has(id) or busy():return
 seen[id]=true
 if id=="adam":
  adam.play();lab.say("ADAM: Time for another night shift. Right. Better get moving.",adam.stream.get_length()+.5)
 else:
  buyer.global_position=p+Vector3.UP*1.35;buyer.play()
  lab.say("CONTACT: Adam! Good to see you. Listen, I have a proposition for you. You know those unusual things at work? We should talk.",buyer.stream.get_length()/buyer.pitch_scale+.5)
func _process(dt):
 if lab==null or not voice_enabled:return
 AudioServer.set_bus_mute(voice_bus,lab.sound.muted)
 for voice in [adam,buyer]:voice.stream_paused=lab.paused
 if lab.paused or lab.sound.muted:return
 elapsed+=dt
 if lab.staff_exit.apartment.inside:
  if elapsed>1:speak("adam")
  return
 if busy() or lab.staff_exit.vehicle.driving:return
 if is_instance_valid(home_contact) and lab.player.global_position.distance_to(home_contact.global_position)<6:
  speak("home_buyer",home_contact.global_position)
 if lab.economy.gate_people==null:return
 var gate=lab.economy.gate_people.buyer
 if is_instance_valid(gate) and lab.player.global_position.distance_to(gate.global_position)<6:
  speak("gate_buyer",gate.global_position)
