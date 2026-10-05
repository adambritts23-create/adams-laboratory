extends RefCounted
const CANAL=[Vector2(112,918),Vector2(78,944),Vector2(48,974),Vector2(48,1110)]
static func canal_distance(x:float,s:float)->float:
 var point=Vector2(x,s);var distance=10000.0
 for i in CANAL.size()-1:
  var a=CANAL[i];var ab=CANAL[i+1]-a;var t=clampf((point-a).dot(ab)/ab.length_squared(),0,1)
  distance=minf(distance,point.distance_to(a+ab*t))
 return distance
static func level(_s:float)->float:return -48.0
static func elevation(x:float,s:float,original:float)->float:
 for pond in [Vector3(54,1017,3.4),Vector3(66,1068,4.0)]:
  var d=Vector2(x-pond.x,s-pond.y).length()
  original-=.65*(1.0-smoothstep(pond.z*.45,pond.z,d))
 return original
static func modern_plots()->Array:
 var result=[]
 for s in [1040,1064,1088,1120,1144]:
  for x in [-20,-42,-64]:result.append(Vector3(x,-48,-s))
 return result
