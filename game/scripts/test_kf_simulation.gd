extends SceneTree
func _initialize() -> void:
	var simulation=load("res://scripts/kf_simulation.gd")
	for i in 5:
		var run=simulation.new(i);run.start()
		while run.status=="running":
			run.step(.02)
			assert(run.current<=400.00001 and run.current>=0)
			assert(abs(run.solid+run.gas+run.deficit+run.charge-run.total-3*run.t)<.00001)
		assert(run.status=="complete" and run.t>=5)
		assert(abs(run.ppm()-run.vial.ppm)<run.vial.ppm*.002 if i<4 else abs(run.gross()-80)<.3)
		print(run.vial.id," ",run.ppm()," ppm · ",run.t," min")
	print("KF mass conservation, current limit and all prepared vial results PASS")
	quit()
