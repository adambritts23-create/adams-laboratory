extends "res://scripts/lab_props.gd"
# Shared lab cabinetry; glassware and instruments use the existing CC0 library.
var glassware_count:=0
func setup() -> void:
	init_materials();set_meta("dynamic",true)
func assembly_start() -> int:return get_child_count()
func place(first: int,p: Vector3,angle: float=0) -> Node3D:
	var group:=Node3D.new();add_child(group)
	for n in get_children().slice(first,get_child_count()-1):n.reparent(group)
	group.position=p;group.rotation.y=angle;return group
func bench(p: Vector3,width: float=2.4,angle: float=0) -> void:
	var first:=assembly_start()
	box(Vector3(0,.52,0),Vector3(width,1.04,.76),painted,true)
	box(Vector3(0,1.07,0),Vector3(width+.10,.10,.88),worktop)
	for x in [-.33,0,.33]:
		for y in [.28,.57,.85]:
			box(Vector3(x*width,y,.393),Vector3(width*.30,.24,.025),worn)
			box(Vector3(x*width,y+.055,.42),Vector3(.24,.025,.035),metal)
	place(first,p,angle)
func bottle_row(p: Vector3,count: int,spacing: float=.25) -> void:
	box(p+Vector3(0,.02,0),Vector3(count*spacing+.15,.04,.38),metal)
	for i in count:
		var q:=p+Vector3((i-(count-1)*.5)*spacing,.045,0)
		vessel(["bottle","flask","volumetric","beaker"][i%4],q,.65,[amber,clear_liquid,wine][i%3],"STOCK "+str(i+1))
		glassware_count+=1
func cabinet(p: Vector3,width: float,glazed: bool=false,angle: float=0) -> void:
	var first:=assembly_start()
	box(Vector3(0,1.35,-.30),Vector3(width,2.7,.08),painted,true)
	for x in [-width*.5,width*.5]:box(Vector3(x,1.35,0),Vector3(.08,2.7,.7),worn,true)
	for y in [.12,.80,1.48,2.16,2.68]:
		box(Vector3(0,y,0),Vector3(width,.06,.70),metal)
		if y<2.6:bottle_row(Vector3(0,y+.04,0),int(width/.28),.28)
	for side in [-1,1]:
		box(Vector3(side*width*.25,1.38,.36),Vector3(width*.48,2.5,.025),glass if glazed else painted,true)
		box(Vector3(side*.10,1.36,.40),Vector3(.025,.32,.035),metal)
	plaque("GLASSWARE / CLEAN" if glazed else "CHEMICAL STOCK / CLOSED",Vector3(0,2.51,.40),Vector2(width*.84,.19),0,true)
	place(first,p,angle)
func washing(p: Vector3,angle: float=0) -> void:
	var first:=assembly_start()
	box(Vector3(0,.35,0),Vector3(2.6,.70,.76),painted,true)
	box(Vector3(.78,1.07,0),Vector3(1.04,.10,.88),worktop)
	# Open deep basin: bottom and four walls rather than a flat painted sink.
	box(Vector3(-.42,.80,0),Vector3(1.05,.04,.60),metal)
	for x in [-.96,.12]:box(Vector3(x,.98,0),Vector3(.04,.36,.66),metal)
	for z in [-.32,.32]:box(Vector3(-.42,.98,z),Vector3(1.10,.36,.04),metal)
	box(Vector3(-.42,.825,0),Vector3(.98,.015,.54),rubber)
	box(Vector3(-.42,.83,0),Vector3(.90,.008,.46),material(Color(.15,.25,.27,.65),.7,.1))
	cable([Vector3(-.4,1.1,-.35),Vector3(-.4,1.63,-.35),Vector3(-.4,1.69,.02),Vector3(-.4,1.48,.02)],metal,.023)
	for x in [-.65,-.2]:cylinder(Vector3(x,1.17,-.34),.065,.10,metal)
	box(Vector3(0,2.03,-.33),Vector3(2.5,1.20,.09),painted)
	for row in 3:
		for col in 7:
			var q:=Vector3(-1.05+col*.34,1.64+row*.32,-.25)
			tube(q,q+Vector3(0,.11,.25),.016,metal)
			if (row+col)%3==0:
				var item:=imported_prop("bottle_glassware_erlenmeyer_flask_large",q+Vector3(0,.16,.20),.42,glass);item.rotation.x=PI
	for i in 7:box(Vector3(.66,1.14,-.30+i*.10),Vector3(.74,.02,.024),metal)
	vessel("bottle",Vector3(1,1.13,.1),.8,clear_liquid,"WASH")
	plaque("GLASSWARE WASH / DRY",Vector3(0,2.72,-.24),Vector2(2.4,.23),0,true)
	place(first,p,angle)
