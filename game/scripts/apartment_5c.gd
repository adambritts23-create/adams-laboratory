extends "res://scripts/lab_props.gd"
# Dimensions are approximated from the supplied plan; +X is the rear window wall.
var route
var inside:=false
var home:Vector3
var interior_environment:Environment
var rear_view:SubViewport
var rear_camera:Camera3D
var balcony
const REAR_ORIGIN=Vector3(-63.5,-38.85,-971)
func build(r):
 route=r;name="Apartment5C";init_materials();home=route.home_entry
 position=Vector3(5500,9.15,-2700)
 # Hide the opaque exterior shell only from the rear-view camera.
 var shell=route.find_child("Sevallagatan5C",true,false)
 if shell!=null:
  for n in shell.find_children("*","GeometryInstance3D",true,false):n.layers=16
 var wall=material(Color(.86,.83,.76),0,.93)
 var wood=material(Color(.48,.30,.14),0,.7)
 var white=material(Color(.90,.89,.82),0,.6)
 var coral=material(Color(.88,.26,.20),0,.98)
 var linen=material(Color(.26,.24,.24),0,1)
 var pine=material(Color(.64,.43,.23),0,.7)
 # Main room 6.6 x 5 m; extended hall and larger bathroom, based on user corrections.
 for spec in [[Vector3(3.3,-.12,2.5),Vector3(6.6,.24,5)],[Vector3(4.85,-.12,-2.45),Vector3(3.5,.24,4.9)],[Vector3(1.75,-.12,-2.95),Vector3(2.7,.24,2.7)],[Vector3(-.05,-.12,-.8),Vector3(6.3,.24,1.6)]]:
  box(spec[0],spec[1],wood,true)
  box(spec[0]+Vector3.UP*2.94,spec[1],white,true)
 for x in range(13):
  for z in range(5):box(Vector3(.25+x*.5,.006,.5+z),Vector3(.49,.009,.99),material(Color(.54,.37,.20).lightened(((x*17+z*13)%9)*.009),0,.7))
 var sofa_wall=box(Vector3(3.3,1.35,5),Vector3(6.6,2.7,.14),wall,true)
 sofa_wall.set_meta("mirror_wall_layer",128);sofa_wall.name="PurchaseWallPiano"
 var bed_wall=box(Vector3(0,1.35,2.5),Vector3(.14,2.7,5),wall,true)
 bed_wall.set_meta("mirror_wall_layer",64)
 box(Vector3(4.85,1.35,-4.9),Vector3(3.5,2.7,.14),wall,true)
 box(Vector3(1.75,1.35,-4.3),Vector3(2.7,2.7,.14),wall,true)
 box(Vector3(.4,1.35,-2.95),Vector3(.14,2.7,2.7),wall,true)
 var purchase_hall=box(Vector3(-.7,1.35,-1.6),Vector3(5.0,2.7,.14),wall,true);purchase_hall.name="PurchaseWallHall"
 box(Vector3(-1.6,1.35,0),Vector3(3.2,2.7,.14),wall,true)
 # Hall entrance and bathroom door gaps, with lintels.
 box(Vector3(-3.2,2.45,-.8),Vector3(.14,.5,1.6),wall,true)
 for z in [-1.5,-.1]:box(Vector3(-3.2,1.1,z),Vector3(.14,2.2,.20),wall,true)
 box(Vector3(-3.14,1.1,-.8),Vector3(.08,2.2,1.12),wood,true,"home_leave","Leave apartment · third-floor landing")
 var sign=label_at("5C · THIRD FLOOR\nE · Return outside",Vector3(-3.08,1.65,-.8),25,Color.WHITE,.0025);sign.rotation.y=PI/2
 box(Vector3(2.45,2.45,-1.6),Vector3(1.3,.5,.14),wall,true)
 box(Vector3(3.1,1.35,-3.25),Vector3(.14,2.7,3.3),wall,true)
 box(Vector3(3.1,1.35,-.65),Vector3(.14,2.7,1.3),wall,true)
 box(Vector3(3.75,1.35,0),Vector3(1.3,2.7,.14),wall,true)
 box(Vector3(6.1,1.35,0),Vector3(1.0,2.7,.14),wall,true)
 box(Vector3(5.0,2.45,0),Vector3(1.2,.5,.14),wall,true)
 # Wall return beside the desk forms a distinct 1.2 m hall-to-room doorway.
 box(Vector3(.8,1.35,0),Vector3(1.6,2.7,.14),wall,true)
 box(Vector3(2.95,1.35,0),Vector3(.3,2.7,.14),wall,true)
 box(Vector3(2.2,2.45,0),Vector3(1.2,.5,.14),wall,true)
 for x in [1.6,2.8]:box(Vector3(x,1.1,.085),Vector3(.065,2.2,.055),white)
 box(Vector3(2.2,2.2,.085),Vector3(1.27,.065,.055),white)
 # Built-in hall wardrobe and narrow storage cupboard.
 box(Vector3(-.8,1.05,-.28),Vector3(1.2,2.1,.5),white,true)
 box(Vector3(2.85,1.05,-.6),Vector3(.4,2.1,.95),white,true)
 # Rear wall built around actual openings (no opaque panel behind the views).
 var gaps=[Vector2(-3.3,-.55),Vector2(.55,1.7),Vector2(2.0,3.05),Vector2(3.35,4.55)]
 var edge=-4.9
 for gap in gaps:
  if gap.x>edge:box(Vector3(6.6,1.35,(edge+gap.x)*.5),Vector3(.14,2.7,gap.x-edge),wall,true)
  if not is_equal_approx(gap.x,.55):box(Vector3(6.6,.4,(gap.x+gap.y)*.5),Vector3(.14,.8,gap.y-gap.x),wall,true)
  box(Vector3(6.6,2.55,(gap.x+gap.y)*.5),Vector3(.14,.3,gap.y-gap.x),wall,true)
  edge=gap.y
 box(Vector3(6.6,1.35,(edge+5)*.5),Vector3(.14,2.7,5-edge),wall,true)
 build_rear_windows(gaps,white)
 # Deeper connected L kitchen: full-height pantry immediately left of the entry.
 var kitchen=preload("res://scripts/apartment_kitchen.gd").new();add_child(kitchen);kitchen.build()
 # Bathroom with corner shower, basin and WC.
 box(Vector3(1.75,.018,-2.95),Vector3(2.55,.03,2.55),material(Color(.51,.53,.51),0,.8))
 box(Vector3(2.6,.10,-3.75),Vector3(.86,.20,.9),white,true)
 var glass=material(Color(.75,.86,.89,.22),.1,.18)
 box(Vector3(2.16,1.05,-3.75),Vector3(.03,1.9,.9),glass)
 box(Vector3(2.6,1.05,-3.3),Vector3(.86,1.9,.03),glass)
 tube(Vector3(2.95,.5,-4.1),Vector3(2.95,2.1,-4.1),.025,metal)
 ellipsoid(Vector3(.85,.83,-3.35),Vector3(.34,.13,.25),white)
 box(Vector3(.85,.43,-3.35),Vector3(.45,.8,.35),white,true)
 ellipsoid(Vector3(2.55,.42,-2.35),Vector3(.39,.25,.27),white)
 box(Vector3(2.92,.76,-2.35),Vector3(.18,.62,.48),white,true)
 # Bed left, sofa along bottom, desk upper left, piano along rear/right wall.
 var mark=get_child_count()
 box(Vector3(-2.65,.32,1.65),Vector3(1.1,.40,2.05),linen,true)
 box(Vector3(-2.65,.60,1.65),Vector3(1.12,.22,2.00),coral)
 box(Vector3(-3.10,.94,1.65),Vector3(.24,.65,2.06),coral,true)
 for z in [.55,2.75]:box(Vector3(-2.65,.72,z),Vector3(1.15,.55,.20),coral,true)
 move_group(mark,Vector3(-2.65,0,1.65),Vector3(3.55,0,4.35),1.570796)
 mark=get_child_count()
 box(Vector3(2.35,.31,1.3),Vector3(2,.62,2.4),dark,true)
 box(Vector3(2.35,.69,1.3),Vector3(2.02,.19,2.4),linen)
 box(Vector3(2.35,.97,.07),Vector3(2.1,1.05,.12),wood,true)
 for x in [1.85,2.78]:box(Vector3(x,.87,.5),Vector3(.80,.19,.48),dark)
 move_group(mark,Vector3(2.35,0,1.3),Vector3(1.1,0,3.65),PI)
 mark=get_child_count()
 # Green geometric rug and white coffee table.
 box(Vector3(-.55,.025,2.2),Vector3(3.3,.025,3.5),material(Color(.34,.39,.16),0,1))
 box(Vector3(-1.55,.041,2.2),Vector3(.75,.006,3.5),dark)
 box(Vector3(-.7,.045,2.2),Vector3(.14,.006,3.5),white)
 box(Vector3(-.55,.044,1.65),Vector3(3.3,.006,.12),white)
 table(Vector3(-.55,0,1.9),Vector2(1.7,.95),white,.53)
 move_group(mark,Vector3(-.55,0,2.2),Vector3(3.35,0,2.95),0)
 mark=get_child_count()
 # Piano facing into room beneath the window.
 box(Vector3(-1.7,.6,4.4),Vector3(1.55,1.2,.4),dark,true)
 box(Vector3(-1.7,.78,4.03),Vector3(1.55,.10,.42),dark,true)
 for i in 36:
  box(Vector3(-2.43+i*.041,.843,3.99),Vector3(.039,.012,.23),white)
  if i%7 in [0,1,3,4,5]:box(Vector3(-2.41+i*.041,.86,4.05),Vector3(.022,.025,.13),dark)
 for i in 3:box(Vector3(-1.82+i*.12,.14,3.97),Vector3(.07,.04,.16),brass)
 move_group(mark,Vector3(-1.7,0,4.4),Vector3(6.15,0,2.95),1.570796)
 mark=get_child_count()
 # Desk and circular black shelving from user's photo.
 table(Vector3(2.9,0,3.8),Vector2(1.65,.68),dark,.76)
 chair(Vector3(2.9,0,2.95),dark,PI)
 move_group(mark,Vector3(2.9,0,3.8),Vector3(.5,0,.95),-PI/2)
 # Shelf is authored directly in the west wall plane, independently of the desk.
 for i in 64:
  var a=i*TAU/64;var b=(i+1)*TAU/64
  tube(Vector3(.16,1.85+sin(a)*.63,.95+cos(a)*.63),Vector3(.16,1.85+sin(b)*.63,.95+cos(b)*.63),.016,dark)
 for h in [1.38,1.9,2.25]:box(Vector3(.25,h,.95),Vector3(.26,.035,.95),wood)
 for i in 7:box(Vector3(.27,1.51,.63+i*.07),Vector3(.16,.23,.045),material(Color(.25+i*.07,.20,.16)))
 cylinder(Vector3(.26,2.31,.70),.075,.12,white)
 plant(Vector3(.26,2.39,.70))
 # Bed linen seams and folded throw add depth without filling the walking space.
 for z in [2.65,2.72]:box(Vector3(1.1,.793,z),Vector3(1.97,.012,.016),white)
 box(Vector3(1.12,.805,2.8),Vector3(1.85,.035,.48),material(Color(.35,.43,.46),0,1))

 var finishing=preload("res://scripts/interior_finishing.gd").new();add_child(finishing);finishing.build_apartment(self)
 # Dresser / television at upper edge of main room.
 box(Vector3(3.7,.6,.48),Vector3(1.5,1.2,.55),pine,true)
 box(Vector3(3.7,1.65,.48),Vector3(1.45,.8,.065),dark)
 for p in [Vector3(3,2.45,2.5),Vector3(4.6,2.4,-2),Vector3(.6,2.4,-.8),Vector3(2,2.4,-2.7)]:
  var light=OmniLight3D.new();add_child(light);light.position=p;light.light_color=Color(1,.63,.35);light.light_energy=.44;light.omni_range=5;light.shadow_enabled=false;light.light_cull_mask=4|64|128
 interior_environment=Environment.new();interior_environment.background_mode=Environment.BG_COLOR;interior_environment.background_color=Color(.6,.73,.8);interior_environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;interior_environment.ambient_light_color=Color(1,.79,.61);interior_environment.ambient_light_energy=.40
 for n in find_children("*","GeometryInstance3D",true,false):
  n.layers=int(n.get_parent().get_meta("mirror_wall_layer",4))
 var decor=preload("res://scripts/apartment_soft_details.gd").new();add_child(decor);decor.build()
 var mirrors=preload("res://scripts/apartment_mirrors.gd").new();add_child(mirrors);mirrors.build(self)
 var display=preload("res://scripts/entrance_weapon_display.gd").new();add_child(display);display.build(route)
 balcony=preload("res://scripts/apartment_balcony.gd").new();add_child(balcony);balcony.build(self)
 var entrance=StaticBody3D.new();route.add_child(entrance);entrance.position=home+Vector3(.42,1.25,0);entrance.set_meta("interaction","home_enter");entrance.set_meta("title","Enter apartment · third floor")
 var c=CollisionShape3D.new();var shape=BoxShape3D.new();shape.size=Vector3(.20,2.5,1.5);c.shape=shape;entrance.add_child(c)
