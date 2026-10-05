extends SceneTree
var failures=0
class TestPlayer extends CharacterBody3D:
 var camera=Camera3D.new()
 var shape_node=CollisionShape3D.new()
 var enabled=true
 func reset_motion():velocity=Vector3.ZERO
class TestExpansion extends Node3D:
 var filtering=false
 var filter_time=0.0
 var carrying=false
 var carried
 var snapshot={}
 var sample_away=false
 var output_solid=Node3D.new()
 var output_liquid=Node3D.new()
 var outputs={}
 func set_equipped(_v):pass
 func rifle():
  var r=Node3D.new();add_child(r);return r
class TestGlassware extends Node3D:
 var held
 var calculation_fluid
 var calculation_glass
 func holding():return held!=null
 func register_glass(_n):pass
class TestPolish extends Node3D:
 var carried_output
 var carried_kind=""
 var carried_record={}
class TestRoute extends Node3D:
 var lab
 var vehicle
 var vehicles=[]
 var grounds=Node3D.new()
 var outdoor_environment=Environment.new()
class TestWorld extends Node3D:
 var room={}
 var sound={"muted":false}
 var player=TestPlayer.new()
 var accounting
 var economy
 var staff_exit=TestRoute.new()
 var expansion=TestExpansion.new()
 var glassware=TestGlassware.new()
 var polish=TestPolish.new()
 var workbench
 var paused=false
 var current_target
 var game_ui=CanvasLayer.new()
 var messages=[]
 func say(t,_duration=4):messages.append(t)
func check(value,text):
 print("PASS " if value else "FAIL ",text)
 if not value:failures+=1
