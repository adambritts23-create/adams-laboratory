extends "res://scripts/lab_props.gd"
var apartment
var opened=false
var pivots=[]
var blockers=[]
var handles=[]
var door_tweens=[]
var total=0
var target:Node3D
var score_label:Label3D
const TARGET=Vector3(-98,-43.9,-972.125)
func build(a):
 apartment=a;name="FrenchBalcony";init_materials()
 var white=material(Color(.85,.84,.78),0,.65)
 for side in [-1,1]:
  var hinge=Node3D.new();add_child(hinge);hinge.position=Vector3(6.48,0,.55 if side==-1 else 1.7);pivots.append(hinge)
  var before=get_child_count();var z=side*-.2875
  for edge in [0.0,-side*.575]:box(Vector3(0,1.25,edge),Vector3(.055,2.3,.045),white)
  for y in [.10,1.12,2.40]:box(Vector3(0,y,z),Vector3(.055,.055,.575),white)
  tube(Vector3(-.06,1.10,-side*.51),Vector3(-.06,1.27,-side*.51),.013,metal)
  var hit=box(Vector3(0,1.25,z),Vector3(.035,2.3,.575),material(Color(.55,.7,.75,.10)),true,"balcony_toggle","Open French balcony doors")
  blockers.append(hit)
  var objects=[]
  for i in range(before,get_child_count()):objects.append(get_child(i))
  for n in objects:remove_child(n);hinge.add_child(n)
 # Jamb-mounted interaction remains reachable when the doors swing inward.
 var handle=box(Vector3(6.40,1.20,1.75),Vector3(.13,.35,.12),white,true,"balcony_toggle","Open French balcony doors");handles.append(handle)
 # Fixed Juliet guard stays in place when the glazed doors open.
 for i in 9:box(Vector3(6.54,.57,.575+i*.1375),Vector3(.035,1.10,.025),dark)
 tube(Vector3(6.54,1.14,.55),Vector3(6.54,1.14,1.7),.023,metal)
 box(Vector3(6.54,.56,1.125),Vector3(.045,1.10,1.15),material(Color(1,1,1,0)),true)
 # Move the piano slightly toward the sofa to leave the opening reachable.
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=4
 target=Node3D.new();apartment.route.grounds.add_child(target);target.name="RearGardenScoringTarget";target.position=TARGET
 var first=get_child_count()
 box(Vector3(-.04,-2.05,0),Vector3(.16,4.1,.16),wood_mat())
 box(Vector3(-.10,0,0),Vector3(.12,1.8,1.8),wood_mat())
 for spec in [[.82,Color(.89,.88,.77)],[.65,Color(.12,.14,.14)],[.49,Color(.8,.05,.025)],[.30,Color(.95,.87,.65)],[.13,Color(.9,.06,.025)]]:
  var disc=cylinder(Vector3(.01+(1-spec[0])*.025,0,0),spec[0],.008,material(spec[1],0,.9));disc.rotation.z=PI/2
 var collider=StaticBody3D.new();add_child(collider);collider.set_meta("practice_target",self)
 var shape=CollisionShape3D.new();var box_shape=BoxShape3D.new();box_shape.size=Vector3(.12,1.8,1.8);shape.shape=box_shape;collider.add_child(shape)
 score_label=label_at("TARGET · 0 points",Vector3(.12,1.15,0),30,Color.WHITE,.008);score_label.rotation.y=PI/2
 var pieces=[]
 for i in range(first,get_child_count()):pieces.append(get_child(i))
 for n in pieces:remove_child(n);target.add_child(n)
 for n in target.find_children("*","GeometryInstance3D",true,false):n.layers=2
func wood_mat():return material(Color(.30,.22,.13),0,.9)
func interact(id:String)->bool:
 if id!="balcony_toggle":return false
 opened=not opened
 for tween in door_tweens:
  if tween.is_valid():tween.kill()
 door_tweens.clear()
 for i in 2:
  var tween=create_tween();door_tweens.append(tween);tween.tween_property(pivots[i],"rotation:y",(-1 if i==0 else 1)*deg_to_rad(100) if opened else 0,.45)
  blockers[i].collision_layer=4 if opened else 1 # Keep swung-open doors selectable with E.
 for node in handles+blockers:node.set_meta("title","Close French balcony doors" if opened else "Open French balcony doors")
 apartment.route.lab.say("Balcony open · aim at the garden target" if opened else "Balcony closed",3)
 return true
func redirect_shot(origin:Vector3,direction:Vector3,first_hit:Dictionary)->Dictionary:
 if not opened or not apartment.inside:return first_hit
 var local=origin-apartment.global_position
 if direction.x<=.001:return first_hit
 var distance=(6.58-local.x)/direction.x
 if distance<0 or distance>80:return first_hit
 var crossing=local+direction*distance
 if crossing.z<.55 or crossing.z>1.7 or crossing.y<1.16 or crossing.y>2.4:return first_hit
 if not first_hit.is_empty() and origin.distance_to(first_hit.position)<distance-.03:return first_hit
 var turn=Basis(Vector3.UP,PI)
 var start=apartment.REAR_ORIGIN+turn*crossing
 var q=PhysicsRayQueryParameters3D.create(start+turn*direction*.05,start+turn*direction*(80-distance));q.collision_mask=9;q.collide_with_areas=true
 return apartment.get_world_3d().direct_space_state.intersect_ray(q)
func score_hit(point:Vector3):
 var radius=Vector2(point.y-TARGET.y,point.z-TARGET.z).length()
 var score=10 if radius<.13 else 8 if radius<.30 else 6 if radius<.49 else 4 if radius<.65 else 2
 total+=score;score_label.text="TARGET · "+str(total)+" points"
 apartment.route.lab.say("Target +"+str(score)+" · Total "+str(total)+" points",3)