func move_group(first:int,origin:Vector3,destination:Vector3,yaw:float):
 var basis=Basis(Vector3.UP,yaw)
 for i in range(first,get_child_count()):
  var node=get_child(i)
  if node is Node3D:node.position=destination+basis*(node.position-origin);node.rotation.y+=yaw
func build_rear_windows(gaps,white):
 rear_view=SubViewport.new();rear_view.name="RearWindowView";rear_view.size=Vector2i(640,400);rear_view.world_3d=get_viewport().world_3d;rear_view.render_target_update_mode=SubViewport.UPDATE_DISABLED;add_child(rear_view)
 rear_camera=Camera3D.new();rear_view.add_child(rear_camera);rear_camera.cull_mask=2|8;rear_camera.far=300;rear_camera.current=true
 var view_material=ShaderMaterial.new();view_material.shader=preload("res://materials/apartment_window.gdshader");view_material.set_shader_parameter("outside_view",rear_view.get_texture())
 for gap in gaps:
  var z=(gap.x+gap.y)*.5;var width=gap.y-gap.x
  var pane=MeshInstance3D.new();var mesh=QuadMesh.new();mesh.size=Vector2(width,2.3 if is_equal_approx(gap.x,.55) else 1.6);pane.mesh=mesh;pane.material_override=view_material;add_child(pane);pane.position=Vector3(6.58,1.25 if is_equal_approx(gap.x,.55) else 1.6,z);pane.rotation.y=-PI/2
  if is_equal_approx(gap.x,.55):continue
  box(Vector3(6.6,1.6,z),Vector3(.03,1.6,width),material(Color(1,1,1,0)),true)
  for edge in [gap.x,gap.y,z]:box(Vector3(6.51,1.6,edge),Vector3(.12,1.65,.045),white)
  for y in [.8,2.4]:box(Vector3(6.51,y,z),Vector3(.15,.055,width+.10),white)
  box(Vector3(6.42,.77,z),Vector3(.38,.05,width+.1),white)
