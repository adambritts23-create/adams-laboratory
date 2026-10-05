extends "res://scripts/lab_props.gd"
const SAVE="user://town-economy-fresh-oct01.json"
const PLATINUM_PRICE=6000
const PLATINUM_CAPACITY=30
var lab
var cash=0.0
var platinum=[]
var collected=[]
var green_owned=false
var precipitate_piles=0
var uranium_piles=[]
var green_sold=false
var purchases=[]
var selected=0
var held:Node3D
var items={}
var extensions
var gate_people
var dealer
var owned_vehicles={}
var owned_cars=[]
var groceries={}
var portfolio={}
var market_day=0
var market_time=0.0
var trading_ui
const STOCKS={"AMZN":180.0,"MSFT":410.0,"VOLV":28.0}
func build(world):
 lab=world;name="DisabledBrowserEconomy";init_materials()
 # Scientific samples remain in sample_accounting; collectible trading is omitted.
 lab.accounting.wallet.hide()
 set_process(false)
func target(parent,id,title,pos,size):
 var a=Area3D.new();parent.add_child(a);a.position=pos;a.collision_layer=4;a.collision_mask=0;a.set_meta("interaction",id);a.set_meta("title",title)
 var c=CollisionShape3D.new();c.shape=BoxShape3D.new();c.shape.size=size;a.add_child(c);return a
func crucible(parent):
 var first=get_child_count();var pt=material(Color(.72,.75,.78),.92,.22)
 cylinder(Vector3(0,.02,0),.10,.035,pt)
 for i in 24:
  var a=i*TAU/24;var b=(i+1)*TAU/24
  tube(Vector3(cos(a)*.1,.10,sin(a)*.1),Vector3(cos(b)*.1,.10,sin(b)*.1),.035,pt)
 cylinder(Vector3(0,.064,0),.076,.01,dark)
 for node in get_children().slice(first):node.reparent(parent,false)
func chunk(parent):
 var mesh=SphereMesh.new();mesh.radial_segments=7;mesh.rings=4;mesh.radius=.18;mesh.height=.32
 var part=MeshInstance3D.new();parent.add_child(part);part.mesh=mesh;part.material_override=material(Color(.08,.95,.19),.25,.3,2.8);part.rotation=Vector3(.2,.4,.1)
 var light=OmniLight3D.new();parent.add_child(light);light.light_color=Color(.12,1,.2);light.light_energy=.35;light.omni_range=1.2
func refresh(reveal:bool=true):
 lab.accounting.wallet.text="USD $%s  ·  Platinum %d/30 (180 g each)\n4 Green chunk · 5 Cycle crucibles · 1 Hands" % [str(snappedf(cash,.01)),platinum.size()]
 lab.accounting.wallet.text+="\nPortfolio: $%.2f" % portfolio_value()
 lab.accounting.wallet.text+="\nGreen piles: %d" % (precipitate_piles+uranium_piles.size()+(1 if green_owned else 0))
 if not uranium_piles.is_empty():lab.accounting.wallet.text+="\nNext precipitate: %.6f g · $%.2f" % [float(uranium_piles[0]),float(uranium_piles[0])*100]
 lab.accounting.wallet.set_meta("expanded_text",lab.accounting.wallet.text)
 if reveal:lab.accounting.show_wallet()
 if held!=null:held.queue_free();held=null
 if selected==4 and (green_owned or precipitate_piles>0 or not uranium_piles.is_empty()) or selected>=5 and selected-5<platinum.size():
  lab.expansion.set_equipped(false);held=Node3D.new();lab.player.camera.add_child(held);held.position=Vector3(.3,-.28,-.58)
  if selected==4:chunk(held)
  else:crucible(held)
func save():
 var f=FileAccess.open(SAVE,FileAccess.WRITE)
 if f:f.store_string(JSON.stringify({"cash":cash,"precipitate_piles":precipitate_piles,"uranium_piles":uranium_piles,"platinum":platinum,"collected":collected,"green_owned":green_owned,"green_sold":green_sold,"purchases":purchases,"owned_cars":owned_cars,"groceries":groceries,"portfolio":portfolio,"market_day":market_day}))
func handle(_event):
 return false
func interact(_id):
 return false

func _process(dt):
 if held!=null:held.visible=lab.player.enabled
 if lab==null or lab.paused:return
 market_time+=dt
 if market_time>=45:
  market_time=0;market_day+=1;refresh(false);save()
  if trading_ui!=null:trading_ui.refresh()

func uranium_residue(inv:Dictionary)->bool:
 if not inv.get("available",false):return false
 for solid in inv.get("solids",[]):
  if solid is Dictionary and float(solid.get("moles",0))>0 and solid.get("composition") is Dictionary and float(solid.composition.get("U",0))>0:return true
 return false
func collect_precipitate()->bool:
 return false

