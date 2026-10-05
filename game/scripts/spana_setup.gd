extends RefCounted
var w: Control
func heading(parent: Node,title: String) -> VBoxContainer:
	var frame:=PanelContainer.new();frame.size_flags_horizontal=Control.SIZE_EXPAND_FILL;parent.add_child(frame)
	var style:=StyleBoxFlat.new();style.bg_color=Color("eeeeee");style.border_color=Color("cccccc");style.set_border_width_all(1);style.set_content_margin_all(12);frame.add_theme_stylebox_override("panel",style)
	var col:=VBoxContainer.new();col.add_theme_constant_override("separation",8);frame.add_child(col)
	w.lab.workbench.label(col,title,19).add_theme_color_override("font_color",Color("b000b0"));return col
func option(parent: Node,items: Array,current: int,callback: Callable) -> OptionButton:
	var b:=OptionButton.new();b.size_flags_horizontal=Control.SIZE_EXPAND_FILL;parent.add_child(b)
	for item in items:b.add_item(str(item))
	b.fit_to_longest_item=false;b.custom_minimum_size.x=160;b.select(maxi(0,current));b.item_selected.connect(callback);return b
func diagram_controls(parent: Node,vertical: bool=false) -> void:
	var r: Node=parent if vertical else w.lab.workbench.row(parent)
	w.lab.workbench.label(r,"Y-axis / Diagram type" if vertical else "Diagram type",16)
	var pairs: Array=[["log-concentration:","Logarithmic (log concentrations)"],["concentration:","Concentrations"],["log-activity:","Log activities"],["solid-amount:","Solid amounts"],["calculated-pH:","Calculated pH"]]
	if w.components().has("component:e-"):pairs.append(["calculated-redox:","Calculated pe (redox)"])
	for c in w.conditions:
		if c.role in ["proton","electron","solvent"]:continue
		for p in [["total-fraction","Fraction"],["aqueous-fraction","Aqueous fraction"],["saturated-log-solubility","Log solubilities"],["log-total-dissolved","Log dissolved concentration"],["total-dissolved","Dissolved concentration"],["analytical-total","Analytical total"]]:pairs.append([p[0]+":"+c.componentId,p[1]+" / "+c.name])
	var keys: Array=pairs.map(func(p):return p[0]);var names: Array=pairs.map(func(p):return p[1])
	option(r,names,keys.find(w.diagram_key),func(i):w.diagram_key=keys[i];w.series_index=-1;w.rebuild())
	w.diagram_index=clampi(w.diagram_index,0,maxi(0,w.data.get("diagrams",[]).size()-1))
	for i in w.data.get("diagrams",[]).size():
		if w.data.diagrams[i].key==w.diagram_key:w.diagram_index=i;break
	if w.results_view and not w.data.get("diagrams",[]).is_empty():
		var rows: Array=w.data.diagrams[w.diagram_index].series;var all: bool=w.data.kind=="sweep"
		var items: Array=["All available species"] if all else []
		items.append_array(rows.map(func(s):return s.name));w.series_index=clampi(w.series_index,-1 if all else 0,maxi(0,rows.size()-1))
		option(parent,items,w.series_index+(1 if all else 0),func(i):w.series_index=i-(1 if all else 0);w.sync_plot())
