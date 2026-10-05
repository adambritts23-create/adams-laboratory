extends Control
var lab: Node3D
var conditions: Array=[]
var catalog: Array=[]
var data: Dictionary={}
var panel: VBoxContainer
var plot: Control
var monitor: Control
var message: Label
var busy:=false
var pid:=-1
var path:=""
var revision:=0
var started:=0
var active_revision:=0
var dimension:=0 # 0: 2D, 1: 3D, 2: fixed point
var diagram_key:="log-concentration:"
var diagram_index:=0
var series_index:=-1
var chosen:=0
var preview: Control
var preview_label: RichTextLabel
var point_slider: HSlider
const MODES=["Fixed total","Fixed activity","X: total","X: log total","X: activity","Y: total","Y: log total","Y: activity"]
func initialize(world: Node3D) -> void:
	lab=world;catalog=JSON.parse_string(FileAccess.get_file_as_string("res://science/calculation-catalog.json"))
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var back:=PanelContainer.new();back.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);back.offset_left=22;back.offset_top=18;back.offset_right=-22;back.offset_bottom=-18
	var style:=StyleBoxFlat.new();style.bg_color=Color("07181c");style.set_content_margin_all(18);back.add_theme_stylebox_override("panel",style);add_child(back)
	panel=VBoxContainer.new();panel.add_theme_constant_override("separation",8);back.add_child(panel);hide()
func components() -> Array:
	var ids: Array=["component:H%2B","component:H2O"]
	for f in lab.workbench.catalog.forms:
		if f.id in lab.workbench.selected_forms:
			for id in f.coefficients:
				if id not in ids:ids.append(id)
	if "component:e-" in lab.workbench.selected_forms:ids.append("component:e-")
	return ids
func open() -> void:
	var ids:=components();var oldids: Array=conditions.map(func(c):return c.componentId)
	if ids!=oldids:
		conditions=[];data={};revision+=1
		for id in ids:
			var info: Dictionary={}
			for c in catalog:
				if c.id==id:info=c;break
			conditions.append({"componentId":id,"name":info.get("name",id),"role":info.get("role","basis-choice"),"choice":4 if info.get("role")=="proton" else 1 if info.get("role") in ["solvent","electron"] else 0,"value":0 if info.get("role") in ["solvent","electron"] else .01,"min":0.0,"max":14.0,"points":31})
	if ids!=oldids:apply_dimension(dimension,false)
	lab.player.enabled=false;lab.panel.hide();lab.paused=false;Input.mouse_mode=Input.MOUSE_MODE_VISIBLE;show();rebuild()
func close() -> void:
	hide();lab.player.enabled=true;Input.mouse_mode=Input.MOUSE_MODE_CAPTURED
func clear_results() -> void:
	revision+=1;data={};chosen=0
	update_preview()
	if is_instance_valid(plot):plot.data={};plot.queue_redraw()
	if is_instance_valid(monitor):monitor.data={};monitor.queue_redraw()
	if is_instance_valid(message):message.text="Conditions changed · run calculation again"
func spin(parent: Node,value: float,minv: float,maxv: float,step: float,callback: Callable) -> void:
	var box:=SpinBox.new();box.min_value=minv;box.max_value=maxv;box.step=step;box.value=value;box.custom_minimum_size.x=104;parent.add_child(box);box.value_changed.connect(callback)
var results_view:=false
var diagram_name:="Equilibrium diagram"
var manual_y:=false
var y_min:=-9.0
var y_max:=1.0
func rebuild() -> void:
	theme=null if results_view else preload("res://scripts/spana_setup.gd").classic_theme()
	var back: PanelContainer=panel.get_parent()
	var style: StyleBoxFlat=back.get_theme_stylebox("panel").duplicate()
	style.bg_color=Color("07181c") if results_view else Color("eeeeee");back.add_theme_stylebox_override("panel",style)
	for n in panel.get_children():panel.remove_child(n);n.queue_free()
	var h: HBoxContainer=lab.workbench.row(panel)
	lab.workbench.label(h,"CALCULATION / "+("DIAGRAM" if results_view else "SELECT DIAGRAM TYPE"),24).size_flags_horizontal=Control.SIZE_EXPAND_FILL
	lab.workbench.button(h,"Setup" if results_view else "Results",func():results_view=not results_view;rebuild())
	lab.workbench.button(h,"Return to laboratory · Esc",close)
	if results_view:build_results()
	else:
		var ui=preload("res://scripts/spana_setup.gd").new();ui.build(self,panel)
	message=lab.workbench.label(panel,"Choose diagram and axes, edit concentrations, then run calculation.",14)
	message.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	if data.has("counts"):message.text="%s · %s accepted / %s requested. Gaps retain solver failures." % [data.status,data.counts.converged,data.counts.requested]