func _initialize():call_deferred("run")
func run():
 var world=TestWorld.new();root.add_child(world)
 world.add_child(world.player);world.player.add_child(world.player.camera);world.player.add_child(world.player.shape_node);world.player.shape_node.shape=CapsuleShape3D.new()
 world.add_child(world.staff_exit);world.staff_exit.lab=world;world.staff_exit.add_child(world.staff_exit.grounds)
 for node in [world.expansion,world.glassware,world.polish,world.game_ui]:world.add_child(node)
 world.expansion.add_child(world.expansion.output_solid);world.expansion.add_child(world.expansion.output_liquid);world.expansion.output_solid.hide();world.expansion.output_liquid.hide()
 var e=load("res://scripts/world_economy.gd").new();world.add_child(e);e.set_process(false);e.lab=world;e.init_materials();world.economy=e
 check(e.cash==0 and e.purchases.is_empty() and e.portfolio.is_empty() and e.owned_cars.is_empty(),"Fresh story begins without cash, purchases or investments")
 var saved=FileAccess.get_file_as_string(e.SAVE) if FileAccess.file_exists(e.SAVE) else ""
 world.accounting=load("res://scripts/sample_accounting.gd").new();world.add_child(world.accounting);world.accounting.lab=world;world.accounting.set_process(false);world.accounting.wallet=Label.new();world.game_ui.add_child(world.accounting.wallet)
 world.workbench=load("res://scripts/science_workbench.gd").new();world.add_child(world.workbench);world.workbench.set_process(false);world.workbench.lab=world
 for i in 30:e.platinum.append("test_"+str(i))
 e.selected=0
 var key=InputEventKey.new();key.physical_keycode=KEY_5;key.pressed=true
 var selected_slots={}
 for i in 30:e.handle(key);selected_slots[e.selected]=true
 check(selected_slots.size()==30 and selected_slots.has(34),"All thirty crucibles can be selected using 5")
 e.interact("platinum_overflow")
 check(e.platinum.size()==30 and not e.collected.has("platinum_overflow"),"Crucible capacity enforced without losing carried items")
 e.platinum=[];e.selected=0;e.refresh()
 e.cash=10000;var initial=e.cash
 check(e.trade("AMZN",10),"Buy shares")
 check(is_equal_approx(e.cash+e.portfolio_value(),initial),"Cash and portfolio are separate; value conserved on purchase")
 check(not e.trade("AMZN",-11),"Cannot sell unowned shares")
 check(e.trade("AMZN",-10) and is_equal_approx(e.cash,initial),"Sell shares restores cash at same quote")
 e.cash=0;check(not e.trade("AMZN",1),"Insufficient cash blocks order")
 var inv={"available":true,"solids":[],"aqueous":[{"name":"test U inventory","moles":.001,"composition":{"U":1},"massG":.238}],"drySolidMassG":0.0}
 check(e.uranium_contents(inv),"Dissolved uranium qualifies for game buyer")
 check(not e.uranium_contents({"available":true,"solids":[{"moles":0,"composition":{"U":1}}]}),"Zero uranium is not sellable")
 check(not e.uranium_contents({"available":true,"aqueous":[{"moles":1,"composition":null}]}),"Unknown composition cannot crash or qualify")
 check(e.uranium_precipitate_mass(inv)==0,"Dissolved uranium alone has no saleable precipitate")
 inv["solids"]=[{"name":"U test solid","moles":.01,"composition":{"U":1},"massG":2.5},{"name":"Other solid","moles":1,"composition":{"Ca":1},"massG":40}]
 check(e.uranium_precipitate_mass(inv)==2.5,"Only uranium-bearing solid grams count, not other solids")
 var beaker=Node3D.new();world.player.camera.add_child(beaker);beaker.set_meta("inventory",inv);beaker.set_meta("titration_record",{"test":true});world.expansion.carrying=true;world.expansion.carried=beaker
 check(e.sell_carried_uranium() and e.cash==250,"Carried precipitate earns exactly $100 per gram")
 check(not e.sell_carried_uranium() and e.cash==250 and not beaker.has_meta("titration_record"),"Sale consumes sample and prevents replay")
 world.expansion.carrying=false;world.expansion.carried=null;world.glassware.held=null
 e.uranium_piles=[3.25];e.selected=4;e.interact("home_buyer")
 check(is_equal_approx(e.cash,575) and e.uranium_piles.is_empty(),"Collected precipitate retains grams and sells for $100/g")
 e.selected=0
 world.glassware.held=null;beaker.queue_free()
 var fixture=JSON.parse_string(FileAccess.get_file_as_string("res://validation/uranium-wet-fixture.json"))
 world.workbench.setup=fixture.setup;world.workbench.catalog={"elements":[]};world.workbench.points=fixture.points
 var chosen=0
 for i in fixture.points.size():
  if fixture.points[i].get("inventory",{}).get("available",false) and float(fixture.points[i].inventory.get("drySolidMassG",0))>0:chosen=i;break
 world.workbench.chosen=chosen
 var home=load("res://scripts/apartment_lab.gd").new();world.add_child(home);home.build(world);home.set_process(false);home.update_titration()
 check(home.liquid.visible and home.liquid.sediment_amount>0,"Home titration sediment uses accepted result")
 check(is_equal_approx(home.titration_vessel.get_meta("inventory").drySolidMassG,float(fixture.points[chosen].inventory.drySolidMassG)),"Home beaker keeps exact calculated precipitate mass")
 check(home.titration_mass.text.contains("g"),"Home station displays precipitate grams")
 world.expansion.sample_away=true;home.update_titration()
 check(not home.liquid.visible,"Carried sample no longer duplicated at home station")
 world.expansion.sample_away=false;home.update_titration()
 check(home.liquid.visible,"Returned sample reappears without recalculating chemistry")
 world.workbench.points=[];world.workbench.serial+=1;home.update_titration()
 check(not home.liquid.visible and home.titration_mass.text.contains("no accepted"),"Invalidated experiment clears home readout")
 var dealer=load("res://scripts/lexus_dealership.gd").new();world.staff_exit.grounds.add_child(dealer);e.dealer=dealer;dealer.build(world)
 check(dealer.displays.size()==4,"Four purchasable showroom cars")
 for id in ["sedan","suv"]:
  check(dealer.displays[id].find_children("*","MeshInstance3D",true,false).size()>0,"Imported "+id+" contains meshes")
 e.cash=100000;e.interact("dealer_sedan")
 check(e.cash==0 and e.owned_cars.has("sedan") and dealer.owned.has("sedan"),"Car purchase charges once and delivers driveable car")
 e.interact("dealer_sedan");check(dealer.owned.size()==1 and e.cash==0,"Repeat car purchase cannot duplicate delivery")
 e.interact("dealer_suv");check(not e.owned_cars.has("suv"),"Unaffordable car purchase rejected")
 var land=load("res://scripts/valley_landscape.gd").new();world.add_child(land);land.route=world.staff_exit;land.init_materials()
 var shops=load("res://scripts/village_shops.gd").new();land.add_child(shops);shops.init_materials();shops.build_maxi(land)
 var goods=shops.get_node("StockedShelves")
 check(goods.multimesh.instance_count==3072,"Every supermarket shelf stocked with shared product instances")
 var plaza=load("res://scripts/shopping_plaza.gd").new();land.add_child(plaza);plaza.build(land)
 var display=plaza.get_node("CentrumRoofDisplay")
 display.set_process(false)
 var pages=[]
 for i in 4:
  display.timer=i*2.5;display._process(.01);pages.append(display.slogans[0].text)
 check(pages==["SUPER DEALS","STAY IN SHAPE","LEAN IS LAW","GET THOSE VEINS POPPING"],"Roof display cycles all requested slogans")
 display.timer=1.4;display._process(.01)
 check(not display.headings[0].visible,"ICA heading blinks")
 check(plaza.has_node("PawnShopkeeper"),"Expanded pawn shop has a resident shopkeeper")
 check(plaza.parked.size()==3,"Three parked cars leave an open forecourt")
 check(plaza.customers.actors.size()==3 and plaza.customers.actors.all(func(a):return a.has("path")),"Three shoppers follow car-to-supermarket routes")
 check(plaza.get_node("NordicWellnessSign").position.y>-39,"Gym sign is above ICA fascia")
 check(plaza.has_node("GymAccessRamp"),"Second-floor gym has traversable ramp")
 check(dealer.position.distance_to(Vector3(49,-48,-892))<50,"Lexus showroom adjacent to supermarket")
 var sun=DirectionalLight3D.new();world.staff_exit.add_child(sun);sun.light_cull_mask=2;sun.rotation_degrees.x=-20
 var lamps=load("res://scripts/road_lights.gd").new();land.add_child(lamps);lamps.build(land)
 lamps._process(1);check(not lamps.night and lamps.fixtures.all(func(f):return not f.light.visible),"Street lights remain off during daylight")
 world.player.global_position=lamps.fixtures[0].light.global_position;sun.rotation_degrees.x=10
 lamps._process(1);check(lamps.night and lamps.fixtures[0].light.visible,"Street lights activate after dark near player")
 sun.rotation_degrees.x=-20;lamps._process(1);check(not lamps.night,"Street lights switch off when daylight returns")
 var beach=load("res://scripts/beach_life.gd").new();land.add_child(beach);beach.build(land)
 check(beach.actors.size()==20,"Beach includes ice cream vendor and five customers")
 var before=beach.actors[0].node.position;world.player.position=before;beach._process(1)
 check(beach.actors[0].node.position!=before,"Resident walking motion advances")
 var gardens=load("res://scripts/village_gardens.gd").new();land.add_child(gardens);gardens.name="VillageGardens";gardens.land=land;gardens.init_materials();gardens.rng.seed=66290
 gardens.flower_mesh=SphereMesh.new();gardens.flower_mesh.radius=1;gardens.flower_mesh.height=2;gardens.flower_mesh.radial_segments=10;gardens.flower_mesh.rings=5;gardens.shrub_mesh=gardens.leaf_cluster();gardens.falu=gardens.material(Color(.5,.04,.02));gardens.timber=gardens.material(Color(.4,.27,.15))
 gardens.fence_rail(Vector3(0,.2,0),Vector3(2,1.3,0),.05,gardens.timber)
 var rail=gardens.rail_batches[Vector2i.ZERO][0]
 check((rail*Vector3(0,-.5,0)).distance_to(Vector3(0,.2,0))<.001 and (rail*Vector3(0,.5,0)).distance_to(Vector3(2,1.3,0))<.001,"Fence rails follow diagonal endpoints without vertical stretching")
 gardens.home_planting()
 var clear_pavement=true
 for batch in gardens.batches.values():
  for transform in batch.transforms:
   var p=transform.origin
   if p.x> -53 and p.x< -38:clear_pavement=false
 check(clear_pavement,"Home flowers and bushes clear pavement and access road")
 var meadow=load("res://scripts/country_meadow.gd").new();land.add_child(meadow);meadow.build(land)
 check(meadow.name=="DalarnaMeadow" and meadow.find_children("*","MeshInstance3D",true,false).filter(func(m):return m.get_meta("lake_surface",false)).size()==2,"Replacement meadow contains two small ponds")
 gardens.garden(Vector3(-49,-48,-710),11,13)
 check(gardens.lawn_bounds[-1].size.x>=19 and gardens.lawn_bounds[-1].size.y>=23,"Unobstructed lawn enlarged on all sides")
 var trial=load("res://scripts/woodland_trial.gd").new();land.add_child(trial);trial.build(land)
 check(trial.tree_count>=14 and trial.grass_count>2000,"Small woodland trial has layered trees and dense instanced grass")
 var trial_clear=true
 for batch in trial.find_children("*","MultiMeshInstance3D",true,false):
  for i in batch.multimesh.instance_count:
   var pos=batch.multimesh.get_instance_transform(i).origin
   if absf(-pos.z-trial.trail_s(pos.x))<.84 or preload("res://scripts/land_use.gd").no_tall_grass(pos.x,-pos.z):trial_clear=false
 check(trial_clear,"Trial grass clears trail and protected lawns")
 check(preload("res://scripts/land_use.gd").shopping(31,881),"Former tree position excluded from shopping building")
 check(absf(dealer.rotation.y-PI)<.01 and absf(dealer.position.z+917.6)<.01,"Showroom reversed and directly adjoining ICA rear wall")
 var cave=load("res://scripts/man_cave.gd").new();world.add_child(cave);cave.build(e);cave.set_process(false)
 check(cave.find_children("*","Area3D",true,false).any(func(a):return a.get_meta("interaction","")=="apartment_rifle"),"Trading room has usable AK pickup")
 check(cave.find_children("*","MeshInstance3D",true,false).size()>20,"Weapon-pack models and trading room furnishings load")
 check(is_equal_approx(load("res://scripts/medieval_layout.gd").elevation(48,990,-48.09),-48.09),"Former canal is filled; no artificial canal trench")
 var road=load("res://art/environment/roads/forest_road.res").instantiate();root.add_child(road)
 check(road.get_child_count()==70,"Widened road has all 70 baked segments")
 check(road.get_child(0).get_aabb().size.x>13.0,"12-metre road plus shoulders baked into mesh")
 e.cash=1000
 var panel=load("res://scripts/trading_panel.gd").new();e.trading_ui=panel;panel.open(e)
 check(not world.player.enabled and panel.columns.get_child_count()>5,"Trading terminal opens and releases player input")
 panel.close();check(world.player.enabled and e.trading_ui==null,"Trading terminal closes cleanly")
 for action in ["forward","back","left","right"]:
  if not InputMap.has_action(action):InputMap.add_action(action)
 var car=dealer.owned.sedan;car.global_position=Vector3(0,.1,-700);car.rotation.y=0;car.enter()
 var origin=car.global_position
 Input.action_press("forward")
 for i in 45:await physics_frame
 Input.action_release("forward")
 check(car.global_transform.is_finite() and car.global_position.z>origin.z+.1,"Delivered car drives with finite motion on baked road")
 car.speed=0;car.velocity=Vector3.ZERO;car.exit_car()
 check(not car.driving and world.player.enabled,"Purchased car can be exited")
 await physics_frame
 var space=world.get_world_3d().direct_space_state
 var ramp_hit=space.intersect_ray(PhysicsRayQueryParameters3D.create(Vector3(20,-42,-884),Vector3(20,-46,-884),1))
 check(not ramp_hit.is_empty() and absf(ramp_hit.position.y+44.4)<.15,"Gym ramp collision supports player at matching slope height")
 check(space.intersect_ray(PhysicsRayQueryParameters3D.create(Vector3(21.5,-39.4,-900),Vector3(25,-39.4,-900),1)).is_empty(),"Gym doorway has no wall blocking landing")
 check(space.intersect_ray(PhysicsRayQueryParameters3D.create(Vector3(49.6,-46.5,-869),Vector3(49.6,-46.5,-880),1)).is_empty(),"Shopping entrance route is clear")
 for z in [-895]:
  check(space.intersect_ray(PhysicsRayQueryParameters3D.create(Vector3(16,-46.7,z),Vector3(21,-46.7,z),1)).is_empty(),"Road-facing retail door clear at "+str(z))
 verify_home_transport(world,home,fixture,chosen)
 e.save();var stored=JSON.parse_string(FileAccess.get_file_as_string(e.SAVE))
 check(stored.owned_cars.has("sedan") and stored.has("portfolio") and stored.has("uranium_piles"),"Ownership, portfolio and measured precipitate masses persist")
 if saved!="":var file=FileAccess.open(e.SAVE,FileAccess.WRITE);file.store_string(saved)
 else:DirAccess.remove_absolute(e.SAVE)
 for owned in dealer.owned.values():owned.engine.stop();owned.engine.stream=null
 await create_timer(.15).timeout
 road.free();world.free()
 await create_timer(.15).timeout
 print("LIVING TOWN FAILURES ",failures)
 quit(1 if failures else 0)

