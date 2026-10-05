extends Control
var lab: Node3D
var catalog: Dictionary
var setup: Dictionary
var diagrams: Array=[]
var diagram_index:=0
var curve_index:=-1
var points: Array=[]
var chosen:=0
var element:="H"
var stock:="sample"
var selected_forms: Array=["component:H%2B","spana:2ac52a30213c9288:250448"]
var box: VBoxContainer
var status: Label
var graph: Control
var readout: Label
var species: RichTextLabel
var selector: OptionButton
var busy:=false
var job_pid:=-1
var job_output:=""
var job_started:=0
var serial:=0
var table_mode:=true
var saved_rotation:=Vector3.ZERO
var saved_camera:=Vector3.ZERO
var bench_camera: Camera3D
var solve_count:=0
var requested_dose:=0.0
var dose_field: SpinBox

func initialize(world: Node3D) -> void:
	lab=world
	catalog=JSON.parse_string(FileAccess.get_file_as_string("res://science/catalog.json"))
	setup=catalog.defaultSetup.duplicate(true)
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var backdrop:=ColorRect.new();backdrop.color=Color(.015,.035,.04,.90)
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);add_child(backdrop)
	var panel:=PanelContainer.new();panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	panel.offset_left=24;panel.offset_top=20;panel.offset_right=-24;panel.offset_bottom=-20
	var style:=StyleBoxFlat.new();style.bg_color=Color(.025,.065,.075,.94);style.set_content_margin_all(18)
	panel.add_theme_stylebox_override("panel",style);add_child(panel)
	var menu_scroll:=ScrollContainer.new();menu_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;panel.add_child(menu_scroll)
	box=VBoxContainer.new();box.size_flags_horizontal=Control.SIZE_EXPAND_FILL;box.size_flags_vertical=Control.SIZE_EXPAND_FILL;box.add_theme_constant_override("separation",6);menu_scroll.add_child(box)
	bench_camera=Camera3D.new();lab.add_child(bench_camera)
	bench_camera.position=Vector3(-1.75,2.05,5.0);bench_camera.look_at(Vector3(-3.8,2.02,5.45));bench_camera.fov=47
	build_board()
	apply_vessel()
	hide()
func form_title(id:String,fallback:String)->String:
	if id=="component:UO2%202%2B":return "UO₂²⁺ · URANYL (+2)"
	if id=="component:UO2%2B":return "UO₂⁺ · charge +1 (different component)"
	return fallback
func label(parent: Node, text: String, font_size: int=18) -> Label:
	var node:=Label.new();node.text=text;node.add_theme_font_size_override("font_size",font_size);parent.add_child(node);return node
func button(parent: Node, text: String, callback: Callable) -> Button:
	var node:=Button.new();node.text=text;node.custom_minimum_size.y=34;node.pressed.connect(callback);parent.add_child(node);return node
func primary_button(parent: Node,text: String,callback: Callable) -> Button:
	var action:=button(parent,text,callback);action.custom_minimum_size.y=42;action.add_theme_font_size_override("font_size",18)
	for state in ["normal","hover","pressed","focus"]:
		var style:=StyleBoxFlat.new();style.bg_color=Color("247c69") if state=="normal" else Color("329b83") if state=="hover" else Color("195f51")
		style.set_corner_radius_all(5);style.set_content_margin_all(7)
		if state=="focus":style.bg_color=Color(0,0,0,0);style.set_border_width_all(2);style.border_color=Color("a5efd9")
		action.add_theme_stylebox_override(state,style)
	return action
func row(parent: Node) -> HBoxContainer:
	var node:=HBoxContainer.new();node.add_theme_constant_override("separation",6);parent.add_child(node);return node
func clear() -> void:
	for child in box.get_children():box.remove_child(child);child.queue_free()
func open(table: bool) -> void:
	if lab.staff_exit!=null and lab.staff_exit.apartment.inside:
		var home=lab.staff_exit.apartment
		bench_camera.global_position=home.to_global(Vector3(3.8,2.0,7.5));bench_camera.look_at(home.to_global(Vector3(3.1,1.6,9.35)));bench_camera.environment=home.interior_environment
	else:
		bench_camera.position=Vector3(-1.75,2.05,5.0);bench_camera.look_at(Vector3(-3.8,2.02,5.45));bench_camera.environment=null
	table_mode=table
	lab.panel.hide();lab.paused=false;lab.player.enabled=false;Input.mouse_mode=Input.MOUSE_MODE_VISIBLE
	show();rebuild()
	
