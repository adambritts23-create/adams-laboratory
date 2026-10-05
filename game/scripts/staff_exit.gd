extends "res://scripts/lab_props.gd"
var lab: Node3D
var doors: Dictionary={}
var opened: Dictionary={}
var returning=false
var doffed:=false
var scanned:=false
var dressed:=false
var scan_time:=-1.0
var scan_label: Label3D
var hanging: Node3D
var outdoor_environment: Environment
var outside:=false
var landscape: Node3D
var scanner_light: OmniLight3D
var vehicle
var vehicles:Array=[]
var gyrocopters:Array=[]
var home_entry:=Vector3(-54.4,-48,-975)
var grounds
var staff_environment: Environment
var apartment
var garage
var amenities
func build(world: Node3D):
 lab=world;name="StaffExitRoute";init_materials()
 var wall:=material(Color(.60,.65,.60),.05,.8)
 var tiles:=aged(Color(.36,.41,.38),Color(.27,.31,.29),0,2)
 box(Vector3(0,-.15,-21),Vector3(6,.3,18),tiles,true)
 box(Vector3(0,3.15,-21),Vector3(6,.2,18),wall,true)
 for x in [3]:
  box(Vector3(x,1.5,-19.5),Vector3(.2,3,15),wall,true)
  box(Vector3(x,1.5,-29.7),Vector3(.2,3,.6),wall,true)
  box(Vector3(x,2.9,-28.2),Vector3(.2,.4,2.4),wall,true)
 box(Vector3(-3,1.5,-21),Vector3(.2,3,18),wall,true)
 for z in [-19.5,-24,-30]:
  for x in [-2,2]:box(Vector3(x,1.5,z),Vector3(2,3,.18),wall,true)
  box(Vector3(0,2.85,z),Vector3(2,.3,.18),wall,true)
 for z in [-15.5,-21.5,-27]:
  box(Vector3(0,3.02,z),Vector3(1.8,.045,.36),material(Color(.88,.95,.88),0,.7,1.5))
  var l:=OmniLight3D.new();l.position=Vector3(0,2.65,z);l.light_color=Color(.90,.97,.91);l.light_energy=1.7;l.omni_range=5;add_child(l)
 make_door("staff_entry",-11.82,"Staff exit / changing rooms")
 make_door("scanner_entry",-19.5,"Proceed to radiation scanner")
 make_door("scanner_exit",-24,"Proceed to personal lockers")
 make_door("parking_exit",-30,"Exit to parking lot")
 plaque("STAFF EXIT\nCHANGE / SCAN / PERSONAL LOCKERS",Vector3(0,3.35,-11.62),Vector2(2.6,.50),0)
 plaque("01 / PROTECTIVE CLOTHING",Vector3(0,2.75,-19.37),Vector2(2.6,.28),0)
 plaque("02 / RADIATION CHECK",Vector3(0,2.75,-23.87),Vector2(2.4,.28),0)
 plaque("03 / PERSONAL CLOTHES",Vector3(0,2.75,-29.87),Vector2(2.4,.28),0)
 # Changing bench, numbered hooks, linen bins and actual hanging garment.
 for x in [-2,2]:
  box(Vector3(x,.48,-16.5),Vector3(1.15,.10,2.7),material(Color(.38,.24,.12),0,.75),true)
  for z in [-15.5,-17.5]:box(Vector3(x,.23,z),Vector3(.7,.46,.08),metal,true)
 box(Vector3(-2.88,1.6,-16.3),Vector3(.08,.2,2.6),metal)
 for z in [-15.3,-16.3,-17.3]:tube(Vector3(-2.83,1.6,z),Vector3(-2.57,1.65,z),.025,metal)
 var hook=box(Vector3(-2.6,1.55,-16.3),Vector3(.15,.35,.4),metal,true,"exit_hang","Hang up protective coveralls")
 hanging=preload("res://scripts/worker_rigged.gd").new();add_child(hanging);hanging.build("adam",Vector3(-2.58,.42,-16.3),lab.room);hanging.scale=Vector3.ONE*.77;hanging.rotation.y=PI/2
 for n in hanging.model.find_children("*","MeshInstance3D",true,false):
  if "Head" in n.name or "Hair" in n.name or "Eyes" in n.name:n.hide()
 for n in hanging.rig.find_children("*","BoneAttachment3D",true,false):n.hide()
 hanging.hide()
 plaque("HANG COVERALLS\nE at the centre hook",Vector3(-2.78,2.2,-16.3),Vector2(1.4,.44),PI/2)
 for z in [-15,-17]:
  box(Vector3(2.6,.5,z),Vector3(.6,1,.65),plastic,true)
  label_at("LAUNDRY",Vector3(2.6,.82,z+.34),22,Color.WHITE,.002)
 # Walk-through monitoring portal, inspired by the supplied enclosure reference.
 for x in [-.91,.91]:
  box(Vector3(x,1.23,-21.7),Vector3(.28,2.46,1.8),metal,true)
  box(Vector3(x*.82,1.22,-21.7),Vector3(.04,1.93,1.3),dark)
 box(Vector3(0,2.48,-21.7),Vector3(2.1,.2,1.8),plastic)
 box(Vector3(0,.025,-21.7),Vector3(1.5,.05,1.8),rubber)
 for x in [-.38,.38]:box(Vector3(x,.053,-21.7),Vector3(.20,.009,.46),paper)
 box(Vector3(.64,1.3,-21.7),Vector3(.12,.33,.40),dark,true,"exit_scan","Start radiation scan / stand on marked pad")
 scan_label=label_at("READY\nE: SCAN",Vector3(.56,1.37,-21.7),28,Color(.60,1,.70),.002);scan_label.rotation.y=-PI/2
 scanner_light=OmniLight3D.new();scanner_light.position=Vector3(0,2.1,-21.7);scanner_light.light_color=Color(.3,.7,1);scanner_light.light_energy=.5;scanner_light.omni_range=2;add_child(scanner_light)
 # Personal lockers, low benches, folded shirt and shoes.
 for x in [-2.66,2.66]:
  for i in 3:
   var z: float=-25.1-i*.85
   box(Vector3(x,1.05,z),Vector3(.6,2.1,.80),material(Color(.19,.30,.29),.35,.45),true)
   box(Vector3(x+(.315 if x<0 else -.315),1.05,z),Vector3(.028,1.96,.72),material(Color(.24,.34,.34),.18,.62))
   for y in [1.55,1.62,1.69]:box(Vector3(x+(.335 if x<0 else -.335),y,z),Vector3(.012,.018,.42),rubber)
   label_at(str(i+1),Vector3(x+(.34 if x<0 else -.34),1.83,z),24,Color.WHITE,.002).rotation.y=PI/2 if x<0 else -PI/2
 box(Vector3(-2.26,1.2,-26.8),Vector3(.1,.36,.30),brass,true,"exit_clothes","Collect and change into your normal clothes")
 plaque("ADAM / PERSONAL CLOTHES",Vector3(-2.26,2.27,-26.8),Vector2(2,.23),PI/2)
 for x in [-1.55,1.55]:
  box(Vector3(x,.46,-26.2),Vector3(.5,.08,1.0),paper,true)
  for z in [-25.85,-26.55]:box(Vector3(x,.22,z),Vector3(.35,.44,.1),metal,true)
 box(Vector3(-1.55,.55,-26.8),Vector3(.40,.11,.5),material(Color(.19,.28,.13),0,.95))
 box(Vector3(-1.55,.64,-26.8),Vector3(.36,.065,.42),material(Color(.07,.12,.19),0,.98))
 amenities=preload("res://scripts/staff_amenities.gd").new();add_child(amenities);amenities.build(self)
 build_outside()
 staff_environment=Environment.new();staff_environment.background_mode=Environment.BG_COLOR;staff_environment.background_color=Color(.65,.72,.74);staff_environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;staff_environment.ambient_light_color=Color(.9,.9,.85);staff_environment.ambient_light_energy=.6
 grounds=preload("res://scripts/outdoor_grounds.gd").new();add_child(grounds);grounds.build(self)
 var finishing=preload("res://scripts/interior_finishing.gd").new();add_child(finishing);finishing.build_exit(self)