var window_refresh_time := 0.0
func _process(_delta):
 if rear_view==null:return
 var camera=get_viewport().get_camera_3d()
 var active=camera!=null and camera.global_position.distance_to(global_position)<25
 if active:
  active=-camera.global_basis.z.x>-.15 # Window wall is east; skip outdoor rendering when looking inward.
 rear_view.render_target_update_mode=SubViewport.UPDATE_DISABLED
 if not active:return
 window_refresh_time+=_delta
 if window_refresh_time<.125:return
 window_refresh_time=0.0
 rear_view.render_target_update_mode=SubViewport.UPDATE_ONCE
 var turn=Basis(Vector3.UP,PI)
 rear_camera.global_transform=Transform3D(turn*camera.global_basis,REAR_ORIGIN+turn*(camera.global_position-global_position))
 rear_camera.fov=camera.fov;rear_camera.environment=route.outdoor_environment
 var screen=get_viewport().get_visible_rect().size
 var size=Vector2i(minf(screen.x,640),minf(screen.x,640)*screen.y/screen.x)
 if rear_view.size!=size:rear_view.size=size
func interact(id:String)->bool:
 if id=="apartment_ammo":
  var weapon=route.lab.expansion
  if not weapon.owns_rifle:route.lab.say("Pick up the AK-47 first.")
  else:
   weapon.rounds=30;weapon.chambered=false;weapon.rack_time=0;weapon.held_rifle.remove_meta("racking") if weapon.held_rifle.has_meta("racking") else null
   route.lab.say("30-round magazine loaded · E to chamber",4)
  return true
 if id=="apartment_rifle":
  route.lab.expansion.pickup_rifle(false)
  if route.lab.expansion.equipped:
   get_node("EntranceWeaponDisplay/UsableApartmentAK47").hide()
   get_node("EntranceWeaponDisplay/ApartmentAKPickup").collision_layer=0
  return true
 if balcony!=null and balcony.interact(id):return true
 if id not in ["home_enter","home_leave"]:return false
 inside=id=="home_enter"
 var player=route.lab.player;player.velocity=Vector3.ZERO
 player.position=global_position+Vector3(-2.35,.12,-.8) if inside else home+Vector3(2,.15,0)
 player.rotation.y=-PI/2 if inside else -PI/2
 player.camera.rotation.x=0
 player.reset_motion()
 player.camera.environment=interior_environment if inside else route.outdoor_environment
 route.lab.say("Sevallagatan 5C · third floor" if inside else "Outside Sevallagatan 5C")
 return true
func table(p:Vector3,size:Vector2,mat:Material,h:float):
 box(p+Vector3.UP*h,Vector3(size.x,.06,size.y),mat,true)
 for x in [-1,1]:
  for z in [-1,1]:box(p+Vector3(x*(size.x*.5-.08),h*.5,z*(size.y*.5-.08)),Vector3(.06,h,.06),mat)
func chair(p:Vector3,mat:Material,yaw:float=0):
 box(p+Vector3.UP*.45,Vector3(.45,.08,.45),mat,true)
 box(p+Vector3(0,.76,.23 if yaw==0 else -.23),Vector3(.45,.60,.055),mat,true)
 for x in [-.18,.18]:
  for z in [-.18,.18]:box(p+Vector3(x,.22,z),Vector3(.045,.44,.045),mat)
func plant(p:Vector3,scale_value:float=1):
 for i in 7:ellipsoid(p+Vector3(sin(i*2.4)*.13,cos(i)*.06,cos(i*2.4)*.15)*scale_value,Vector3(.10,.035,.06)*scale_value,material(Color(.19,.32,.12),0,.9))
