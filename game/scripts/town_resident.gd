extends "res://scripts/lab_props.gd"
var rig:Skeleton3D
var head:int=-1
var t:=0.0
func build(style:int):
 init_materials();set_meta("dynamic",true)
 var female=style>=2
 var model=load("res://art/characters/rigged/lab_visitor.glb" if female else "res://art/characters/rigged/axel.glb").instantiate();add_child(model)
 model.scale=Vector3(1.04,1.0,1.02) if female else Vector3(1.10,1.04,1.05)
 var cloth=material(Color(.55,.022,.045) if style==2 else (Color(.035,.12,.42) if style==3 else Color(.035,.035,.032)),0,.8)
 var skin=material(Color(.64,.42,.31) if style!=3 else Color(.43,.25,.16),0,.85)
 for n in model.find_children("*","MeshInstance3D",true,false):
  n.layers=2
  var title=str(n.name)
  if "Body" in title or "Arms" in title:n.material_override=skin if female and "Arms" in title else cloth
  if "Legs" in title:n.material_override=skin if female else material(Color(.065,.17,.31) if style==1 else Color(.12,.105,.08),0,.9)
  if "Feet" in title:
   n.material_override=material(Color(.025,.025,.028),0,.65)
   if not female:n.hide()
  if "Head" in title or "Superhero" in title:n.material_override=skin
  if title.begins_with("Sphere"):n.hide()
 rig=model.find_children("*","Skeleton3D",true,false)[0]
 for side in ["l","r"]:
  var index=rig.find_bone("upperarm_"+side)
  if index<0:continue
  var parent=rig.get_bone_parent(index);var basis=rig.get_bone_global_rest(parent).basis.get_rotation_quaternion()
  var turn=Quaternion(Vector3.BACK,deg_to_rad(-78 if side=="l" else 78))
  rig.set_bone_pose_rotation(index,basis.inverse()*turn*basis*rig.get_bone_pose_rotation(index))
 head=rig.find_bone("Head");t=style*1.3
 if female:
  cylinder(Vector3(0,.73,0),.32,.62,cloth,.205)
  cylinder(Vector3(0,1.105,0),.19,.16,cloth,.18)
  cylinder(Vector3(0,1.055,0),.211,.04,material(Color(.65,.49,.22),.65,.35))
  box(Vector3(.38,.84,.02),Vector3(.18,.25,.12),rubber)
  tube(Vector3(.34,.99,.02),Vector3(.25,1.40,.02),.015,rubber)
  for x in [-.105,.105]:ellipsoid(Vector3(x,1.64,.025),Vector3(.019,.03,.019),brass)
 else:
  var trousers=material(Color(.065,.17,.31) if style==1 else Color(.12,.105,.08),0,.95)
  for side in [-1,1]:
   cylinder(Vector3(side*.105,.30,0),.084,.42,trousers,.098)
   ellipsoid(Vector3(side*.105,.085,.045),Vector3(.095,.07,.17),material(Color(.80,.80,.75),0,.8))
   box(Vector3(side*.105,.034,.045),Vector3(.19,.035,.32),rubber)
  if style==0:
   label_at("BOSS",Vector3(0,1.36,.115),34,Color(.95,.94,.90),.0016)
   for spec in [[1.27,Color(.58,.37,.19)],[1.245,Color(.88,.86,.80)]]:box(Vector3(0,spec[0],.12),Vector3(.34,.019,.01),material(spec[1],0,.8))
  # A gym duffel reinforces the residents' athletic look without blocking paths.
  box(Vector3(.37,.71,0),Vector3(.23,.24,.36),rubber)
  tube(Vector3(.37,.82,-.12),Vector3(.37,1.01,0),.014,rubber);tube(Vector3(.37,1.01,0),Vector3(.37,.82,.12),.014,rubber)
 var body=StaticBody3D.new();add_child(body);var cs=CollisionShape3D.new();var capsule=CapsuleShape3D.new();capsule.radius=.24;capsule.height=1.65;cs.shape=capsule;cs.position.y=.85;body.add_child(cs)
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
func _process(delta):
 t+=delta
 if head>=0:rig.set_bone_pose_rotation(head,Quaternion(Vector3.UP,sin(t*.6)*.08))
