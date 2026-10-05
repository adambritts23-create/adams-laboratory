extends "res://scripts/lab_props.gd"
# Real post-mission access. Stair treads share continuous incline colliders so the
# unchanged CharacterBody controller can climb them without a step-up rewrite.
var hall: Node3D
var gate: StaticBody3D
var status: Label3D
var beacon: MeshInstance3D
var unlocked:=false
var opened:=false
var lift:=0.0
var route_points: Array[Vector3]=[
 Vector3(-4.7,0,9.5),Vector3(-8,0,9.5),Vector3(-16,0,9.5),Vector3(-16,0,11),
 Vector3(-16,-6,23),Vector3(-31,-6,23),Vector3(-31,-6,0),Vector3(-35,-6,0),
 Vector3(-35,-6,14),Vector3(-44,-6,14),Vector3(-44,-6,12),Vector3(-45,-6,12),
 Vector3(-51,-1,12),Vector3(-57,4,12),Vector3(-58.6,4,12),Vector3(-58.6,4,14),
 Vector3(-62,4,14),Vector3(-62,4,15.5),Vector3(-62,-6,35.5),Vector3(-62,-6,36.5),Vector3(-59,-6,36.5),
 Vector3(-59,-6,38.8),Vector3(-40,-6,38.8),Vector3(-40,-6,26),Vector3(-31,-6,26),Vector3(-16,-6,24),Vector3(-16,-6,23),
 Vector3(-16,0,11),Vector3(-16,0,9.5),Vector3(-8,0,9.5),Vector3(-4.7,0,9.5)]