func close() -> void:
	hide();lab.player.camera.make_current();lab.player.enabled=true;Input.mouse_mode=Input.MOUSE_MODE_CAPTURED
func rebuild() -> void:
	clear()
	var header:=row(box)
	label(header,"PREPARATION / PERIODIC TABLE" if table_mode else "ACID–BASE / WET LAB",24).size_flags_horizontal=Control.SIZE_EXPAND_FILL

	button(header,"Return to laboratory · Esc",close)
	if table_mode:build_table()
	else:build_bench()
	status=label(box,"Choose the components for your chemical system. Experiment setup is at the appropriate bench." if table_mode else ("Calculating with Adam’s Wet Lab engine…" if busy else "Analytical components · ideal model · 25 °C · 1 bar · independent equilibrium at each dose"),15)
	status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
func remove_form(id: String) -> void:
	selected_forms.erase(id)
	for key in ["sample","titrant"]:
		setup[key].contributions=setup[key].contributions.filter(func(c):return c.sourceId!=id)
	invalidate()
func toggle_form(id: String) -> void:
	if id in selected_forms:remove_form(id)
	else:
		selected_forms.append(id)
		# Newly selected material starts in the sample; electrons remain a redox coordinate.
		if id!="component:e-" and not setup.sample.contributions.any(func(c):return c.sourceId==id):
			setup.sample.contributions.append({"id":"sample-"+id,"kind":"component","sourceId":id,"concentrationMolPerL":.1})
		invalidate()
	rebuild()
func choose_element(symbol: String) -> void:
	element=symbol
	for f in catalog.forms:
		if symbol in f.elements and f.id in selected_forms:remove_form(f.id)
	rebuild()
func build_table() -> void:
	var grid:=GridContainer.new();grid.columns=18;grid.size_flags_horizontal=Control.SIZE_EXPAND_FILL;box.add_child(grid)
	for y in range(1,11):
		for x in range(1,19):
			var item: Dictionary={}
			for e in catalog.elements:
				if int(e.row)==y and int(e.column)==x:item=e;break
			if item.is_empty():
				var blank:=Control.new();blank.custom_minimum_size=Vector2(38,25);grid.add_child(blank)
			else:
				var symbol: String=item.symbol
				var b:=button(grid,symbol,func():choose_element(symbol))
				b.size_flags_horizontal=Control.SIZE_EXPAND_FILL;b.custom_minimum_size=Vector2(38,30)
				b.tooltip_text="%s · %s" % [item.atomicNumber,item.name]
				b.modulate=Color("80e4c5") if catalog.forms.any(func(f):return symbol in f.elements and f.id in selected_forms) else Color("b4d3e7") if element==symbol else Color.WHITE
	var options:=row(box)
	label(options,"Available component forms · "+element,18).size_flags_horizontal=Control.SIZE_EXPAND_FILL
	var electron:=button(options,("✓ " if "component:e-" in selected_forms else "+ ")+"e− / electrons (redox)",func():toggle_form("component:e-"))
	electron.modulate=Color("80e4c5") if "component:e-" in selected_forms else Color.WHITE
	var forms:=HFlowContainer.new();forms.name="VisibleComponentForms";box.add_child(forms)
	var count:=0
	for f in catalog.forms:
		if element in f.elements:
			count+=1
			var id: String=f.id
			var choice:=button(forms,("✓ " if id in selected_forms else "+ ")+form_title(f.id,f.name),func():toggle_form(id))
			choice.modulate=Color("80e4c5") if id in selected_forms else Color.WHITE
	if count==0:label(forms,"No supported analytical component forms",16)
	label(box,"Click a form to select it. Click an element to show its forms and deselect all forms containing that element.",14)
	label(box,"Selected chemical system",20)
	var selections:=HFlowContainer.new();box.add_child(selections)
	for id in selected_forms:
		var display: String="e− (redox)" if id=="component:e-" else id
		for f in catalog.forms:
			if f.id==id:display=form_title(f.id,f.name);break
		button(selections,display+" ×",func():remove_form(id);rebuild())
	label(box,"Your component selection travels with you. Return to the room and visit a laboratory station to set up an experiment.",15).autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
