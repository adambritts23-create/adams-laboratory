extends Node3D
## Exact approved web-model geometry; colors communicate electrode polarity.
const CELL = preload("res://art/kf/kf-cell.glb")
var stirring := false
var stir_bar: Node3D
var interaction: Area3D

func _ready() -> void:
	name = "KarlFischerCell"
	set_meta("dynamic", true)
	add_to_group("kf_cells")
	var model: Node3D = CELL.instantiate()
	model.name = "ApprovedCellModel"
	model.scale = Vector3.ONE * .15
	add_child(model)
	# The shared GLB retains separate generator, anode, cathode and dryer nodes.
	for node in model.find_children("*", "Node3D", true, false):
		if node.name.begins_with("PTFE_magnetic_stir_bar") or str(node.name).begins_with("PTFE magnetic stir bar"):
			stir_bar = node
		if node is GeometryInstance3D:
			node.visibility_range_end = 18.0
			node.visibility_range_end_margin = 2.0
			node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	interaction = Area3D.new()
	interaction.name = "KFStirrerInteraction"
	interaction.collision_layer = 4
	interaction.collision_mask = 0
	interaction.set_meta("interaction", "kf_stirrer")
	interaction.set_meta("title", "KF cell · Start stirrer")
	add_child(interaction)
	var shape := CollisionShape3D.new()
	var bounds := BoxShape3D.new()
	bounds.size = Vector3(.48,.64,.48)
	shape.shape = bounds
	shape.position.y = .32
	interaction.add_child(shape)
	set_process(false)

func toggle_stirrer() -> void:
	stirring = not stirring
	interaction.set_meta("title", "KF cell · " + ("Stop stirrer" if stirring else "Start stirrer"))
	set_process(stirring)

func _process(delta: float) -> void:
	if is_instance_valid(stir_bar):
		stir_bar.rotate_y(delta * 4.0)