func build(facility: Node3D) -> void:
	hall=facility;init_materials();set_meta("dynamic",true)
	metal=hall.metal;worn=hall.steel;brass=hall.safety
	name="PlantAccess"
	build_door()
	deck(Vector3(-6,0,9.5),Vector3(-17,0,9.5),3.2)
	landing(Vector3(-16,0,10),Vector2(3.2,5))
	stairs(Vector3(-16,0,12.5),Vector3(-16,-6,23),3)
	landing(Vector3(-16,-6,23),Vector2(3.2,3.2))
	deck(Vector3(-17,0,7),Vector3(-17,0,9.5),3.2)
	landing(Vector3(-16,0,7),Vector2(3.2,3.2))
	stairs(Vector3(-17,0,7),Vector3(-27,4,7),3)
	deck(Vector3(-27,4,7),Vector3(-30,4,7),3.2)
	deck(Vector3(-30,4,7),Vector3(-30,4,-17),3)
	deck(Vector3(-30,4,-17),Vector3(-34,4,-17),3)
	deck(Vector3(-34,4,-17),Vector3(-37,4,-17),3)
	landing(Vector3(-34,4,-17),Vector2(3.2,3.2))
	deck(Vector3(-37,4,-29),Vector3(-37,4,-17),3)
	deck(Vector3(-37,4,-17),Vector3(-37,4,14),3)
	deck(Vector3(-37,4,14),Vector3(-58.6,4,14),3)
	deck(Vector3(-58.6,4,12),Vector3(-58.6,4,14),3.2)
	landing(Vector3(-58.6,4,12),Vector2(3.2,3.2))
	stairs(Vector3(-57,4,12),Vector3(-51,-1,12),3)
	stairs(Vector3(-51,-1,12),Vector3(-45,-6,12),3)
	for p in [Vector3(-30,4,7),Vector3(-30,4,-17),Vector3(-37,4,-17),Vector3(-37,4,14),Vector3(-58.6,4,14)]: landing(p,Vector2(3.2,3.2))
	deck(Vector3(-58.6,4,14),Vector3(-62,4,14),3)
	landing(Vector3(-62,4,12.4),Vector2(3.2,3.2))
	deck(Vector3(-62,4,12.4),Vector3(-62,4,14),3.2)
	stairs(Vector3(-62,4,15.5),Vector3(-62,-6,35.5),3)
	stairs(Vector3(-34,4,-18.5),Vector3(-34,9,-28.5),3)
	landing(Vector3(-34,9,-30.1),Vector2(3.2,3.2))
	deck(Vector3(-34,9,-30.1),Vector3(-41,9,-30.1),3)
	landing(Vector3(-41,9,-30.1),Vector2(3.2,3.2))
	guard(Vector3(-42.4,9,-31.6),Vector3(-42.4,9,-28.6))
	plaque("PLANT OVERLOOK / DISTRICTS 01—05",Vector3(-37,10.4,-31.5),Vector2(5,.6),0,true)
	# End guard at the tank overlook, side openings only where two decks join.
	guard(Vector3(-38.5,4,-30.4),Vector3(-35.5,4,-30.4))
	for item in [[Vector3(-10,1.5,8),"LAB B  ←  /  SERVICE ROUTE"],[Vector3(-16,-3.8,24.5),"02 PRECIPITATION  ←  /  03 SEPARATION"],[Vector3(-30,5.5,10.9),"FILTERS / UPPER SERVICE WALK"],[Vector3(-37,5.5,-28.8),"TANK HALL / OVERLOOK"],[Vector3(-48,5.5,15.4),"04 THERMAL  /  05 HANDLING →"]]:
		plaque(item[1],item[0],Vector2(3,.5),0)
	# Floor lane markings join all main districts without fencing the whole floor.
	for line in [[Vector3(-16,-6,23),Vector3(-16,-6,24)],[Vector3(-16,-6,24),Vector3(-13,-6,24)],[Vector3(-13,-6,24),Vector3(-13,-6,-28)],[Vector3(-13,-6,-28),Vector3(-39,-6,-28)],[Vector3(-16,-6,23),Vector3(-31,-6,23)],[Vector3(-31,-6,23),Vector3(-31,-6,14)],[Vector3(-31,-6,14),Vector3(-45,-6,14)]]:
		var a: Vector3=line[0];var b: Vector3=line[1]
		var n:=int(a.distance_to(b))
		for i in n:
			var p:=a.lerp(b,float(i)/n)+Vector3.UP*.015
			box(p,Vector3(.16,.012,.48),metal).rotation.y=atan2(b.x-a.x,b.z-a.z)
	# Continuous tour markers link the actual ground route; elevated rails carry on.
	for i in range(4,route_points.size()-1):
		var a:=route_points[i];var b:=route_points[i+1]
		if a.y!= -6 or b.y!= -6: continue
		var count:=maxi(1,int(a.distance_to(b)))
		for j in count:
			var pos:=a.lerp(b,float(j)/count)+Vector3.UP*.025
			box(pos,Vector3(.24,.015,.45),brass).rotation.y=atan2(b.x-a.x,b.z-a.z)
	for data in [[Vector3(-31,-3.8,17),"02 → 03 / SEPARATION"],[Vector3(-35,-3.8,12),"03 → 04 / UPPER THERMAL"],[Vector3(-60,5.5,12),"04 → 05 / FINAL HANDLING"],[Vector3(-60.5,-3.8,32),"05 / STORAGE   ·   LAB B RETURN →"]]:
		plaque(data[1],data[0],Vector2(4,.65),0,true)
	# Secure inaccessible ladders/lofts with visible closed maintenance gates.
	for p in [Vector3(-73,-6,-30),Vector3(-12,-6,27)]:
		box(p+Vector3(0,.85,0),Vector3(.10,1.7,1.3),worn,true)
		plaque("MAINTENANCE\nLOCKED",p+Vector3(.07,1.2,0),Vector2(1,.4),PI/2,true)
	call_deferred("batch_static")

func build_door() -> void:
	gate=StaticBody3D.new();gate.position=Vector3(-6.02,0,9.5)
	gate.set_meta("dynamic",true);gate.set_meta("interaction","plant_gate");gate.set_meta("title","Open plant access")
	add_child(gate)
	var shape:=CollisionShape3D.new();var slab:=BoxShape3D.new();slab.size=Vector3(.22,2.96,2.54)
	shape.shape=slab;shape.position.y=1.48;gate.add_child(shape)
	var before:=get_child_count()
	box(Vector3(-6.02,1.48,9.5),Vector3(.22,2.96,2.54),worn)
	for y in [.4,1.0,1.6,2.2,2.8]: box(Vector3(-5.88,y,9.5),Vector3(.04,.06,2.4),metal)
	for z in [8.45,10.55]: box(Vector3(-5.87,1.4,z),Vector3(.045,2.6,.12),brass)
	plaque("PLANT ACCESS\nPRESS E TO OPEN",Vector3(-5.85,1.9,9.5),Vector2(1.9,.7),PI/2,true)
	for n in get_children().slice(before): n.reparent(gate)
	for z in [8.12,10.88]: box(Vector3(-6,1.6,z),Vector3(.45,3.2,.18),metal,true)
	box(Vector3(-6.24,3.4,9.5),Vector3(.7,.7,3.0),worn)
	status=label_at("PRESS E / OPEN DOOR",Vector3(-5.78,3.23,9.5),24,Color(.92,.27,.08),.0025)
	status.rotation.y=PI/2;status.set_meta("dynamic",true)
	beacon=cylinder(Vector3(-5.75,3.66,9.5),.10,.20,red);beacon.set_meta("dynamic",true)