func stock_controls(parent: Node,key: String) -> void:
	var card:=PanelContainer.new();card.name="BeakerSpecies" if key=="sample" else "BuretteSpecies";card.size_flags_vertical=Control.SIZE_EXPAND_FILL;parent.add_child(card)
	var tint:=Color("80d8ec") if key=="titrant" else Color("efcd8c")
	var frame:=StyleBoxFlat.new();frame.bg_color=Color("10272e");frame.border_color=tint;frame.border_width_left=3;frame.set_content_margin_all(9);frame.set_corner_radius_all(4);card.add_theme_stylebox_override("panel",frame)
	var panel:=VBoxContainer.new();panel.size_flags_horizontal=Control.SIZE_EXPAND_FILL;panel.add_theme_constant_override("separation",8);card.add_child(panel)
	label(panel,"BEAKER / sample" if key=="sample" else "BURETTE / titrant",19).modulate=tint
	label(panel,"Select species for this beaker" if key=="sample" else "Select species for this burette",14)
	var additions:=row(panel)
	var available:=OptionButton.new();available.size_flags_horizontal=Control.SIZE_EXPAND_FILL;additions.add_child(available)
	for id in selected_forms.filter(func(id):return id!="component:e-"):
		var display: String="e− (redox)" if id=="component:e-" else id
		for f in catalog.forms:
			if f.id==id:display=form_title(f.id,f.name);break
		available.add_item(display)
	button(additions,"+ Add",func():
		var stock_forms: Array=selected_forms.filter(func(id):return id!="component:e-")
		if stock_forms.is_empty():return
		var id: String=stock_forms[available.selected]
		if setup[key].contributions.any(func(c):return c.sourceId==id):return
		setup[key].contributions.append({"id":key+str(Time.get_ticks_msec()),"kind":"component","sourceId":id,"concentrationMolPerL":.1})
		invalidate();rebuild())
	var r:=row(panel);label(r,"mL",15)
	var volume:=SpinBox.new();volume.min_value=.1;volume.max_value=1000;volume.step=.1;volume.value=setup[key].volumeMl;r.add_child(volume)
	volume.value_changed.connect(func(v):setup[key].volumeMl=v;invalidate())
	label(r,"pH",15)
	var ph:=LineEdit.new();ph.placeholder_text="Optional";ph.custom_minimum_size.x=90;ph.text=str(setup[key].get("initialPH",""));r.add_child(ph)
	ph.text_changed.connect(func(t):setup[key].initialPH=t;invalidate())
	var scroll:=ScrollContainer.new();scroll.custom_minimum_size.y=44;scroll.size_flags_vertical=Control.SIZE_EXPAND_FILL;panel.add_child(scroll)
	var list:=VBoxContainer.new();list.size_flags_horizontal=Control.SIZE_EXPAND_FILL;scroll.add_child(list)
	for contribution in setup[key].contributions:
		var line:=row(list)
		var name: String=contribution.sourceId
		for f in catalog.forms:
			if f.id==name:name=form_title(f.id,f.name);break
		label(line,name,16).size_flags_horizontal=Control.SIZE_EXPAND_FILL
		var c:=LineEdit.new();c.text=str(contribution.concentrationMolPerL);c.custom_minimum_size.x=85;line.add_child(c)
		c.text_changed.connect(func(t):contribution.concentrationMolPerL=t;invalidate())
		label(line,"mol/L",14)
		button(line,"×",func():setup[key].contributions.erase(contribution);invalidate();rebuild())
func invalidate() -> void:
	serial+=1;points=[];diagrams=[];chosen=0;requested_dose=0;apply_vessel()
	if is_instance_valid(graph):graph.set_data([],0)
	if is_instance_valid(selector):selector.clear()
	if is_instance_valid(readout):readout.text="Setup changed · prepare again"
	if is_instance_valid(species):species.text=""
	if is_instance_valid(status):status.text="Setup changed · prepare the experiment again"
