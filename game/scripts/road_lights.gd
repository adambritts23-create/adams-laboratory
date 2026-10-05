extends "res://scripts/lab_props.gd"
var land
var fixtures=[]
var tick=0.0
var night=false
func build(l):
 land=l;name="DuskRoadLighting";init_materials();set_meta("dynamic",true)
 for s in range(150,1160,38):
  if [675,765,855,920,1010,1100].any(func(c):return absf(s-c)<9):continue
  var side=-1 if s%76==36 else 1
  var p=Vector3(l.road_x(s)+side*9.2,l.terrain_height(l.road_x(s)+side*9.2,s),-s)
  cylinder(p+Vector3.UP*3.6,.07,7.2,metal)
  tube(p+Vector3.UP*7.2,p+Vector3(-side*2.3,7.2,0),.06,metal)
  var bulb=box(p+Vector3(-side*2.3,7.15,0),Vector3(.9,.08,.4),paper)
  bulb.set_meta("dynamic",true)
  var light=SpotLight3D.new();add_child(light);light.position=p+Vector3(-side*2.3,7.05,0);light.rotation_degrees.x=-90
  light.spot_range=19;light.spot_angle=65;light.light_color=Color(1,.82,.55);light.light_energy=2.5;light.light_cull_mask=2;light.shadow_enabled=false;light.visible=false
  fixtures.append({"light":light,"bulb":bulb})
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=2
func set_darkness(dark_now:bool):
 night=dark_now
 for f in fixtures:
  f.bulb.material_override=material(Color(1,.82,.52),0,.5,2) if night else paper
func _process(dt):
 if land==null:return
 tick+=dt
 if tick<.5:return
 tick=0
 # Photocell responds to the actual outdoor sun, not player distance or viewpoint.
 var dark_now=false
 for sun in land.route.get_children():
  if sun is DirectionalLight3D and sun.light_cull_mask & 2:
   dark_now=(sun.get_meta("sky_period")=="Night") if sun.has_meta("sky_period") else (sun.global_basis.z.y<-.035 or sun.light_energy<.15);break
 if dark_now!=night:set_darkness(dark_now)
 var p=land.route.lab.player.global_position
 for f in fixtures:f.light.visible=night and f.light.global_position.distance_squared_to(p)<90*90