func unlock() -> void:
	if unlocked: return
	unlocked=true
	status.text="ACCESS RELEASED / SERVICE ROUTE"
	status.modulate=Color(.65,.85,.39)
	beacon.material_override=green
	gate.set_meta("title","Plant access · opening")

func animate(delta: float) -> void:
	if not unlocked or opened: return
	lift=move_toward(lift,3.35,delta*1.2)
	gate.position.y=lift
	opened=lift>=3.35
	if opened: gate.set_meta("title","Plant access · open")

func landing(p: Vector3, size: Vector2) -> void:
	box(p-Vector3.UP*.10,Vector3(size.x,.20,size.y),worn,true)

func deck(a: Vector3,b: Vector3,width: float) -> void:
	var dir: Vector3=(b-a).normalized()
	var side:=dir.cross(Vector3.UP)*width*.5
	var length:=a.distance_to(b)
	var slab:=box((a+b)*.5-Vector3.UP*.10,Vector3(width,.20,length),worn,true)
	slab.rotation.y=atan2(dir.x,dir.z)
	for s in [-1,1]:
		if length>3.1: guard(a+side*s+dir*1.4,b+side*s-dir*1.4)
	for i in int(length/.27):
		var p:=a.lerp(b,float(i)/maxf(1,length/.27))+Vector3.UP*.006
		tube(p-side,p+side,.016,metal)
	if a.y>0:
		for p in [a,b]:
			for s in [-1,1]: box(p+side*s-Vector3.UP*((p.y+6)*.5),Vector3(.20,p.y+6,.20),worn)

func guard(a: Vector3,b: Vector3) -> void:
	for y in [.55,1.10]: tube(a+Vector3.UP*y,b+Vector3.UP*y,.036,brass)
	var count:=maxi(1,int(a.distance_to(b)/1.6))
	for i in count+1:
		var p:=a.lerp(b,float(i)/count)
		tube(p,p+Vector3.UP*1.12,.042,brass)
	var body:=StaticBody3D.new();add_child(body)
	var shape:=CollisionShape3D.new();var hull:=ConvexPolygonShape3D.new()
	var side: Vector3=Vector3(b.z-a.z,0,a.x-b.x).normalized()*.055
	var points:=PackedVector3Array()
	for p in [a,b]:
		for z in [-1,1]:
			for h in [0.0,1.15]: points.append(p+side*z+Vector3.UP*h)
	hull.points=points;shape.shape=hull;body.add_child(shape)

func stairs(a: Vector3,b: Vector3,width: float) -> void:
	var flat:=Vector3(b.x-a.x,0,b.z-a.z)
	var side:=flat.normalized().cross(Vector3.UP)*width*.5
	var count:=maxi(1,ceili(absf(b.y-a.y)/.15))
	for i in count:
		var p:=a.lerp(b,(i+.5)/count)-Vector3.UP*.085
		var tread:=box(p,Vector3(width,.12,flat.length()/count+.01),worn)
		tread.rotation.y=atan2(flat.x,flat.z)
		box(p+Vector3.UP*.067,Vector3(width*.98,.012,.05),brass).rotation.y=atan2(flat.x,flat.z)
	for s in [-1,1]:
		tube(a+side*s-Vector3.UP*.15,b+side*s-Vector3.UP*.15,.10,metal)
		guard(a+side*s,b+side*s)
	var body:=StaticBody3D.new();add_child(body)
	var shape:=CollisionShape3D.new();var hull:=ConvexPolygonShape3D.new()
	var points:=PackedVector3Array()
	for p in [a,b]:
		for s in [-1,1]:
			for y in [0.0,-.25]: points.append(p+side*s+Vector3.UP*y)
	hull.points=points;shape.shape=hull;body.add_child(shape)