func make_door(id: String,z: float,title: String):
 var d:=box(Vector3(0,1.3,z),Vector3(1.82,2.6,.12),material(Color(.23,.32,.31),.25,.52),true,id,title)
 doors[id]=d;opened[id]=false
 # Put interaction on both stationary push plates, reachable even with the leaf open.
 for s in [-1,1]:
  box(Vector3(1.16,1.25,z+s*.16),Vector3(.20,.32,.08),brass,true,id,title)
  label_at("E",Vector3(1.16,1.26,z+s*.205),26,Color.WHITE,.002).rotation.y=0 if s>0 else PI
func toggle_door(id: String):
 opened[id]=not opened[id]
 create_tween().tween_property(doors[id],"position:y",4.0 if opened[id] else 1.3,.65)
func interact(id: String) -> bool:
 for gyro in gyrocopters:
  if gyro.interaction_id==id:gyro.enter();return true
 if id=="parking_exit" and lab.player.position.z< -30:
  returning=true
  if not opened.parking_exit:toggle_door("parking_exit")
  lab.say("Hang your normal clothes in your locker before entering the lab.",4);return true
 if returning and id=="exit_clothes":
  dressed=false;doffed=true;lab.say("Normal clothes hung up. Collect your protective coveralls.",4);return true
 if returning and id in ["scanner_exit","scanner_entry"]:
  if dressed:lab.say("Hang your normal clothes first.");return true
  toggle_door(id);return true
 if returning and id=="exit_hang":
  if dressed:lab.say("Hang your normal clothes in the locker first.");return true
  doffed=false;scanned=false;returning=false;hanging.hide();lab.say("Protective coveralls on. Ready for Lab B.");return true
 if garage!=null and garage.interact(id):return true
 if apartment!=null and apartment.interact(id):return true
 if not (id in doors or id.begins_with("exit_")):return false
 if id=="exit_hang":
  if lab.glassware.holding():lab.say("Put your glassware down before changing.");return true
  if doffed:
   for door_id in ["scanner_entry","scanner_exit","parking_exit"]:
    if opened[door_id]:toggle_door(door_id)
   doffed=false;scanned=false;dressed=false;hanging.hide();lab.say("Protective coveralls back on. Ready to return to Lab B.")
  else:
   doffed=true;scanned=false;dressed=false;hanging.show();
   if opened.staff_entry:toggle_door("staff_entry")
   lab.say("Coveralls hung up. Continue through the radiation scanner.")
 elif id=="exit_scan":
  if not doffed:lab.say("Hang your protective coveralls up first.")
  elif Vector2(lab.player.position.x,lab.player.position.z+21.7).length()>.72:lab.say("Stand on the marked scanner pad and press E.")
  elif scan_time<0:scan_time=0;scan_label.text="SCANNING\nSTAND STILL";lab.say("Scan in progress. Remain on the marked pad.")
 elif id=="exit_clothes":
  if not scanned:lab.say("Complete the radiation check first.")
  else:dressed=true;lab.say("Normal clothes on. You can now leave for the parking lot.")
 elif id=="scanner_entry" and not doffed:lab.say("Hang your protective coveralls up before proceeding.")
 elif id=="scanner_exit" and not scanned:lab.say("Complete the radiation scan before entering the personal locker room.")
 elif id=="parking_exit" and not dressed:lab.say("Change into your normal clothes first.")
 elif id=="staff_entry" and doffed and lab.player.position.z< -12:lab.say("Put the protective coveralls back on before returning to Lab B.")
 elif id in ["exit_car","exit_car_red"]:
  for car in vehicles:
   if car.interaction_id==id:car.enter();break
 elif id=="exit_coffee":lab.say("Fresh coffee. A quiet moment before heading home.");lab.sound.one_shot("beep",-25)
 elif id=="exit_gate":grounds.toggle_gate()
 else:toggle_door(id)
 return true