func build_bench() -> void:
	var main:=HBoxContainer.new();main.size_flags_vertical=Control.SIZE_EXPAND_FILL;box.add_child(main)
	var left:=VBoxContainer.new();left.custom_minimum_size.x=260;main.add_child(left)
	# A live 3D view of the actual bench, sharing the main world's geometry.
	var container:=SubViewportContainer.new();container.stretch=true;container.custom_minimum_size=Vector2(260,400);container.size_flags_vertical=Control.SIZE_EXPAND_FILL;left.add_child(container)
	var viewport:=SubViewport.new();viewport.size=Vector2i(420,350);viewport.world_3d=lab.get_world_3d();viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS;container.add_child(viewport)
	var camera:=Camera3D.new();viewport.add_child(camera);camera.global_transform=bench_camera.global_transform;camera.fov=47;camera.environment=bench_camera.environment;camera.current=true
	label(left,"Live bench · beaker + burette",17)
	label(left,"Selected result · illustrative appearance",12)
	var stocks:=VBoxContainer.new();stocks.custom_minimum_size.x=325;stocks.add_theme_constant_override("separation",12);main.add_child(stocks)
	stock_controls(stocks,"titrant");stock_controls(stocks,"sample")
	var right:=VBoxContainer.new();right.size_flags_horizontal=Control.SIZE_EXPAND_FILL;main.add_child(right)
	var prepare_button:=primary_button(right,"Prepare experiment",func():requested_dose=0;prepare())
	prepare_button.name="PrepareExperiment";prepare_button.tooltip_text="Calculate the configured sample and titrant before adding a dose."
	var dosing:=row(right)
	for step in [.01,.1,1.0]:
		button(dosing,"+%.2f mL" % step,func():set_dose((float(points[chosen].x) if not points.is_empty() else 0.0)+step))
	dose_field=SpinBox.new();dose_field.min_value=0;dose_field.max_value=float(setup.titrant.volumeMl);dose_field.step=.01;dosing.add_child(dose_field)
	button(dosing,"Apply mL",func():set_dose(dose_field.value))
	button(dosing,"Reset",func():set_dose(0))
	button(left,"Carry beaker to filtration",func():lab.expansion.take_sample())
	button(left,"Composition / masses",func():lab.accounting.show_inventory(points[chosen].get("inventory",{}) if not points.is_empty() else {}))
	var tabs:=row(right)
	for entry in [["pH", "titration"],["Log concentrations","log-concentration"],["Log solubility","solubility"]]:
		button(tabs,entry[0],func():
			for i in diagrams.size():
				if diagrams[i].key.begins_with(entry[1]):diagram_index=i;curve_index=-1;rebuild();return
			status.text="Prepare an experiment to view calculated diagrams.")
	var views:=row(right)
	var view_choice:=OptionButton.new();view_choice.size_flags_horizontal=Control.SIZE_EXPAND_FILL;views.add_child(view_choice)
	for d in diagrams:view_choice.add_item(d.label)
	diagram_index=clampi(diagram_index,0,maxi(0,diagrams.size()-1));view_choice.select(diagram_index) if view_choice.item_count>0 else null
	view_choice.item_selected.connect(func(i):diagram_index=i;curve_index=-1;rebuild())
	var carrier:=OptionButton.new();carrier.size_flags_horizontal=Control.SIZE_EXPAND_FILL;views.add_child(carrier)
	carrier.add_item("All available species")
	if not diagrams.is_empty():
		for c in diagrams[diagram_index].series:carrier.add_item(c.name)
		curve_index=clampi(curve_index,-1,maxi(-1,diagrams[diagram_index].series.size()-1));carrier.select(curve_index+1)
	carrier.item_selected.connect(func(i):curve_index=i-1;select_point(chosen))
	graph=preload("res://scripts/titration_curve.gd").new();graph.custom_minimum_size.y=170;graph.size_flags_vertical=Control.SIZE_EXPAND_FILL;right.add_child(graph);graph.selected.connect(select_point)
	var navigation:=row(right)
	button(navigation,"←",func():select_point(maxi(0,chosen-1)))
	button(navigation,"→",func():select_point(mini(points.size()-1,chosen+1)))
	selector=OptionButton.new();selector.size_flags_horizontal=Control.SIZE_EXPAND_FILL;navigation.add_child(selector);selector.item_selected.connect(select_point)
	for p in points:selector.add_item("%.2f mL · %s" % [p.x,"pH %.5f" % float(p.y) if p.y!=null else "unavailable"])
	readout=label(right,"",17)
	species=RichTextLabel.new();species.custom_minimum_size.y=120;right.add_child(species)
	select_point(chosen)
	if setup.sample.contributions.any(func(c):return c.sourceId=="component:UO2%2B"):
		label(right,"Selected UO₂⁺ (+1), not uranyl UO₂²⁺ (+2). Check the component selection.",16).autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
