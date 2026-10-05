extends "res://scripts/conversion_hall.gd"
# Sealed incident area: retain the public state, omit inaccessible plant geometry.
var alarm_red:OmniLight3D
var alarm_white:OmniLight3D
var unlocked=false
var alarm_panels=[]
var alarm_labels=[]
var beacon_materials=[]
func build(room:Node3D):
 room_ref=room;init_materials();name="SealedConversion";access=self
 var gas=ShaderMaterial.new();gas.shader=preload("res://materials/conversion_gas.gdshader")
 box(Vector3(-9,2,1),Vector3(5,4,24),gas,true)
 box(Vector3(-6.02,1.48,9.5),Vector3(.25,2.96,2.54),worn,true,"plant_gate","SEALED · UF6 / NOx alarms active")
 for spec in [["UF6",8.78,Color(1,.12,.035)],["NOx",10.22,Color(1,.63,.12)]]:
  var screen=material(Color(.035,.008,.005),.1,.4).duplicate();screen.emission_enabled=true
  box(Vector3(-4.98,3.43,spec[1]),Vector3(.16,.72,1.36),dark)
  box(Vector3(-4.88,3.43,spec[1]),Vector3(.012,.60,1.23),screen)
  var display=label_at(spec[0]+" GAS ALARM\nACTIVE\nCONVERSION SEALED",Vector3(-4.86,3.43,spec[1]),27,spec[2],.0024);display.rotation.y=PI/2
  alarm_panels.append(screen);alarm_labels.append(display)
 for spec in [[Color(1,.025,.01),8.95],[Color(1,.95,.87),10.05]]:
  var lens=material(spec[0],0,.3,2).duplicate();beacon_materials.append(lens)
  box(Vector3(-5.0,2.99,spec[1]),Vector3(.20,.22,.34),lens)
  var lamp=OmniLight3D.new();add_child(lamp);lamp.position=Vector3(-5.4,3.13,spec[1]);lamp.light_color=spec[0];lamp.omni_range=2.4;lamp.shadow_enabled=false
  if alarm_red==null:alarm_red=lamp
  else:alarm_white=lamp
func unlock():unlocked=false
func animate(delta:float):
 clock+=delta
 alarm_red.light_energy=1.8 if fmod(clock,1.2)<.6 else .1
 alarm_white.light_energy=.1 if fmod(clock,1.2)<.6 else 1.5

 for i in alarm_panels.size():
  var pulse=fmod(clock+float(i)*.6,1.2)<.6
  var tint=Color(1,.08,.015) if i==0 else Color(1,.55,.04)
  alarm_panels[i].emission=tint
  alarm_panels[i].emission_energy_multiplier=.65 if pulse else .025
  alarm_labels[i].modulate=Color.WHITE if pulse else Color(.38,.38,.38)
  beacon_materials[i].emission_energy_multiplier=3.0 if pulse else .05