func _process(delta: float):
 if lab==null or lab.paused:return
 if scan_time>=0:
  if Vector2(lab.player.position.x,lab.player.position.z+21.7).length()>.72:
   scan_time=-1;scan_label.text="SCAN CANCELLED\nRETURN TO PAD";lab.say("Scan cancelled: return to the marked pad.")
  else:
   scan_time+=delta;scanner_light.light_energy=.5+.35*sin(scan_time*6)
   if scan_time>=3:
    scanned=true;scan_time=-1;scan_label.text="CHECK COMPLETE\nPROCEED";scanner_light.light_color=Color(.25,1,.45);lab.sound.one_shot("beep",-20);lab.say("Radiation check complete. Continue to your personal locker.")
 var now: bool=lab.player.position.z< -30.1
 if now!=outside:
  if outside and not now and dressed:returning=true
  outside=now
 lab.player.camera.environment=garage.environment if garage!=null and garage.contains(lab.player.global_position) else apartment.interior_environment if apartment!=null and apartment.inside else outdoor_environment if outside else staff_environment if lab.player.position.x>3 and lab.player.position.z< -22 else null
 AudioServer.set_bus_volume_db(lab.sound.lab_bus,lerpf(0,-38,clampf((-lab.player.position.z-12)/18,0,1)))
