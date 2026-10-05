extends "res://scripts/lab_props.gd"
# Fictional environmental bays, not an engineering/process diagram.
var bay_centers: Array[Vector3]=[]
func build(hall: Node3D) -> void:
	init_materials();set_meta("dynamic",true);name="DistrictGeography"
	var bays: Array=[
		["01 / FEED & TANK GALLERY",Vector3(-50,-6,-30),Color(.38,.64,.77),Vector2(25,23)],
		["02 / PRECIPITATION HALL",Vector3(-24,-6,-5),Color(.64,.71,.56),Vector2(18,45)],
		["03 / SEPARATION",Vector3(-43,-6,0),Color(.38,.66,.60),Vector2(20,25)],
		["04 / THERMAL HALL",Vector3(-48,-6,22),Color(.83,.43,.18),Vector2(27,15)],
		["05 / FINAL HANDLING",Vector3(-51,-6,34),Color(.69,.73,.80),Vector2(23,14)]]
	for data in bays:
		var p: Vector3=data[1];var tint: Color=data[2];var size: Vector2=data[3]
		bay_centers.append(p)
		var trim:=material(tint,.35,.65)
		# Broad perimeter strips and portal frames identify occupied structural bays.
		for side in [-1,1]:
			box(p+Vector3(side*size.x*.5,.018,0),Vector3(.20,.025,size.y),trim)
			box(p+Vector3(0,.019,side*size.y*.5),Vector3(size.x,.025,.20),trim)
			box(p+Vector3(side*size.x*.5,7,-size.y*.5),Vector3(.30,14,.30),hall.steel)
		box(p+Vector3(0,13.9,-size.y*.5),Vector3(size.x,.42,.42),hall.steel)
		plaque(data[0],p+Vector3(size.x*.5+.05,9,0),Vector2(8,1.25),PI/2,true)
		hall.light_at(p+Vector3(0,8,0),tint,4.0,19)
	# Low separating walls retain long sightlines and leave the walking lanes open.
	box(Vector3(-51,-4.5,-16.6),Vector3(20,3,.35),hall.concrete,true)
	box(Vector3(-51,-4.8,14.8),Vector3(18,2.4,.35),hall.concrete,true)
	box(Vector3(-64,1,5),Vector3(.5,14,68),hall.concrete,true)
	# Gallery orientation board faces the arriving player from the laboratory.
	plaque("PLANT GALLERY\n01 FEED / TANKS  ·  FAR LEFT\n02 PRECIPITATION  ·  LAB WINDOWS\n03 SEPARATION  ·  CENTRAL BAY\n04 THERMAL  →  05 FINAL HANDLING\nFOLLOW AMBER FLOOR MARKERS",Vector3(-12,2.0,7.8),Vector2(4.8,1.9),0,true)
	# Purposeful elevated header joins the northern tank bay to the process front,
	# then turns through separation, thermal and final handling.
	for i in 3:
		var y:=13.2+i*.42
		hall.pipe_path([Vector3(-54,y,-33),Vector3(-34,y,-33),Vector3(-34,y,-5),Vector3(-42,y,-5),Vector3(-42,y,22),Vector3(-58,y,22),Vector3(-58,y,34)],.23+i*.04,hall.steel)
	for p in [Vector3(-34,10,-24),Vector3(-34,10,-5),Vector3(-42,10,8),Vector3(-58,10,27)]:
		box(p,Vector3(2,.25,.35),hall.steel)
		tube(p-Vector3.RIGHT*.8,p-Vector3.RIGHT*.8+Vector3.UP*5,.045,metal)
		tube(p+Vector3.RIGHT*.8,p+Vector3.RIGHT*.8+Vector3.UP*5,.045,metal)
	call_deferred("batch_static")
