extends "res://scripts/lab_furnishing.gd"
# Additive environmental layer. Room shells, doors and established routes live in lower_lab.gd.
const F: float=-4.55
var vial_count:=0
var clean_mode:=false
func build() -> void:
	setup();name="LowerLabWorkingDetails"
	workstation(Vector3(-3.1,F,1.12),2.8,0,"WEIGHING / SAMPLE REGISTER")
	workstation(Vector3(.35,F,-6.6),2.7,PI/2,"PREPARATION / NIGHT SHIFT")
	workstation(Vector3(1.35,F,10),2.4,-PI/2,"GAMMA / ACQUISITION")
	var weighing:=assembly_start()
	rack(Vector3(0,0,0),5,3);wash_bottle(Vector3(.45,0,-.1));notebook(Vector3(-.5,0,.08))
	place(weighing,Vector3(-5.2,F+1.14,3.4),PI/2)
	for z in [-4.6,-2.1]:
		var first:=assembly_start();rack(Vector3(0,0,0),5,3);pipettes(Vector3(.63,0,0));notebook(Vector3(-.58,0,.05));place(first,Vector3(-5.2,F+1.14,z),PI/2)
	for z in [-8.8,-5.8]:
		var first:=assembly_start();rack(Vector3(0,0,0),5,3);wash_bottle(Vector3(.6,0,0));place(first,Vector3(5.45,F+1.14,z),-PI/2)
	for z in [-1.8,-.3]:
		rack(Vector3(.16,F+1.14,z),4,3)
	shelf_bank(Vector3(-5.75,F,-3.2),3.9,PI/2)
	shelf_bank(Vector3(-3.2,F,.68),2.7,0)
	storage_boxes(Vector3(-4.8,F+.05,11.25),3)
	storage_boxes(Vector3(-5.1,F+.05,-10.4),2)
	waste_bin(Vector3(-2.15,F,10.9));waste_bin(Vector3(-4.8,F,-.9))
	wall_panel(Vector3(1.88,F+1.7,9),-PI/2,"DETECTOR / ONLINE")
	wall_panel(Vector3(-5.78,F+1.9,-6),PI/2,"EXTRACTION / RUN")
	notice_board(Vector3(-.88,F+2.1,1.45),PI/2)
	upper_cupboard(Vector3(-5.64,F+2.55,-9),PI/2)
	upper_cupboard(Vector3(5.78,F+2.55,11.2),-PI/2)
	computer_station(Vector3(-5.2,F+1.14,7.3),PI/2)
	services()
	# Clean suite dressing uses its own material instances; no changes outside this node.
	clean_mode=true;painted=material(Color(.79,.84,.85),.15,.42);worn=material(Color(.65,.73,.76),.25,.4);plastic=material(Color(.87,.9,.91),0,.4);paper=material(Color(.9,.92,.90),0,.8)
	for z in [-6,0,6]:workstation(Vector3(7.85,F,z),2.9,PI/2,"CLEAN PREPARATION / B"+str(int(z+7)))
	for z in [-6,0,6]:
		computer_station(Vector3(7.85,F+1.14,z+1.1),PI/2)
		task_light(Vector3(7.85,-.75,z),Color(.88,.95,1),2.8)
	for z in [-9,-3,3,9]:
		var first:=assembly_start();rack(Vector3(.8,0,0),6,4);pipettes(Vector3(1.34,0,0));place(first,Vector3(11.8,F+1.14,z),PI/2)
		shelf_bank(Vector3(13.62,F,z),3.2,-PI/2)
		box(Vector3(13.2,F+.55,z+1.5),Vector3(.7,1.1,.65),plastic,true)
		cable([Vector3(13.2,F+.8,z+1.5),Vector3(13.4,F+.25,z+1),Vector3(12.6,F+.2,z)],rubber,.019)
	call_deferred("batch_static")
func upper_cupboard(p: Vector3,angle: float) -> void:
	var first:=assembly_start()
	box(Vector3.ZERO,Vector3(1.4,.85,.40),painted)
	for side in [-1,1]:
		box(Vector3(side*.35,0,.22),Vector3(.67,.81,.04),worn)
		box(Vector3(side*.10,-.14,.26),Vector3(.024,.20,.035),metal)
	plaque("CONSUMABLES",Vector3(0,.22,.25),Vector2(1.12,.13),0,true)
	place(first,p,angle)