func asset(id: String,pos: Vector3,scale_value: float=1) -> Node3D:
 var obj: Node3D=load("res://art/environment/exterior/"+id+".glb").instantiate();add_child(obj);obj.position=pos;obj.scale=Vector3.ONE*scale_value
 if id!="is200":
  for mesh in obj.find_children("*","MeshInstance3D",true,false):
   for surface in mesh.mesh.get_surface_count():
    var original: Material=mesh.mesh.surface_get_material(surface)
    var title: String=original.resource_name.to_lower() if original else ""
    var color:=Color(.12,.28,.055) if "leaf" in title or "grass" in title else Color(.24,.16,.09) if "wood" in title else Color(.36,.39,.32)
    mesh.set_surface_override_material(surface,material(color,0,.93))
 return obj
func build_outside():
 var first:=get_child_count()
 var grass_mat=ShaderMaterial.new();grass_mat.shader=preload("res://materials/outdoor_ground.gdshader")
 grass_mat.set_shader_parameter("ground_albedo",load("res://art/environment/exterior/pbr/grass_ground_diff.jpg"))
 grass_mat.set_shader_parameter("ground_normal",load("res://art/environment/exterior/pbr/grass_ground_nor_gl.jpg"))
 var parking_mat=StandardMaterial3D.new();parking_mat.albedo_texture=load("res://art/environment/exterior/pbr/clean_asphalt_diff.jpg");parking_mat.normal_texture=load("res://art/environment/exterior/pbr/clean_asphalt_nor_gl.jpg");parking_mat.normal_enabled=true;parking_mat.normal_scale=.5;parking_mat.roughness=.9;parking_mat.albedo_color=Color(.72,.75,.77);parking_mat.uv1_triplanar=true;parking_mat.uv1_world_triplanar=true;parking_mat.uv1_scale=Vector3.ONE*.32
 box(Vector3(0,-.23,-62),Vector3(110,.3,96),grass_mat,true)
 box(Vector3(0,-.045,-45),Vector3(25,.09,26),parking_mat,true)
 box(Vector3(0,.04,-32),Vector3(6,.08,4),concrete,true)
 # Exterior factory elevation and recessed exit canopy.
 box(Vector3(-16,3,-29.8),Vector3(26,6,.3),painted,true)
 box(Vector3(16,3,-29.8),Vector3(26,6,.3),painted,true)
 box(Vector3(0,4.5,-29.8),Vector3(6,3,.3),painted,true)
 box(Vector3(0,3.12,-31.1),Vector3(6.5,.15,2.7),dark)
 for x in [-3,3]:box(Vector3(x,1.5,-32.25),Vector3(.09,3,.09),metal,true)
 label_at("STAFF ENTRANCE",Vector3(0,2.9,-30.1),36,Color.WHITE,.004).rotation.y=PI
 for x in range(-28,29,2):box(Vector3(x,3,-30.0),Vector3(.028,5.8,.02),metal)
 # Accessible bays and pedestrian approach.
 for x in [-9,-6,-3,0,3,6,9]:
  box(Vector3(x,.015,-43),Vector3(.09,.015,5.6),material(Color(.82,.83,.72),0,.95))
 for z in [-40.2,-45.8]:box(Vector3(0,.015,z),Vector3(18,.015,.09),paper)
 for z in [-34.5,-35.2,-35.9]:box(Vector3(0,.018,z),Vector3(3,.018,.32),paper)
 for x in [-12.6,12.6]:box(Vector3(x,-.035,-45),Vector3(.25,.07,26),concrete,true)
 for x in [-8,8]:
  box(Vector3(x,.22,-34),Vector3(3,.45,2),concrete,true)
  for i in 3:asset("plant_bushDetailed",Vector3(x-1+i,.45,-34),1.7)
 for x in [-10,10]:
  cylinder(Vector3(x,2.4,-49),.055,4.8,metal)
  box(Vector3(x,4.8,-49),Vector3(.8,.08,.45),plastic)
 vehicle=preload("res://scripts/driveable_is200.gd").new();add_child(vehicle);vehicle.build(lab,self);vehicles.append(vehicle)
 var red_car=preload("res://scripts/driveable_is200.gd").new()
 red_car.is250=true;red_car.plate_text="HWN 279";red_car.interaction_id="exit_car_red"
 add_child(red_car);red_car.build(lab,self);vehicles.append(red_car)
 # Outdoor geometry receives only the outdoor sun, leaving the existing lab lighting intact.
 landscape=Node3D.new();landscape.name="ParkingAndGreenbelt";add_child(landscape)
 for node in get_children().slice(first):
  if node!=landscape and node not in vehicles:node.reparent(landscape)
 for n in landscape.find_children("*","GeometryInstance3D",true,false):n.layers=2
 var sun:=DirectionalLight3D.new();sun.rotation_degrees=Vector3(-43,-35,0);sun.light_color=Color(1,.94,.81);sun.light_energy=1.15;sun.shadow_enabled=true;sun.light_cull_mask=2|16;sun.directional_shadow_max_distance=100;add_child(sun)
 outdoor_environment=Environment.new();outdoor_environment.background_mode=Environment.BG_SKY
 var sky:=Sky.new();var sky_mat:=ProceduralSkyMaterial.new();sky_mat.sky_top_color=Color(.22,.42,.63);sky_mat.sky_horizon_color=Color(.76,.85,.86);sky_mat.ground_horizon_color=Color(.65,.73,.63);sky_mat.ground_bottom_color=Color(.16,.24,.12);sky.sky_material=sky_mat;outdoor_environment.sky=sky
 outdoor_environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;outdoor_environment.ambient_light_color=Color(.75,.80,.73);outdoor_environment.ambient_light_energy=.65;outdoor_environment.tonemap_mode=Environment.TONE_MAPPER_FILMIC