func verify_home_transport(world,home,fixture,chosen):
 var old=world.expansion
 var exp=load("res://scripts/bench_expansion.gd").new();world.add_child(exp);exp.lab=world;exp.init_materials();exp.set_process(false)
 exp.output_solid=old.output_solid;exp.output_solid.reparent(exp);exp.output_liquid=old.output_liquid;exp.output_liquid.reparent(exp)
 world.expansion=exp;old.free()
 var previous=world.glassware
 var glasses=load("res://scripts/glassware_workflow.gd").new();world.add_child(glasses);glasses.lab=world;glasses.set_process(false);world.glassware=glasses;previous.free()
 exp.held_rifle=Node3D.new();exp.add_child(exp.held_rifle)
 exp.sample_target=Area3D.new();exp.add_child(exp.sample_target)
 exp.pump=AudioStreamPlayer3D.new();exp.add_child(exp.pump)
 exp.filter_liquid=home.liquid
 var curve=load("res://scripts/titration_curve.gd").new();world.game_ui.add_child(curve)
 var glow=OmniLight3D.new();world.add_child(glow)
 world.room={"sample_liquid":home.liquid,"sample_vessel":home.titration_vessel,"sample_glow":glow,"burette_contents":null,"titration_detail":{"curve":curve}}
 var w=world.workbench;w.setup=fixture.setup.duplicate(true);w.points=fixture.points.duplicate(true);w.diagrams=[];w.chosen=chosen
 var mass=float(w.points[chosen].inventory.drySolidMassG)
 check(exp.take_sample(),"Actual home sample can be carried")
 glasses.return_to_station("acid",home.to_global(Vector3(3.1,1.02,9.35)))
 check(not glasses.holding() and not exp.sample_away and is_equal_approx(w.points[w.chosen].inventory.drySolidMassG,mass),"Return to occupied titration apparatus preserves grams without collision blockage")
 check(exp.take_sample(),"Returned sample can be carried again")
 home.interact("home_filter")
 check(exp.filtering and exp.filtering_vessel.get_parent()==home,"Home filtration keeps carried beaker inside apartment")
 exp.finish_filter();home.update_filtration()
 check(is_equal_approx(exp.outputs.residueMassG,mass) and is_equal_approx(home.plain_residue.get_meta("inventory").drySolidMassG,mass),"Home filtration preserves and labels exact retained solid mass")
 check(float(home.filtrate.get_meta("inventory").drySolidMassG)==0,"Home filtrate excludes retained solid mass")