func notice_board(p: Vector3,angle: float) -> void:
	var first:=assembly_start();box(Vector3.ZERO,Vector3(.9,.85,.06),dark)
	for i in 3:
		var q:=Vector3(-.27+i*.27,.06 if i%2 else -.04,.04)
		box(q,Vector3(.22,.43,.007),paper)
		for j in 7:box(q+Vector3(0,.15-j*.042,.005),Vector3(.16,.006,.002),dark)
	plaque("SHIFT LOG / SAMPLES PENDING",Vector3(0,.35,.04),Vector2(.81,.08),0,true)
	place(first,p,angle)
func computer_station(p: Vector3,angle: float) -> void:
	var first:=assembly_start()
	box(Vector3(0,.018,0),Vector3(.26,.036,.20),dark)
	box(Vector3(0,.18,-.03),Vector3(.035,.32,.045),metal)
	box(Vector3(0,.38,-.03),Vector3(.43,.28,.045),plastic)
	box(Vector3(0,.38,-.003),Vector3(.38,.23,.012),material(Color(.035,.10,.12),0,.5,.3))
	for i in 5:box(Vector3(-.025,.30+i*.033,.005),Vector3(.24-i*.027,.008,.003),material(Color(.26,.57,.47),0,.5,.6))
	box(Vector3(0,.025,.20),Vector3(.38,.035,.13),dark)
	for i in 9:
		for j in 3:box(Vector3(-.16+i*.04,.045,.16+j*.035),Vector3(.025,.008,.023),plastic)
	cable([Vector3(0,.06,0),Vector3(.22,.025,-.2),Vector3(.24,-.6,-.3)],rubber,.01)
	place(first,p,angle)
func rack(p: Vector3,cols: int=6,rows: int=3) -> void:
	var tint:=material(Color(.25,.44,.49) if clean_mode else Color(.34,.36,.25),.2,.55)
	box(p+Vector3(0,.045,0),Vector3(cols*.085+.055,.09,rows*.085+.06),tint)
	for row in rows:
		for col in cols:
			var q:=p+Vector3((col-(cols-1)*.5)*.085,.10,(row-(rows-1)*.5)*.085)
			cylinder(q+Vector3(0,.068,0),.026,.135,material(Color(.63,.72,.73),.15,.23))
			cylinder(q+Vector3(0,.047,0),.0265,.048,paper)
			cylinder(q+Vector3(0,.145,0),.030,.033,material(Color(.12,.36,.46) if (row+col)%3 else Color(.57,.24,.10),0,.46))
			vial_count+=1
	box(p+Vector3(0,.056,rows*.043+.032),Vector3(cols*.067,.045,.004),paper)
func pipettes(p: Vector3) -> void:
	box(p+Vector3(0,.025,0),Vector3(.30,.05,.22),plastic)
	tube(p+Vector3(0,.03,-.06),p+Vector3(0,.47,-.06),.014,metal)
	box(p+Vector3(0,.40,0),Vector3(.30,.04,.14),plastic)
	for i in 3:
		var q:=p+Vector3((i-1)*.095,0,.04)
		cylinder(q+Vector3(0,.35,0),.025,.23,plastic)
		cylinder(q+Vector3(0,.49,0),.022,.05,material(Color(.2,.45,.5)))
		tube(q+Vector3(0,.12,0),q+Vector3(0,.25,0),.009,metal)
	box(p+Vector3(.24,.065,0),Vector3(.18,.13,.23),material(Color(.43,.55,.52)))
	for i in 4:
		for j in 3:cylinder(p+Vector3(.18+i*.04,.14,-.06+j*.055),.010,.04,plastic)
func notebook(p: Vector3) -> void:
	box(p+Vector3(0,.015,0),Vector3(.30,.03,.24),dark)
	box(p+Vector3(0,.033,0),Vector3(.275,.008,.22),paper)
	for i in 5:box(p+Vector3(0,.039,-.08+i*.034),Vector3(.21,.002,.004),dark)
	tube(p+Vector3(.17,.025,-.1),p+Vector3(.17,.025,.1),.008,metal)
func wash_bottle(p: Vector3) -> void:
	cylinder(p+Vector3(0,.11,0),.065,.22,plastic)
	cylinder(p+Vector3(0,.23,0),.035,.035,material(Color(.15,.42,.5)))
	cable([p+Vector3(0,.25,0),p+Vector3(0,.35,0),p+Vector3(.12,.36,0),p+Vector3(.15,.32,0)],plastic,.012)
	box(p+Vector3(0,.11,.064),Vector3(.07,.07,.008),paper)
