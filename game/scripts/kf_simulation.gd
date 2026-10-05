extends RefCounted
## Same mass balance, Faraday conversion and approximate controller as src/kf/simulation.js.
const FACTOR = 18.01528 * 1e6 * 60.0 / (2.0 * 96485.33212 * 1000.0)
const VIALS = [
 {"id":"GREEN-001","mass":0.6,"ppm":1000.0,"k":1.05,"color":Color(.39,.66,.30)},
 {"id":"GLOW-002","mass":0.6,"ppm":2000.0,"k":.95,"color":Color(.53,.87,.26),"glow":true},
 {"id":"GLOW-003","mass":0.6,"ppm":3000.0,"k":1.05,"color":Color(.53,.87,.26),"glow":true},
 {"id":"YELLOWCAKE-001","mass":.02,"ppm":50000.0,"k":.90,"color":Color(.9,.78,.20),"orange":true},
 {"id":"BLANK-001","mass":1.0,"ppm":0.0,"k":1.6,"color":Color.WHITE,"blank":true}]
var vial: Dictionary
var status := "ready"
var flow := 50.0
var blank := 80.0
var t := 0.0
var total := 0.0
var solid := 0.0
var gas := 0.0
var deficit := 0.0
var rate := 3.0
var current := 3.0 / FACTOR
var voltage := 50.0
var charge := 0.0
var hold := 0.0
var history: Array = []
var last_point := 0.0
func _init(index: int=0, q: float=50.0, correction: float=80.0) -> void:
	vial=VIALS[index].duplicate();flow=q;blank=correction;total=vial.mass*vial.ppm+80.0;solid=total
	history.append(point())
func gross() -> float:return maxf(0,charge-3*t)
func corrected() -> float:return gross() if vial.get("blank",false) else maxf(0,gross()-blank)
func ppm() -> float:return corrected()/vial.mass
func point() -> Vector3:return Vector3(t,gross(),rate)
func start() -> void:
	if status=="ready":status="running"
func abort() -> void:
	if status=="running":status="aborted";rate=3;current=3/FACTOR;voltage=50
func step(minutes: float) -> void:
	while minutes>1e-10 and status=="running":
		var dt: float=minf(minutes,.001);minutes-=dt
		var released: float=solid*(1-exp(-float(vial.k)*dt));solid-=released;gas+=released
		var moved: float=gas*(1-exp(-flow/10*dt));gas-=moved;deficit+=moved+3*dt
		voltage=50+60*tanh(deficit/12)
		var command: float=minf(400*FACTOR,3+.8*pow(voltage-50,2))
		rate+=(command-rate)*(1-exp(-dt/.025))
		var reacted: float=minf(deficit,rate*dt);deficit-=reacted;charge+=reacted;current=reacted/dt/FACTOR;t+=dt
		if t>=5 and rate<4 and voltage<51:hold+=dt
		else:hold=0
		if hold>=.333:status="complete";rate=3;current=3/FACTOR;voltage=50
		if t>=30 and status=="running":status="timeout"
		if t-last_point>=.025 or status!="running":history.append(point());last_point=t
