extends "res://scripts/lab_props.gd"
func build(land):
 name="DalarnaMeadow";init_materials()
 var gardens=land.get_node("VillageGardens")
 for spec in [Vector3(20,952,1),Vector3(40,959,2),Vector3(66,949,1),Vector3(22,978,1),Vector3(66,982,2),Vector3(40,991,1)]:
  var p=Vector3(spec.x,-48,-spec.y);var first=land.get_child_count()
  land.cottage(p,6.2,7.4,Color(.53,.055,.035),int(spec.z))
  var walls=land.get_child(first)
  for child in walls.get_children():
   if child is MeshInstance3D:child.material_override=gardens.falu
  gardens.garden(p,6.2,7.4)
  for dx in [-3,3]:gardens.bush(p+Vector3(dx,0,5.5),.8,true)
 var midsummer=preload("res://scripts/midsummer_green.gd").new();add_child(midsummer);midsummer.build(land,Vector3(38,-48,-1043))
 for spec in [Vector3(54,1017,3.4),Vector3(66,1068,4)]:pond(land,spec)
 # Small productive plots with visible strawberries and white blossom, all instanced.
 for row in 7:
  for col in 16:
   var p=Vector3(49+row*.75,-48.02,-1033-col*.8)
   gardens.instance("leaf",p+Vector3.UP*.17,Vector3(.30,.12,.27),Color(.08,.24,.055))
   for k in 3:
    gardens.instance("rose",p+Vector3(.10*k-.08,.16,.11),Vector3(.038,.050,.038),Color(.8,.025,.03))
   if col%3==0:gardens.flower_patch(p,.2,2)
 for i in 45:
  var p=Vector3(14+fmod(i*13.73,61),-48.02,-1000-fmod(i*7.3,23))
  if Vector2(p.x-54,-p.z-1017).length()<5:continue
  gardens.flower_patch(p,.8,2)
  if i%4==0:gardens.bush(p,.8,true)
 gardens.flush_batches()
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=8 if mesh.get_meta("lake_surface",false) else 2
func pond(land,spec):
 var p=Vector3(spec.x,-48.28,-spec.y)
 var water=material(Color(.10,.27,.29,.88),.35,.20)
 var disk=cylinder(p,spec.z*.82,.025,water);disk.set_meta("lake_surface",true)
 var rock=material(Color(.36,.38,.35),.05,.94)
 for i in 30:
  var a=i*TAU/30;var q=p+Vector3(cos(a)*spec.z*.91,0,sin(a)*spec.z*.91)
  q.y=land.terrain_height(q.x,-q.z)+.10
  var stone=ellipsoid(q,Vector3(.30+.08*sin(i),.20,.27),rock);stone.rotation.y=a
 for i in 5:
  var a=i*2.4;var q=p+Vector3(cos(a)*spec.z*.45,.022,sin(a)*spec.z*.45)
  cylinder(q,.17,.009,material(Color(.15,.32,.08),0,.6))