func build(owner: Control,parent: Node) -> void:
	w=owner
	var name_row: HBoxContainer=w.lab.workbench.row(parent);w.lab.workbench.label(name_row,"Diagram name",16)
	var name_field:=LineEdit.new();name_field.text=w.diagram_name;name_field.size_flags_horizontal=Control.SIZE_EXPAND_FILL;name_row.add_child(name_field);name_field.text_changed.connect(func(t):w.diagram_name=t)
	var columns:=HBoxContainer.new();columns.size_flags_vertical=Control.SIZE_EXPAND_FILL;columns.add_theme_constant_override("separation",12);parent.add_child(columns)
	var left:=VBoxContainer.new();left.size_flags_horizontal=Control.SIZE_EXPAND_FILL;left.size_flags_stretch_ratio=2.3;columns.add_child(left)
	var d:=heading(left,"Diagram")
	var axes:=HBoxContainer.new();axes.add_theme_constant_override("separation",12);d.add_child(axes)
	var y_side:=VBoxContainer.new();y_side.name="YAxisControls";y_side.custom_minimum_size.x=220;axes.add_child(y_side)
	if w.dimension==1:axis_controls(y_side,"y",true)
	else:
		diagram_controls(y_side,true)
		var auto:=CheckBox.new();auto.text="Automatic Y limits";auto.button_pressed=not w.manual_y;y_side.add_child(auto);auto.toggled.connect(func(v):w.manual_y=not v;w.rebuild())
		w.lab.workbench.label(y_side,"Upper limit",14)
		w.spin(y_side,w.y_max,-1000,1000,.1,func(v):w.y_max=v)
		w.lab.workbench.label(y_side,"Lower limit",14)
		w.spin(y_side,w.y_min,-1000,1000,.1,func(v):w.y_min=v)
		for n in y_side.get_children():
			if n is SpinBox:n.editable=w.manual_y
	var chart_side:=VBoxContainer.new();chart_side.size_flags_horizontal=Control.SIZE_EXPAND_FILL;axes.add_child(chart_side)
	var sketch:=preload("res://scripts/diagram_frame.gd").new();sketch.name="BlankDiagramFrame";sketch.custom_minimum_size=Vector2(260,190);sketch.size_flags_vertical=Control.SIZE_EXPAND_FILL;chart_side.add_child(sketch)
	var x_side:=VBoxContainer.new();x_side.name="XAxisControls";chart_side.add_child(x_side);axis_controls(x_side,"x")
	if w.dimension==1:diagram_controls(d)
	var conc:=heading(left,"Concentrations")
	conc.get_parent().size_flags_vertical=Control.SIZE_EXPAND_FILL
	var scroll:=ScrollContainer.new();scroll.size_flags_vertical=Control.SIZE_EXPAND_FILL;scroll.custom_minimum_size.y=100;conc.add_child(scroll)
	var rows:=VBoxContainer.new();rows.size_flags_horizontal=Control.SIZE_EXPAND_FILL;scroll.add_child(rows)
	for c in w.conditions:
		var row: HBoxContainer=w.lab.workbench.row(rows);var title: Label=w.lab.workbench.label(row,c.name,16);title.custom_minimum_size.x=70
		if c.choice>=2:
			w.lab.workbench.label(row,("X" if c.choice<5 else "Y")+": "+coordinate_name(c,c.choice)+" varied from %s to %s" % [c.min,c.max],15)
		else:
			var activity: String="pH" if c.role=="proton" else "pe" if c.role=="electron" else "log activity"
			var mode:=option(row,["Total concentration",activity],c.choice,func(i):c.choice=i;w.clear_results();w.rebuild())
			mode.disabled=c.role=="solvent";mode.set_item_disabled(0,c.role=="electron")
			w.spin(row,c.value,-30,1000,.001,func(v):c.value=v;w.clear_results())
			w.lab.workbench.label(row,"mol/kg H₂O" if c.choice==0 else "",13)
	var parameters:=heading(columns,"Parameters");parameters.get_parent().custom_minimum_size.x=300
	w.lab.workbench.label(parameters,"Presentation",16)
	option(parameters,["2D diagram","3D surface","Fixed equilibrium"],w.dimension,func(i):w.apply_dimension(i);w.rebuild())
	for line in ["Activity model: ideal","Temperature: 25 °C","Pressure: 1 bar","Basis: 1 kg water"]:w.lab.workbench.label(parameters,line,16)
	var note: Label=w.lab.workbench.label(parameters,"Ionic-strength correction, predominance areas and relative-activity ratios are not available in this interface.",14);note.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	var help: Label=w.lab.workbench.label(parameters,"Components come from the periodic table.\n\n2D defaults to pH on X and logarithmic concentrations.\n\nNo dosing or volume change.",14);help.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	w.lab.workbench.primary_button(parent,"Calculating…" if w.busy else "Run calculation / draw diagram",w.run_calculation)
func coordinate_name(c: Dictionary,k: int) -> String:
	return ("pH" if c.role=="proton" else "pe" if c.role=="electron" else "log activity") if k in [4,7] else "log total conc." if k in [3,6] else "total conc."
func axis_controls(parent: Node,axis: String,vertical: bool=false) -> void:
	if w.dimension==2:return
	var candidates: Array=w.conditions.filter(func(c):return c.role!="solvent")
	var current: Dictionary={};var index:=0
	for i in candidates.size():
		if (axis=="x" and candidates[i].choice in [2,3,4]) or (axis=="y" and candidates[i].choice in [5,6,7]):current=candidates[i];index=i;break
	var r: Node=parent if vertical else w.lab.workbench.row(parent)
	w.lab.workbench.label(r,axis.to_upper()+"-axis",17)
	var component:=option(r,candidates.map(func(c):return c.name),index,func(i):w.assign_axis(candidates[i],axis,(4 if axis=="x" else 7) if candidates[i].role in ["proton","electron"] else (3 if axis=="x" else 6)))
	for i in candidates.size():
		var k: int=candidates[i].choice
		component.set_item_disabled(i,(axis=="x" and k>=5) or (axis=="y" and k in [2,3,4]))
	if current.is_empty():w.lab.workbench.label(parent,"Choose an axis component",14);return
	var base: int=2 if axis=="x" else 5
	var labels: Array=["Total conc. varied","log (Total conc.) varied",coordinate_name(current,4)+" varied"]
	var mode:=option(r,labels,current.choice-base,func(i):w.assign_axis(current,axis,base+i))
	if current.role=="electron":mode.set_item_disabled(0,true);mode.set_item_disabled(1,true)
	var range_row: Node=parent if vertical else w.lab.workbench.row(parent)
	w.lab.workbench.label(range_row,"From",14);w.spin(range_row,current.min,-30,1000,.1,func(v):current.min=v;w.clear_results())
	w.lab.workbench.label(range_row,"to",14);w.spin(range_row,current.max,-30,1000,.1,func(v):current.max=v;w.clear_results())
	w.lab.workbench.label(range_row,"Points",14);w.spin(range_row,current.points,2,50,1,func(v):current.points=int(v);w.clear_results())


static func classic_theme() -> Theme:
	var t:=Theme.new();t.default_font_size=15
	for kind in ["Label","Button","OptionButton","CheckBox","LineEdit","SpinBox"]:
		for color in ["font_color","font_hover_color","font_pressed_color","font_focus_color"]:t.set_color(color,kind,Color("161616"))
		t.set_color("font_disabled_color",kind,Color("777777"))
		t.set_color("font_uneditable_color",kind,Color("777777"))
	for kind in ["Button","OptionButton","LineEdit","SpinBox"]:
		for state in ["normal","hover","pressed","focus","read_only"]:
			var style:=StyleBoxFlat.new();style.bg_color=Color("ffffff") if kind=="LineEdit" else Color("e5e5e5");style.border_color=Color("999999");style.set_border_width_all(1);style.set_content_margin_all(5)
			if state=="hover":style.bg_color=Color("d5e8f7")
			t.set_stylebox(state,kind,style)
	return t
