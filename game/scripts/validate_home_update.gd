extends "res://scripts/validate_town_economy.gd"
func run():
 var path="user://town-economy-v2.json"
 var saved=FileAccess.get_file_as_string(path) if FileAccess.file_exists(path) else ""
 if FileAccess.file_exists(path):DirAccess.remove_absolute(path)
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 12:await physics_frame
 lab.close_panel();var e=lab.economy;var r=lab.staff_exit
 check(r.garage==null,"Standalone garage removed")
 check(e.SAVE.ends_with("v2.json") and e.cash==0 and e.purchases.is_empty(),"Fresh story slot starts with reset plot")
 var before_piles=e.precipitate_piles
 e.interact("bonus_green_0");e.interact("bonus_green_0")
 check(e.precipitate_piles==before_piles+1,"Extra shelf chunk collected once")
 e.interact("gate_buyer");check(e.cash==200000,"Gate buyer accepts extra material")
 e.interact("bonus_green_8");e.interact("home_buyer");check(e.cash==400000,"Home material is accessible before room purchase")
 var alarms=lab.room.facility
 check(alarms.alarm_panels.size()==2,"Independent UF6 and NOx displays")
 alarms.clock=0;alarms.animate(.01);var first=alarms.alarm_panels[0].emission_energy_multiplier
 alarms.animate(.65);check(not is_equal_approx(first,alarms.alarm_panels[0].emission_energy_multiplier),"Alarm screen visibly blinks")

 var fixture=JSON.parse_string(FileAccess.get_file_as_string("res://validation/bench-expansion/carbonate.json"))
 lab.workbench.setup=fixture.setup;lab.workbench.points=fixture.points;lab.workbench.diagrams=fixture.diagrams;lab.workbench.chosen=fixture.points.size()-1
 check(lab.expansion.take_sample(),"Main lab accepted sample is carryable")
 var carried=lab.expansion.carried
 var parked=lab.glassware.put_down(Vector3(3.6,1.08,9.65))
 check(parked!=null and not lab.expansion.carrying,"Main draining board accepts sample without clipping")
 if parked!=null:
  lab.glassware.pickup(carried.get_meta("glass_target").get_meta("interaction").trim_prefix("glass_"))
  lab.expansion.return_sample();check(not lab.expansion.carrying,"Sample returns to clear titration position")
 e.cash=100000;e.interact("buy_piano")
 check(e.extensions.home_lab!=null,"Purchased room contains working lab")
 var h=e.extensions.home_lab
 var ids=[]
 for n in h.find_children("*","CollisionObject3D",true,false):
  if n.has_meta("interaction"):ids.append(n.get_meta("interaction"))
 for id in ["periodic","acid","sample","calculation","filter","sink","balance","transfer","residue","filtrate"]:check(ids.has("home_"+id),"Home station "+id)
 check(not e.uranium_residue({"available":true,"solids":[{"moles":1,"composition":{"Cu":1}}]}),"Other elements do not award green piles")
 check(not e.uranium_residue({"available":true,"solids":[{"moles":0,"composition":{"U":1}}]}),"Zero solid does not award a pile")
 var sample={"available":true,"solids":[{"moles":.1,"composition":{"U":1}}]}
 lab.expansion.output_solid.set_meta("inventory",sample);lab.expansion.output_solid.show()
 check(e.collect_precipitate() and e.precipitate_piles==1,"Accepted uranium residue becomes collectible")
 check(not e.collect_precipitate(),"Same residue cannot be collected twice")
 var before=e.cash;e.interact("pawn_sell");check(e.cash==before,"Pawn shop still rejects green piles")
 e.interact("home_buyer");check(e.cash==before+200000 and e.precipitate_piles==0,"Home contact consumes pile and pays once")
 e.interact("home_buyer");check(e.cash==before+200000,"Empty inventory cannot be sold again")
 var car=r.vehicle
 car.speed=15
 for i in 1200:car.update_engine(1.0/60,1)
 var pitch=car.engine.pitch_scale
 for i in 1200:car.update_engine(1.0/60,1)
 check(is_equal_approx(pitch,car.engine.pitch_scale),"Engine pitch stays stable at steady speed")
 car.speed=25
 for i in 1200:car.update_engine(1.0/60,1)
 check(car.engine.pitch_scale>pitch,"Engine hum increases with speed")
 car.driving=true
 var key=InputEventKey.new();key.pressed=true;key.physical_keycode=KEY_2
 check(not e.handle(key),"Driving number keys bypass inventory")
 car.handle(key);check(car.radio_channel==2 and car.radio.playing,"Number key switches radio")
 key.physical_keycode=KEY_0;car.handle(key);check(not car.radio.playing,"Radio can be switched off")
 car.driving=false
 r.apartment.interact("home_enter")
 for i in 5:await physics_frame
 h.interact("home_periodic");check(lab.workbench.visible and lab.workbench.table_mode,"Home periodic table opens real preparation");lab.workbench.close()
 h.interact("home_acid");check(lab.workbench.visible and not lab.workbench.table_mode,"Home titration opens real workbench");check(lab.workbench.bench_camera.global_position.distance_to(r.apartment.global_position)<20,"Workbench camera remains in apartment");lab.workbench.close()
 h.interact("home_calculation");check(lab.calculations.visible,"Home calculations interface opens");lab.calculations.close()
 # Exercise the existing filtration controller with a synthetic accepted-result fixture.
 var f=lab.expansion
 f.outputs={};f.output_solid.hide();f.output_liquid.hide()
 f.snapshot={"inventory":{"available":true,"solids":[{"name":"Test solid","moles":.1,"composition":{"U":1},"massG":1}],"aqueous":[],"components":[],"drySolidMassG":1},"solids":[{"name":"Test solid","amount":.1}],"species":[],"volume":1000,"y":7}
 f.carried=Node3D.new();lab.player.camera.add_child(f.carried);f.carrying=true
 # Exercise result display independently of chemistry recipe or element selection.
 lab.room.sample_liquid.sediment_amount=.3;lab.room.sample_liquid.settling_progress=.3;lab.room.sample_liquid.precipitation_progress=.3;lab.room.sample_liquid.visible=true
 h._process(0);check(h.liquid.sediment_bed.visible and is_equal_approx(h.liquid.settling_progress,.3),"Home sediment copies settling state")
 h.interact("home_filter")
 check(f.filtering,"Home filter starts real filtration controller")
 for i in 340:await physics_frame
 check(not f.filtering and e.uranium_residue(f.output_solid.get_meta("inventory",{})),"Filtration partitions and exposes actual residue inventory")
 h.interact("home_residue");check(e.precipitate_piles==1 and not f.output_solid.visible,"Home output collects green pile")
 h.interact("home_filtrate");check(lab.polish.carried_output!=null,"Filtrate remains independently collectable")
 lab.glassware.put_down(h.to_global(Vector3(3.1,1.02,6.1)))
 # Actual calculation beaker pickup is available at home, with its saved result intact.
 lab.glassware.held=null;lab.polish.carried_output=null
 lab.calculations.data={"previews":[{"accepted":true,"pH":7,"solids":[],"visual":{"bedHeight":16},"inventory":{"available":true,"solids":[],"aqueous":[],"components":[],"drySolidMassG":0}}]};lab.calculations.chosen=0
 lab.glassware.sync_calculation_beaker();h._process(0)
 check(h.calculation_liquid.sediment_bed.visible,"Calculation sediment visible at home")
 h.interact("home_calculation_sample");check(lab.glassware.held!=null and lab.glassware.held.has_meta("calculation_record"),"Home result beaker can be carried to filter")
 var item=lab.glassware.held
 var blocked=h.to_global(Vector3(.27,1.45,6.1))
 check(lab.glassware.safe_glass_position(blocked,item)==null,"Beaker cannot be placed inside monitor")
 var clear=h.to_global(Vector3(2.5,1.12,6.1))
 var placed=lab.glassware.put_down(clear)
 check(placed!=null,"Beaker fits on clear balance platform")
 if placed!=null:check(placed.global_position.distance_to(clear)<.1,"Beaker rests above platform")
 var dealer=r.grounds.find_child("LexusShowroom",true,false)
 check(dealer!=null and dealer.position.distance_to(Vector3(-22,-48,-975))<.1,"Showroom moved across apartment road")
 check(r.grounds.find_child("HomeContact",true,false)!=null,"Buyer is outside home")
 check(r.grounds.find_child("Sevallagatan5C",true,false)!=null,"Apartment exterior builds correctly")
 if saved.is_empty():DirAccess.remove_absolute(path)
 else:var save_file=FileAccess.open(path,FileAccess.WRITE);save_file.store_string(saved)
 print("HOME UPDATE FAILURES ",failures);quit(1 if failures else 0)