func build_extra_chunks():
 # Modest rear storage shelf, away from the main workstation sightline.
 for y in [1.18,1.78]:box(Vector3(-1.5,y,10.65),Vector3(2.8,.08,.46),metal,true)
 for x in [-2.7,-.3]:box(Vector3(x,.95,10.82),Vector3(.06,1.9,.06),dark,true)
 var home=lab.staff_exit.apartment
 var shelf=box(Vector3.ZERO,Vector3(1.3,.07,.32),material(Color(.4,.25,.13)),true);shelf.reparent(home,false);shelf.position=Vector3(1.1,1.55,-1.42)
 for i in 12:
  var id="bonus_green_"+str(i);var parent=self if i<8 else home
  var root=Node3D.new();parent.add_child(root);root.name=id
  root.position=Vector3(-2.5+(i%4)*.65,1.39+(i/4)*.6,10.63) if i<8 else Vector3(.62+(i-8)*.32,1.76,-1.4)
  chunk(root);target(root,id,"Take green glowing material",Vector3.ZERO,Vector3(.29,.34,.29));items[id]=root
  if i>=8:
   for mesh in root.find_children("*","GeometryInstance3D",true,false):mesh.layers=4
  if collected.has(id):
   root.hide()
   for area in root.find_children("*","Area3D",true,false):area.collision_layer=0

func uranium_contents(inv:Dictionary)->bool:
 if not inv.get("available",false):return false
 for phase in ["solids","aqueous"]:
  for row in inv.get(phase,[]):
   if row is Dictionary and float(row.get("moles",0))>0 and row.get("composition") is Dictionary and float(row.composition.get("U",0))>0:return true
 return false
func uranium_precipitate_mass(inv:Dictionary)->float:
 if not inv.get("available",false):return 0.0
 var grams=0.0
 for solid in inv.get("solids",[]):
  if not solid is Dictionary or not solid.get("composition") is Dictionary:continue
  if float(solid.composition.get("U",0))<=0 or float(solid.get("moles",0))<=0:continue
  var mass=solid.get("massG")
  if mass==null or not is_finite(float(mass)) or float(mass)<0:return 0.0
  grams+=float(mass)
 return grams
func sell_carried_uranium()->bool:
 var vessel=lab.accounting.held_node()
 if vessel==null or vessel.get_meta("emptied",false):return false
 var grams=uranium_precipitate_mass(vessel.get_meta("inventory",{}))
 if grams<=0:return false
 lab.accounting.empty_vessel(vessel)
 cash+=grams*100;refresh();save();lab.say("Precipitate sold · %.6f g × $100/g = $%.2f. Empty beaker kept." % [grams,grams*100]);return true
func quote(symbol:String)->float:
 if not STOCKS.has(symbol):return 0
 var phase=float(STOCKS.keys().find(symbol))*1.7
 return snappedf(float(STOCKS[symbol])*(1+.08*sin(market_day*.61+phase)+.025*sin(market_day*1.73+phase)),.01)
func portfolio_value()->float:
 var value=0.0
 for symbol in portfolio:value+=maxi(0,int(portfolio[symbol]))*quote(symbol)
 return value
func trade(symbol:String,quantity:int)->bool:
 if not STOCKS.has(symbol) or quantity==0:return false
 var shares=int(portfolio.get(symbol,0));var cost=quote(symbol)*quantity
 if quantity>0 and cash<cost:lab.say("Insufficient cash for that order.");return false
 if shares+quantity<0:lab.say("You do not own enough shares.");return false
 cash=snappedf(cash-cost,.01);portfolio[symbol]=shares+quantity;refresh();save();return true

func restore_owned_vehicles():
 # Preserve purchased vehicles independently of the removed showroom.
 for id in owned_cars:
  if id not in ["rx","is","sedan","suv"]:continue
  var builder=preload("res://scripts/lexus_dealership.gd").new();builder.init_materials()
  var model=Node3D.new();model.set_meta("car_title",{"rx":"RX 450h","is":"IS 500","sedan":"SPORT SEDAN","suv":"LUXURY SUV"}[id])
  if id in ["rx","is"]:
   builder.car(Vector3.ZERO,id=="rx",Color(.018,.022,.027) if id=="rx" else Color(.035,.18,.67))
   for child in builder.get_children():child.reparent(model,false)
  else:model.add_child(load("res://art/vehicles/kenney/"+("sedan-sports" if id=="sedan" else "suv-luxury")+".res").instantiate())
  for mesh in model.find_children("*","GeometryInstance3D",true,false):mesh.layers=2
  var car=preload("res://scripts/dealership_vehicle.gd").new();lab.staff_exit.grounds.add_child(car);car.build(lab,lab.staff_exit,id,model)
  var bay=[2,4,8,12][["rx","is","sedan","suv"].find(id)]
  car.global_transform=preload("res://scripts/shopping_orientation.gd").transform()*Transform3D(Basis.IDENTITY,Vector3(23+bay*3.5,-47.98,-863.7))
  owned_vehicles[id]=car;lab.staff_exit.vehicles.append(car)
  model.free();builder.free()
