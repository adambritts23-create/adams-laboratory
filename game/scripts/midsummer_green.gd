extends "res://scripts/lab_props.gd"
func build(land,p:Vector3):
 name="MidsummerGreen";position=p;init_materials()
 var leaves=material(Color(.13,.25,.055),0,.9)
 var birch=material(Color(.75,.72,.57),0,.9)
 # A tall, slender Leksand-inspired majstång with leafy crossarm and suspended wreaths.
 cylinder(Vector3(0,10,0),.14,20,birch)
 box(Vector3(0,.25,0),Vector3(.65,.5,.65),concrete,true)
 tube(Vector3(-3.7,15,0),Vector3(3.7,15,0),.09,birch)
 for i in 96:
  var y=.6+i*.19;var angle=i*.9
  ellipsoid(Vector3(cos(angle)*.16,y,sin(angle)*.16),Vector3(.26,.21,.20),leaves)
 for x in [-3.2,3.2]:
  tube(Vector3(x,15,0),Vector3(x,13.5,0),.025,birch)
  var wreath=ring(Vector3(x,12.2,0),1.3,.10,leaves);wreath.rotation.x=PI/2
  for i in 36:
   var a=i*TAU/36
   ellipsoid(Vector3(x+cos(a)*1.3,12.2+sin(a)*1.3,0),Vector3(.20,.23,.18),leaves)
   if i%3==0:ellipsoid(Vector3(x+cos(a)*1.3,12.2+sin(a)*1.3,.17),Vector3.ONE*.065,paper if i%2==0 else material(Color(.82,.56,.12)))
 for i in 30:ellipsoid(Vector3(-3.65+i*.25,15,0),Vector3(.24,.22,.22),leaves)
 var flag=preload("res://scripts/swedish_flag.gd").new();add_child(flag);flag.position=Vector3(0,18.4,0);flag.scale=Vector3.ONE*.16;flag.build()
 # Benches, birch clusters and an open lawn, without fences across the dance space.
 var garden=land.get_node("VillageGardens")
 for spec in [Vector2(-16,-17),Vector2(2,-12),Vector2(-15,18),Vector2(2,15)]:
  var q=p+Vector3(spec.x,0,spec.y);q.y=land.terrain_height(q.x,-q.z)
  var tree=preload("res://scripts/residential_tree.gd").new();land.add_child(tree);tree.position=q;tree.scale=Vector3.ONE*.75
  garden.bush(q+Vector3(1,0,1),.9,true)
 for spec in [Vector2(-1,-10),Vector2(1,10)]:
  var q=Vector3(spec.x,land.terrain_height(p.x+spec.x,-p.z-spec.y)-p.y,spec.y)
  box(q+Vector3.UP*.48,Vector3(2.3,.09,.48),birch,true)
  for x in [-.9,.9]:box(q+Vector3(x,.24,0),Vector3(.12,.48,.4),dark,true)
 plaque("MIDSOMMARÄNGEN",Vector3(-7,1.5,21),Vector2(3.5,.45),0)
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
