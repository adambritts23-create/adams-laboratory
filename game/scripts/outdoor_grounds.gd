extends "res://scripts/lab_props.gd"
var route
var gate: StaticBody3D
var gate_open:=false
var birds: AudioStreamPlayer
var time_of_day="Dusk"
var bird_chorus:AudioStreamPlayer
var evening_sun:DirectionalLight3D
var evening_sky:ShaderMaterial
func build(r):
 route=r;init_materials();name="WoodlandDrive"
 # Gate divides the site from the woodland road. E operates it on foot or in the car.
 for x in [-23,23]:
  box(Vector3(x,1,-63),Vector3(38,2,.08),material(Color(.35,.40,.38,.38),.3,.6),true)
  for n in range(-16,17,3):cylinder(Vector3(x+n,1,-63),.045,2,metal)
 for x in [-4,4]:box(Vector3(x,1.2,-63),Vector3(.3,2.4,.3),concrete,true)
 gate=box(Vector3(0,1,-63),Vector3(7.7,.14,.14),paper,true,"exit_gate","Open / close factory gate")
 for x in range(-3,4):
  var stripe=box(Vector3(x,1,-63),Vector3(.32,.16,.16),material(Color(.68,.09,.055),0,.7));stripe.reparent(gate)
 box(Vector3(4.4,1.2,-61.5),Vector3(.3,.5,.25),dark,true,"exit_gate","Open / close factory gate")
 plaque("FACTORY EXIT\nE / GATE",Vector3(4.45,2,-62.7),Vector2(1.8,.65),0)
 var valley=preload("res://scripts/valley_landscape.gd").new();add_child(valley);valley.build(route)
 var sky_mat=ShaderMaterial.new();sky_mat.shader=preload("res://materials/sunset_sky.gdshader")
 evening_sky=sky_mat
 sky_mat.set_shader_parameter("moon_albedo",load("res://art/environment/exterior/detail/lroc_color_2k.jpg"))
 sky_mat.set_shader_parameter("cloud_panorama",load("res://art/environment/exterior/detail/kloofendal_48d_partly_cloudy_puresky_hdri.hdr"))
 route.outdoor_environment.sky.sky_material=sky_mat
 route.outdoor_environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
 route.outdoor_environment.reflected_light_source=Environment.REFLECTION_SOURCE_SKY
 route.outdoor_environment.ambient_light_energy=.68
 route.outdoor_environment.ambient_light_color=Color(.72,.70,.74)
 route.outdoor_environment.sky.radiance_size=Sky.RADIANCE_SIZE_256
 route.outdoor_environment.fog_enabled=true;route.outdoor_environment.fog_light_color=Color(.69,.38,.24)
 route.outdoor_environment.fog_light_energy=.45;route.outdoor_environment.fog_density=.00055;route.outdoor_environment.fog_sky_affect=.12
 for sun in route.get_children():
  if sun is DirectionalLight3D and sun.light_cull_mask==18:
   evening_sun=sun
   sun.look_at(-Vector3(.45,.12,-.88).normalized(),Vector3.UP);sun.light_color=Color(1,.72,.43);sun.light_energy=1.25
 # Detailed terrain and natural sky are confined to the exterior lighting layer.
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=8 if n.get_meta("lake_surface",false) else 2
 birds=AudioStreamPlayer.new();birds.stream=load("res://audio/exterior/birds.ogg");birds.stream.loop=true;birds.volume_db=-60;add_child(birds);birds.play()
 bird_chorus=AudioStreamPlayer.new();add_child(bird_chorus);bird_chorus.stream=birds.stream;bird_chorus.pitch_scale=1.12;bird_chorus.volume_db=-65;bird_chorus.play(7)
 set_time_of_day("Dusk")
func set_time_of_day(period:String):
 if period not in ["Dusk","Night","Day"]:return
 time_of_day=period
 var day=period=="Day";var night=period=="Night"
 evening_sky.set_shader_parameter("day_mode",1.0 if day else 0.0)
 evening_sky.set_shader_parameter("daylight",0.0 if night else 1.0)
 evening_sky.set_shader_parameter("moon_strength",1.0 if night else 0.0)
 evening_sky.set_shader_parameter("sun_height",.72 if day else .12)
 if evening_sun!=null:
  var direction=Vector3(-.45,.48,-.75) if night else Vector3(.45,.72 if day else .12,-.88)
  evening_sun.look_at(evening_sun.global_position-direction.normalized(),Vector3.UP)
  evening_sun.light_color=Color(.65,.76,1) if night else (Color(1,.97,.89) if day else Color(1,.72,.43))
  evening_sun.light_energy=.48 if night else (1.5 if day else 1.25)
  evening_sun.set_meta("sky_period",period)
 var env=route.outdoor_environment
 env.ambient_light_energy=.25 if night else (.78 if day else .68)
 env.ambient_light_color=Color(.35,.45,.7) if night else (Color(.75,.85,1) if day else Color(.72,.70,.74))
 env.fog_light_color=Color(.055,.08,.15) if night else (Color(.63,.76,.9) if day else Color(.69,.38,.24))
 # Update photocells immediately, including while choosing a preset in the menu.
 var lamps=find_child("DuskRoadLighting",true,false)
 if lamps!=null:lamps.set_darkness(night);lamps._process(1.0)
func cycle_time_of_day():
 var periods=["Dusk","Night","Day"]
 set_time_of_day(periods[(periods.find(time_of_day)+1)%3])
func toggle_gate():
 var obstructed=absf(route.lab.player.position.z+63)<1 and absf(route.lab.player.position.x)<8
 for car in route.vehicles:
  obstructed=obstructed or (absf(car.position.z+63)<3 and absf(car.position.x)<8)
 if gate_open and obstructed:
  route.lab.say("Move clear of the gate before closing it.");return
 gate_open=not gate_open
 create_tween().tween_property(gate,"position:x",8.2 if gate_open else 0.0,1.5)
 route.lab.say("Factory gate opened." if gate_open else "Factory gate closed.")
func _process(delta):
 if route==null:return
 var outdoors=route.outside and not (route.apartment!=null and route.apartment.inside)
 var target:float=(-17.0 if time_of_day=="Day" else -20.0) if outdoors and time_of_day!="Night" else -65.0
 birds.volume_db=move_toward(birds.volume_db,target,delta*16)
 bird_chorus.volume_db=move_toward(bird_chorus.volume_db,-25.0 if outdoors and time_of_day=="Day" else -65.0,delta*16)
 birds.stream_paused=route.lab.paused or route.lab.sound.muted or time_of_day=="Night"
 bird_chorus.stream_paused=route.lab.paused or route.lab.sound.muted or time_of_day!="Day"