func _exit_tree():
 if lab!=null and is_instance_valid(lab.sound):AudioServer.set_bus_volume_db(lab.sound.lab_bus,0)

func initialize_home():
 apartment=preload("res://scripts/apartment_5c.gd").new();add_child(apartment);apartment.build(self)

 # Garage bays now belong to the apartment frontage; the lab is in the purchased room.

func start_at_home():
 # Begin in normal clothes; the return route still requires changing for Lab B.
 doffed=true;scanned=true;dressed=true;hanging.show()
 var car=vehicles[0]
 car.body.freeze=true;car.body.global_transform=Transform3D(Basis.IDENTITY,Vector3(-45,-47.92,-976))
 car.global_transform=car.body.global_transform;car.body.last_safe=car.body.global_transform
 car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO
 apartment.interact("home_enter")

func start_at_lab():
 doffed=false;scanned=false;dressed=false;returning=false;hanging.hide()
 apartment.inside=false
 lab.player.position=Vector3(0,.05,8);lab.player.rotation=Vector3.ZERO;lab.player.reset_motion()
 var car=vehicles[0];car.body.freeze=true;car.body.global_transform=Transform3D(Basis.IDENTITY,Vector3(-11,.15,-46));car.global_transform=car.body.global_transform;car.body.last_safe=car.body.global_transform

func start_at_forest():
 start_at_home()
 apartment.interact("home_leave")
 var x=-94.0;var station=preload("res://scripts/woodland_trial.gd").new()
 var z=-station.trail_s(x);station.free()
 var terrain=preload("res://scripts/valley_landscape.gd").new()
 lab.player.global_position=Vector3(x,terrain.terrain_height(x,-z)+.12,z);terrain.free()
 lab.player.rotation=Vector3(0,PI/2,0);lab.player.camera.rotation.x=-.04;lab.player.reset_motion()

func initialize_aircraft():
 for spec in [[Vector3(-43,-47.9,-989),"gyro_home",Color(.95,.58,.04)],[Vector3(9,.12,-82),"gyro_lab",Color(.15,.48,.72)]]:
  var gyro=preload("res://scripts/flyable_gyrocopter.gd").new();add_child(gyro);gyro.build(lab,self,spec[0],spec[1],spec[2]);gyrocopters.append(gyro)