func prepare() -> void:
	if busy:return
	busy=true;job_started=Time.get_ticks_msec()
	job_pid=int(JavaScriptBridge.get_interface("AdamChemistry").submit("wet",JSON.stringify({"setup":setup,"dose":requested_dose})))
	status.text="Preparing stocks and calculating doses…"
	set_meta("job_serial",serial)
func _process(_delta: float) -> void:
	if not busy:return
	var response: String=JavaScriptBridge.get_interface("AdamChemistry").poll(job_pid)
	if not response.is_empty():
		busy=false
		var result=JSON.parse_string(response)
		if int(get_meta("job_serial"))!=serial:return
		if result==null or not result.get("ok",false):status.text=str(result.get("error","Calculation failed")) if result!=null else "Invalid calculation response";return
		points=result.points;diagrams=result.get("diagrams",[]);chosen=0;solve_count=int(result.solveCount)
		for i in points.size():
			if absf(float(points[i].x)-requested_dose)<.000001:chosen=i
		if visible:rebuild()
		apply_vessel()
	elif Time.get_ticks_msec()-job_started>120000:
		busy=false;status.text="Calculation worker stopped or timed out. No result has been substituted."
		JavaScriptBridge.get_interface("AdamChemistry").cancel(job_pid)
func set_dose(value: float) -> void:
	if points.is_empty() or busy:return
	requested_dose=clampf(value,0,float(setup.titrant.volumeMl))
	for i in points.size():
		if absf(float(points[i].x)-requested_dose)<.000001:select_point(i);return
	prepare()
func select_point(i: int) -> void:
	if points.is_empty():
		if is_instance_valid(readout):readout.text="Setup preview · no equilibrium calculated"
		return
	chosen=clampi(i,0,points.size()-1)
	var p: Dictionary=points[chosen]
	if is_instance_valid(graph):graph.set_data(points,chosen);configure_diagram(graph)
	if is_instance_valid(selector):selector.select(chosen)
	if is_instance_valid(dose_field):dose_field.value=float(p.x)
	if is_instance_valid(readout):readout.text="%.2f mL added · %.2f mL in beaker · %s" % [p.x,p.volume,"pH %.5f" % float(p.y) if p.y!=null else "Unavailable equilibrium"]
	if is_instance_valid(readout) and p.y!=null:
		var grams=p.get("inventory",{}).get("drySolidMassG")
		readout.text+="\nPRECIPITATE: "+("%.6f g" % float(grams) if grams!=null else "mass unavailable")
	if is_instance_valid(species):
		species.text=""
		if p.y==null:species.text=JSON.stringify(p.diagnostics)
		else:
			species.text=lab.accounting.summary(p.get("inventory",{}))+"\n"+p.get("phaseMessage","")+"\n\n"
			for solid in p.get("inventory",{}).get("solids",[]):
				if solid.get("molarMassG")!=null:species.text+="%s: %.8f mol × %.5f g/mol = %.6f g\n" % [solid.name,float(solid.moles),float(solid.molarMassG),float(solid.massG)]
			for s in p.species:species.text+="%s: %s mol/kg-H₂O\n" % [s.name,str(s.concentration)]
	apply_vessel()