func instrument(p: Vector3,kind: String="BALANCE") -> void:
	imported_prop("machine_electronic_scale" if kind=="BALANCE" else "machine_hot_plate",p,1.15)
	box(p+Vector3(.23,.16,.22),Vector3(.24,.11,.025),rubber)
	plaque(kind,p+Vector3(0,.065,.35),Vector2(.42,.12),0,true)
	if kind=="COULOMETER":
		var cell := preload("res://scripts/kf_cell.gd").new()
		cell.position = p + Vector3(.12,0,.62)
		cell.rotation.y = -PI/2
		add_child(cell)
func cart(p: Vector3) -> void:
	for y in [.19,.83]:box(p+Vector3(0,y,0),Vector3(.90,.06,.58),metal)
	for x in [-.40,.40]:
		for z in [-.24,.24]:
			tube(p+Vector3(x,.12,z),p+Vector3(x,1.0,z),.025,metal)
			cylinder(p+Vector3(x,.10,z),.085,.045,rubber).rotation.x=PI/2
	box(p+Vector3(0,.45,0),Vector3(.8,.7,.5),material(Color(.15,.17,.17,.06)),true)
	bottle_row(p+Vector3(0,.87,0),3,.23)
func task_light(p: Vector3,tint: Color=Color(.75,.83,.84),power: float=2.5) -> void:
	box(p,Vector3(1.5,.12,.32),worn)
	box(p-Vector3.UP*.07,Vector3(1.35,.02,.25),material(tint,0,.4,2))
	var light:=SpotLight3D.new();light.position=p-Vector3.UP*.25;light.rotation.x=-PI/2;light.light_color=tint;light.light_energy=power;light.spot_range=8;light.spot_angle=75;light.spot_attenuation=.7;add_child(light)
func upper() -> void:
	setup();name="UpperLabFurnishing"
	cabinet(Vector3(-4.3,0,11.4),2.55,false,PI)
	bench(Vector3(-2.25,0,-11.3),1.8)
	bottle_row(Vector3(-2.25,1.14,-11.3),5,.26)
	for y in [1.85,2.5]:
		box(Vector3(-2.25,y,-11.5),Vector3(1.85,.08,.60),worn)
		bottle_row(Vector3(-2.25,y+.06,-11.45),5,.25)
	cabinet(Vector3(-1.7,0,11.4),2.1,true,PI)
	cabinet(Vector3(.65,0,11.4),2.1,true,PI)
	washing(Vector3(5.12,0,-9.45),-PI/2)
	bench(Vector3(-1.7,0,-7.6),1.8)
	instrument(Vector3(-2.08,1.14,-7.6))
	vessel("volumetric",Vector3(-1.27,1.14,-7.6),.8,clear_liquid)
	box(Vector3(-1.20,1.14,-7.20),Vector3(.35,.025,.22),paper)
	cart(Vector3(1.75,0,7.0));cart(Vector3(-1.9,0,-4.1))
	for p in [Vector3(-4.1,1.21,2.0),Vector3(4.6,1.2,7.45)]:
		box(p,Vector3(.55,.025,.34),paper)
		for i in 5:box(p+Vector3(0,.018,-.12+i*.045),Vector3(.36,.008,.008),dark)
	for p in [Vector3(-4.3,3,10.7),Vector3(0,3,10.7),Vector3(4.4,2.9,-9.4)]:task_light(p)
	call_deferred("batch_static")