func workstation(p: Vector3,width: float,angle: float,title: String) -> void:
	var first:=assembly_start();bench(Vector3.ZERO,width)
	rack(Vector3(-.7,1.14,.12),6,4);rack(Vector3(-.1,1.14,.12),5,3)
	pipettes(Vector3(.55,1.14,-.10));wash_bottle(Vector3(.98,1.14,-.08));notebook(Vector3(.68,1.14,.26))
	imported_prop("machine_hot_plate",Vector3(-.78,1.14,-.22),.55)
	vessel("beaker",Vector3(-.83,1.24,-.22),.43,clear_liquid)
	box(Vector3(0,1.18,-.34),Vector3(.12,.08,.05),dark)
	for side in [-1,1]:box(Vector3(side*width*.44,1.34,-.38),Vector3(.035,.44,.035),metal)
	box(Vector3(0,1.5,-.39),Vector3(width*.90,.09,.05),worn)
	for x in [-.85,0,.85]:
		box(Vector3(x,1.5,-.37),Vector3(.24,.12,.05),plastic)
		for dx in [-.05,.05]:box(Vector3(x+dx,1.5,-.338),Vector3(.014,.035,.004),rubber)
	cable([Vector3(-.78,1.17,-.25),Vector3(-.95,1.2,-.4),Vector3(-.85,1.5,-.4)],rubber,.008)
	plaque(title,Vector3(0,.88,.43),Vector2(width*.85,.14),0,true)
	place(first,p,angle)
func shelf_bank(p: Vector3,width: float,angle: float) -> void:
	var first:=assembly_start()
	for y in [1.85,2.5]:
		box(Vector3(0,y,0),Vector3(width,.055,.38),worn)
		for x in [-width*.4,width*.4]:box(Vector3(x,y-.12,-.12),Vector3(.035,.25,.24),metal)
		bottle_row(Vector3(-width*.24,y+.04,0),4,.19)
		for i in 3:
			var q:=Vector3(width*.13+i*.27,y+.13,0)
			box(q,Vector3(.24,.22,.29),plastic if clean_mode else paper)
			box(q+Vector3(0,0,.15),Vector3(.16,.09,.005),paper if clean_mode else plastic)
	place(first,p,angle)
func storage_boxes(p: Vector3,count: int) -> void:
	for i in count:
		box(p+Vector3(0,.18+i*.35,0),Vector3(.65,.33,.54),paper)
		box(p+Vector3(0,.18+i*.35,.273),Vector3(.35,.13,.007),plastic)
func waste_bin(p: Vector3) -> void:
	cylinder(p+Vector3(0,.37,0),.22,.74,dark);cylinder(p+Vector3(0,.76,0),.24,.06,worn)
	plaque("LAB WASTE",p+Vector3(0,.46,.225),Vector2(.29,.10),0,true)
func wall_panel(p: Vector3,angle: float,title: String) -> void:
	var first:=assembly_start();box(Vector3.ZERO,Vector3(.65,.85,.16),worn)
	box(Vector3(0,.13,.09),Vector3(.46,.22,.02),dark)
	for i in 3:box(Vector3(-.15+i*.15,.13,.11),Vector3(.05,.035,.008),material(Color(.14,.54,.29),0,.4,1.3))
	plaque(title,Vector3(0,-.25,.1),Vector2(.56,.11),0,true);place(first,p,angle)
func services() -> void:
	# Perimeter distribution stays outside stair headroom and door openings.
	for x in [-5.55,5.85]:
		box(Vector3(x,-.95,0),Vector3(.38,.26,23.2),worn)
		for z in range(-11,12):
			box(Vector3(x,-.78,z),Vector3(.55,.035,.055),metal)
		for dx in [-.12,0,.12]:tube(Vector3(x+dx,-.77,-11.5),Vector3(x+dx,-.77,11.5),.025,rubber)
	for z in [-10.4,7.2,10.6]:
		tube(Vector3(-5.7,-.8,z),Vector3(5.7,-.8,z),.105,worn)
		for x in [-4,-2,0,2,4]:cylinder(Vector3(x,-.8,z),.13,.06,metal).rotation.z=PI/2
	for z in [-8,-4,2,8]:
		for y in [-2.1,-2.25]:tube(Vector3(-5.83,y,z-1.3),Vector3(-5.83,y,z+1.3),.018,metal)
		tube(Vector3(-5.83,-.9,z),Vector3(-5.83,-2.25,z),.023,metal)
		box(Vector3(-5.77,-2.25,z),Vector3(.12,.24,.20),worn)
	# Practical work pools without washing out the general room.
	for p in [Vector3(-3,-1.15,1.4),Vector3(.3,-1.1,-6.6),Vector3(-4,-1,9)]:task_light(p,Color(.73,.77,.65),1.25)