func apply_vessel() -> void:
	var volume: float=float(setup.sample.volumeMl)
	var solid_amount:=0.0
	var accepted:=false
	var sediment_fraction:=0.0
	if not points.is_empty():
		var p: Dictionary=points[chosen];volume=float(p.volume);accepted=p.y!=null
		if accepted:
			sediment_fraction=float(p.get("visual",{}).get("bedHeight",0))/56.0
			for s in p.solids:solid_amount+=maxf(0,float(s.get("amount",0)))
	var liquid=lab.room.sample_liquid
	liquid.visible=not points.is_empty();liquid.emission_strength=0;liquid.liquid_color=Color(.40,.65,.72,.32)
	liquid.height=.45;liquid.fill_level=clampf(volume/(float(setup.sample.volumeMl)+float(setup.titrant.volumeMl))*.94,.04,.94)
	liquid.sediment_amount=clampf(sediment_fraction,0,1) if accepted else 0.0
	liquid.settling_progress=minf(liquid.sediment_amount,liquid.fill_level*1.1);liquid.precipitation_progress=liquid.sediment_amount
	liquid.sediment_color=Color(.75,.72,.57);liquid.apply_visuals()
	lab.room.sample_glow.light_energy=0
	if lab.room.burette_contents!=null:
		var fraction:=1.0 if points.is_empty() else float(points[chosen].remaining)/float(setup.titrant.volumeMl)
		lab.room.burette_contents.scale.y=maxf(.001,fraction)
		lab.room.burette_contents.position.y=1.85+.35*fraction
		lab.room.burette_contents.visible=fraction>0
	lab.room.titration_detail.curve.set_data(points,chosen)
	configure_diagram(lab.room.titration_detail.curve)
func configure_diagram(target: Control) -> void:
	if diagrams.is_empty():target.diagram={};target.queue_redraw();return
	var d: Dictionary=diagrams[clampi(diagram_index,0,diagrams.size()-1)]
	if curve_index<0:
		target.diagram={"label":d.label,"all_series":d.series};target.queue_redraw();return
	target.diagram={"label":d.label,"series":d.series[clampi(curve_index,0,d.series.size()-1)] if not d.series.is_empty() else {"name":"No positive component inventory","values":[],"reasons":[]}}
	target.queue_redraw()
func build_board() -> void:
	var board:=Node3D.new();board.name="PeriodicPreparationScreen";lab.room.add_child(board)
	board.position=Vector3(.6,2.25,-3.59);board.rotation.y=0;board.scale=Vector3.ONE*.78
	var housing:=MeshInstance3D.new();var shell:=BoxMesh.new();shell.size=Vector3(2.19,1.34,.10);housing.mesh=shell;housing.position.z=-.07
	var casing:=StandardMaterial3D.new();casing.albedo_color=Color(.025,.032,.035);casing.metallic=.55;casing.roughness=.32;housing.material_override=casing;board.add_child(housing)
	var support:=MeshInstance3D.new();var stand:=BoxMesh.new();stand.size=Vector3(.12,.12,.14);support.mesh=stand;support.position=Vector3(0,0,-.08);support.material_override=casing;board.add_child(support)
	var mesh:=MeshInstance3D.new();var quad:=QuadMesh.new();quad.size=Vector2(2.1,1.25);mesh.mesh=quad;board.add_child(mesh)
	var viewport:=SubViewport.new();viewport.size=Vector2i(1000,600);viewport.render_target_update_mode=SubViewport.UPDATE_ONCE;board.add_child(viewport)
	var background:=ColorRect.new();background.size=Vector2(1000,600);background.color=Color("10232b");viewport.add_child(background)
	var title:=label(viewport,"PERIODIC TABLE · CHEMICAL SYSTEM",30);title.position=Vector2(25,16)
	for e in catalog.elements:
		var tile:=Label.new();tile.text=e.symbol;tile.position=Vector2(22+(int(e.column)-1)*54,65+(int(e.row)-1)*47);tile.add_theme_font_size_override("font_size",23);tile.modulate=Color("80e4c5");viewport.add_child(tile)
	label(viewport,"E · Select elements and component forms",25).position=Vector2(25,550)
	var mat:=StandardMaterial3D.new();mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;mat.albedo_texture=viewport.get_texture();mesh.material_override=mat
	var body:=StaticBody3D.new();board.add_child(body);body.set_meta("interaction","periodic");body.set_meta("title","Periodic table · prepare solutions")
	var shape:=CollisionShape3D.new();var rectangle:=BoxShape3D.new();rectangle.size=Vector3(2.1,1.25,.08);shape.shape=rectangle;body.add_child(shape)
func _exit_tree() -> void:
	if busy:JavaScriptBridge.get_interface("AdamChemistry").cancel(job_pid)