func build_results() -> void:
	lab.workbench.label(panel,diagram_name,18)
	var ui=preload("res://scripts/spana_setup.gd").new()
	ui.w=self;ui.diagram_controls(panel)
	var body:=HBoxContainer.new();body.size_flags_vertical=Control.SIZE_EXPAND_FILL;panel.add_child(body)
	var left:=VBoxContainer.new();left.custom_minimum_size.x=220;body.add_child(left)
	lab.workbench.button(left,"Composition / masses",func():lab.accounting.show_inventory(data.previews[chosen].get("inventory",{}) if not data.get("previews",[]).is_empty() else {}))
	preview=preload("res://scripts/calculation_beaker.gd").new();left.add_child(preview)
	preview_label=RichTextLabel.new();preview_label.custom_minimum_size=Vector2(220,90);preview_label.add_theme_font_size_override("normal_font_size",13);left.add_child(preview_label)
	plot=preload("res://scripts/calculation_plot.gd").new();plot.custom_minimum_size.y=220;plot.size_flags_vertical=Control.SIZE_EXPAND_FILL;plot.size_flags_horizontal=Control.SIZE_EXPAND_FILL;body.add_child(plot);plot.selected.connect(select_point);sync_plot()
	var nav:=HBoxContainer.new();panel.add_child(nav)
	lab.workbench.label(nav,"Selected equilibrium",14)
	var slider:=HSlider.new();point_slider=slider;slider.size_flags_horizontal=Control.SIZE_EXPAND_FILL;slider.min_value=0;slider.max_value=maxi(0,data.get("previews",[]).size()-1);slider.step=1;slider.value=chosen;nav.add_child(slider);slider.value_changed.connect(func(v):select_point(int(v)))
	update_preview()
func assign_axis(c: Dictionary,axis: String,choice: int) -> void:
	for other in conditions:
		if (axis=="x" and other.choice in [2,3,4]) or (axis=="y" and other.choice in [5,6,7]):other.choice=1 if other.choice in [4,7] else 0
	c.choice=choice;clear_results();rebuild()
func apply_dimension(value: int,clear: bool=true) -> void:
	dimension=value
	for c in conditions:
		if c.choice>=2:c.choice=1 if c.choice in [4,7] else 0
	if value<2:
		for c in conditions:
			if c.role=="proton":c.choice=4;c.min=0.0;c.max=14.0
	if value==1:
		var candidates: Array=conditions.filter(func(c):return c.role=="electron")
		if candidates.is_empty():candidates=conditions.filter(func(c):return c.role not in ["proton","solvent"])
		if not candidates.is_empty():
			var c: Dictionary=candidates[0];c.choice=7 if c.role=="electron" else 6;c.min=-10.0 if c.role=="electron" else -4.0;c.max=10.0 if c.role=="electron" else -1.0
	if clear:clear_results()
func request_data() -> Dictionary:
	var rows: Array=[]
	for c in conditions:
		var k: int=c.choice;var activity: bool=k in [1,4,7];var varied: bool=k>=2
		var row: Dictionary={"componentId":c.componentId,"mode":("LAV" if activity else "LTV" if k in [3,6] else "TV") if varied else "LA" if activity else "T","quantity":("pH" if c.role=="proton" else "pe" if c.role=="electron" else "log-activity") if activity else "total","unit":"dimensionless" if activity else "mol/kg-H2O"}
		if varied:row.axis="x" if k<5 else "y";row.range={"min":c.min,"max":c.max};row.points=c.points
		else:row.value=c.value
		rows.append(row)
	return {"conditions":rows}
func run_calculation() -> void:
	if busy:return
	if manual_y and y_max<=y_min:message.text="Y-axis maximum must exceed minimum.";return
	busy=true;active_revision=revision;started=Time.get_ticks_msec();path=ProjectSettings.globalize_path("user://calculation-%s.json" % started)
	pid=int(JavaScriptBridge.get_interface("AdamChemistry").submit("conditions",JSON.stringify(request_data())))
	message.text="Calculating independent conditions…"
func sync_plot() -> void:
	for target in [plot,monitor]:
		if is_instance_valid(target):target.data=data;target.diagram_index=diagram_index;target.series_index=series_index;target.chosen=chosen;target.y_bounds=Vector2(y_min,y_max) if manual_y and y_max>y_min else null;target.queue_redraw()
func select_point(index: int) -> void:
	chosen=clampi(index,0,maxi(0,data.get("previews",[]).size()-1))
	if is_instance_valid(point_slider):point_slider.set_value_no_signal(chosen)
	sync_plot();update_preview()
func update_preview() -> void:
	if lab.glassware!=null:lab.glassware.sync_calculation_beaker()
	if not is_instance_valid(preview):return
	var states: Array=data.get("previews",[]);var state: Dictionary=states[clampi(chosen,0,states.size()-1)] if not states.is_empty() else {}
	preview.apply_result(state)
	preview_label.text="1 kg water basis · nominal 1 L illustration
"+("pH %.4f
" % float(state.pH) if state.get("accepted",false) else "No accepted equilibrium
")+str(state.get("message","Run a calculation"))+"
Appearance is illustrative."
func _process(_delta: float) -> void:
	if not busy:return
	var response: String=JavaScriptBridge.get_interface("AdamChemistry").poll(pid)
	if not response.is_empty():
		busy=false;var result=JSON.parse_string(response)
		if active_revision!=revision:return
		if result==null or not result.get("ok",false):message.text=result.get("error","Invalid response") if result!=null else "Invalid response";return
		data=result;series_index=-1;results_view=true;rebuild()
	elif Time.get_ticks_msec()-started>120000:
		busy=false;message.text="Calculation stopped. No substitute result."
		JavaScriptBridge.get_interface("AdamChemistry").cancel(pid)
func _exit_tree() -> void:
	if busy:JavaScriptBridge.get_interface("AdamChemistry").cancel(pid)

