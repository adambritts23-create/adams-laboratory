extends "res://scripts/lab_props.gd"
func build():
 init_materials();name="ConnectedKitchen"
 var white=material(Color(.88,.87,.81),0,.65)
 var counter=material(Color(.72,.73,.70),.15,.38)
 var steel=material(Color(.48,.53,.54),.75,.25)
 box(Vector3(4.85,.018,-2.45),Vector3(3.36,.03,4.72),material(Color(.23,.25,.25),0,.8))
 # Pantry just inside the left jamb, with two doors and handles facing the aisle.
 box(Vector3(3.58,1.17,-.55),Vector3(.78,2.34,.9),white,true)
 for z in [-.76,-.34]:
  box(Vector3(3.982,1.19,z),Vector3(.024,2.20,.40),white)
  tube(Vector3(4.01,1.02,z+.1),Vector3(4.01,1.25,z+.1),.012,metal)
 # Continuous base run with a recessed toe kick, panel joints and shared worktop.
 box(Vector3(3.54,.365,-2.89),Vector3(.70,.69,3.72),white,true)
 box(Vector3(3.84,.085,-2.89),Vector3(.045,.12,3.7),dark)
 for z in [-1.38,-2.08,-2.78,-3.48,-4.18]:
  box(Vector3(3.903,.49,z),Vector3(.026,.73,.67),white)
  tube(Vector3(3.93,.72,z-.19),Vector3(3.93,.72,z+.19),.012,metal)
 # Counter segments surround a genuine recessed double basin, not a dark decal.
 for spec in [[-1.45,.82],[-3.83,1.84]]:
  box(Vector3(3.55,.93,spec[0]),Vector3(.78,.06,spec[1]),counter)
 for x in [3.20,3.90]:box(Vector3(x,.93,-2.39),Vector3(.08,.06,1.06),counter)
 for z in [-2.13,-2.66]:
  box(Vector3(3.55,.755,z),Vector3(.59,.025,.46),steel)
  for x in [3.255,3.845]:box(Vector3(x,.845,z),Vector3(.025,.18,.47),steel)
  for dz in [-.235,.235]:box(Vector3(3.55,.845,z+dz),Vector3(.60,.18,.025),steel)
  cylinder(Vector3(3.55,.773,z),.042,.012,dark)
 tube(Vector3(3.23,.96,-2.39),Vector3(3.23,1.28,-2.39),.023,metal)
 tube(Vector3(3.23,1.28,-2.39),Vector3(3.57,1.28,-2.39),.023,metal)
 tube(Vector3(3.57,1.28,-2.39),Vector3(3.57,1.20,-2.39),.023,metal)
 # The corner, cooker and refrigerator meet along the rear wall.
 box(Vector3(4.03,.46,-4.43),Vector3(.30,.88,.78),white,true)
 box(Vector3(4.03,.93,-4.43),Vector3(.30,.06,.83),counter)
 box(Vector3(4.61,.47,-4.43),Vector3(.86,.94,.82),white,true)
 box(Vector3(4.61,.48,-4.008),Vector3(.70,.57,.018),dark)
 tube(Vector3(4.29,.76,-3.98),Vector3(4.93,.76,-3.98),.021,metal)
 box(Vector3(4.61,.96,-4.43),Vector3(.82,.025,.80),dark)
 for x in [4.4,4.82]:
  for z in [-4.63,-4.23]:cylinder(Vector3(x,.981,z),.14,.012,steel)
 for i in 4:ellipsoid(Vector3(4.32+i*.19,.87,-3.985),Vector3(.043,.043,.025),white)
 box(Vector3(5.3,.46,-4.43),Vector3(.52,.88,.78),white,true)
 box(Vector3(5.3,.93,-4.43),Vector3(.52,.06,.83),counter)
 box(Vector3(5.99,1.13,-4.39),Vector3(.86,2.26,.90),white,true)
 for y in [.74,1.52]:box(Vector3(5.66,y,-3.91),Vector3(.035,.28,.045),metal)
 box(Vector3(5.99,.94,-3.929),Vector3(.82,.018,.014),dark)
 box(Vector3(4.61,1.84,-4.5),Vector3(1,.17,.66),steel)
 box(Vector3(4.61,2.15,-4.66),Vector3(.40,.5,.28),steel)
 for z in [-1.48,-3.42]:
  box(Vector3(3.39,1.99,z),Vector3(.40,.75,.75),white)
  box(Vector3(3.61,1.99,z),Vector3(.025,.70,.70),white)
  tube(Vector3(3.64,1.75,z-.20),Vector3(3.64,1.96,z-.20),.01,metal)
 for z in range(13):
  for y in range(3):box(Vector3(3.183,1.09+y*.19,-1.08-z*.28),Vector3(.02,.18,.27),white)
 var pine=material(Color(.60,.40,.20),0,.65)
 get_parent().table(Vector3(5.75,0,-1.55),Vector2(1.05,1.35),pine,.76)
 get_parent().chair(Vector3(5.75,0,-.48),pine)
 # Everyday kitchen detail: draining rack, soap, board, jars and cup.
 box(Vector3(3.55,.982,-3.22),Vector3(.56,.03,.49),steel)
 for i in 7:tube(Vector3(3.30,1,-3.43+i*.065),Vector3(3.8,1,-3.43+i*.065),.008,metal)
 cylinder(Vector3(3.30,1.06,-1.76),.045,.18,material(Color(.28,.49,.42),0,.4))
 box(Vector3(3.55,.985,-1.42),Vector3(.47,.035,.42),pine)
 for i in 4:
  cylinder(Vector3(3.34,1.06,-3.73-i*.16),.05,.18,material(Color(.36+i*.07,.20,.08)))
  cylinder(Vector3(3.34,1.16,-3.73-i*.16),.054,.025,dark)
 cylinder(Vector3(5.75,.86,-1.35),.055,.14,white)
 box(Vector3(3.95,.66,-3.35),Vector3(.025,.39,.28),material(Color(.28,.42,.44),0,1))
