extends "res://scripts/lab_props.gd"
var economy
var screen:Label3D
func build(e):
 economy=e;init_materials();name="TradingRoom";set_meta("dynamic",true)
 var timber=material(Color(.22,.105,.05),0,.65)
 box(Vector3(-3.2,.76,-6.5),Vector3(2.5,.10,.85),timber,true)
 for x in [-4.2,-2.2]:box(Vector3(x,.37,-6.5),Vector3(.08,.74,.7),metal)
 box(Vector3(-3.2,1.48,-6.75),Vector3(2.6,1.15,.07),dark,true,"trading_terminal","Stocks · view portfolio / trade")
 screen=label_at("PORTFOLIO TERMINAL\nE TO TRADE",Vector3(-3.2,1.48,-6.70),36,Color(.35,1,.65),.0035)
 box(Vector3(-3.2,.835,-6.25),Vector3(.7,.035,.23),dark)
 for i in 12:box(Vector3(-3.51+i*.052,.86,-6.27),Vector3(.032,.014,.1),metal)
 box(Vector3(-3.2,.48,-5.35),Vector3(.65,.12,.65),dark,true)
 box(Vector3(-3.2,.88,-5.08),Vector3(.65,.75,.10),dark)
 box(Vector3(-5.8,.4,-2.5),Vector3(1.3,.8,.95),material(Color(.12,.08,.06)),true)
 label_at("THE WORLD IS YOURS, CHICO",Vector3(-3.5,2.36,-7.10),36,Color(1,.67,.3),.006)
 box(Vector3(-.8,1.55,-7.08),Vector3(1.15,1.62,.08),timber)
 var portrait=MeshInstance3D.new();add_child(portrait);portrait.name="AdamPortrait";portrait.position=Vector3(-.8,1.55,-7.03)
 var quad=QuadMesh.new();quad.size=Vector2(1.05,1.48);portrait.mesh=quad
 var photo=StandardMaterial3D.new();photo.albedo_texture=load("res://art/portraits/adam.png");photo.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;portrait.material_override=photo
 var first=get_child_count()
 var rack=box(Vector3(-6.85,1.45,-4.45),Vector3(.10,2.3,3.9),timber)
 var names=["AssaultRifle_1","SubmachineGun_1","SniperRifle_1","Shotgun_1","Pistol_1"]
 for i in names.size():
  var model=load("res://art/props/quaternius_guns/"+names[i]+".glb").instantiate();add_child(model)
  var bounds=AABB();var initial=true
  for mesh in model.find_children("*","MeshInstance3D",true,false):
   var a=mesh.get_aabb();bounds=a if initial else bounds.merge(a);initial=false
  var length=maxf(bounds.size.x,maxf(bounds.size.y,bounds.size.z))
  model.scale=Vector3.ONE*(1.05/maxf(length,.01));model.rotation.y=PI/2
  model.position=Vector3(-6.72,.65+(i/2)*.65,-5.3+(i%2)*1.65)
 var rifle=e.lab.expansion.rifle();rifle.reparent(self,false);rifle.position=Vector3(-6.65,2.15,-3.5);rifle.rotation.y=0
 e.target(self,"apartment_rifle","Take AK-47",Vector3(-6.5,2,-3.5),Vector3(.35,.5,1.4))
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=4
func _process(_dt):
 if economy!=null:screen.text="SIMULATED STOCK MARKET\nCash $%.0f · Portfolio $%.0f\nE TO TRADE" % [economy.cash,economy.portfolio_value()]
