extends RefCounted
static var meshes={}
static func species(kind:int,variant:int=1,lod:int=0)->Array:
 var key=Vector3i(kind,variant,lod)
 if meshes.has(key):return meshes[key]
 var thickness=[.62,1.0,1.6][clampi(variant,0,2)]
 var rng=RandomNumberGenerator.new();rng.seed=617+kind*87+variant*139
 var timber=SurfaceTool.new();timber.begin(Mesh.PRIMITIVE_TRIANGLES)
 var leaves=SurfaceTool.new();leaves.begin(Mesh.PRIMITIVE_TRIANGLES)
 var author=preload("res://scripts/tree_geometry.gd")
 var height=10.5 if kind==0 else 12.5 if kind==1 else 13.0
 var radius=(.18 if kind==0 else .27)*thickness
 # Wider root flare and an independently varied trunk, without stretching the crown.
 author.tube_mesh(timber,Vector3.ZERO,Vector3(.015,.85,0),radius*1.18,radius*.91)
 author.tube_mesh(timber,Vector3(.015,.85,0),Vector3(.15,height,0),radius*.91,.025)
 var count=16 if kind==0 else 128 if kind==1 else 24
 for i in count:
  if i%[1,2,4][lod]!=0:continue
  var angle=i*2.399+rng.randf_range(-.15,.15)
  var y=3.0+i*.42 if kind==0 else .55+float(i/8)*.76 if kind==1 else 7.2+float(i/6)*1.3
  if kind==1 and i%17==variant*3:continue
  if kind==1:y+=rng.randf_range(-.22,.22)
  var crown=clampf((height-y)/3.0,.12,1.0) if kind==1 else 1.0
  var reach=(2.4 if kind==0 else (1.-y/height)*3.8 if kind==1 else 3.2)*rng.randf_range(.55,1.3)*(1.0+.16*sin(angle*2.+variant))
  var base=Vector3(.1,y,0);var tip=base+Vector3(cos(angle)*reach,.7 if kind==0 else -minf(y*.55,.25+(1.-y/height)*1.1) if kind==1 else 1.15,sin(angle)*reach)
  if kind==1:
   var knee=base.lerp(tip,.45)+Vector3.UP*.3
   author.tube_mesh(timber,base,knee,.065*sqrt(thickness),.025)
   author.tube_mesh(timber,knee,tip,.025,.005)
  else:author.tube_mesh(timber,base,tip,(.035 if kind==0 else .065)*sqrt(thickness),.006)
  for j in (7 if kind==0 else 9):
   if j%[1,2,3][lod]!=0:continue
   var c=base.lerp(tip,(.04+j*.105) if kind==1 else (.3+j*.09))
   if kind==1:c.y+=sin((.04+j*.105)*PI)*.3
   var side=Vector3(-sin(angle),0,cos(angle))*(1.-j/12.0)*(.65 if kind==0 else .55)*crown
   for sign_value in [-1,1]:
    var end=c+side*sign_value+Vector3(0,-.35 if kind==0 else -.15-(1.-y/height)*.45 if kind==1 else -.14,0)
    author.tube_mesh(timber,c,end,.012,.003)
    for k in (14 if kind==0 else 22 if kind==1 else 10):
     if k%[1,2,4][lod]!=0:continue
     var q=c.lerp(end,rng.randf())+Vector3(rng.randf_range(-.20,.20),rng.randf_range(-.38,.28) if kind==1 else rng.randf_range(-.18,.18),rng.randf_range(-.20,.20))
     var tint=Color(.16,.38,.075).lerp(Color(.42,.57,.16),rng.randf()) if kind==0 else Color(.045,.20,.065).lerp(Color(.19,.36,.095),rng.randf())
     var yaw=rng.randf()*TAU;var u=Vector3(cos(yaw),.25,sin(yaw))*(.065 if kind==0 else .25 if kind==1 else .17)*crown
     var v=Vector3(-sin(yaw),.35,cos(yaw))*(.043 if kind==0 else .10 if kind==1 else .065)*crown
     u*=[1.0,1.9,3.2][lod];v*=[1.0,1.9,3.2][lod]
     for point in [q-u,q+v,q+u,q-u,q+u,q-v]:leaves.set_color(tint);leaves.add_vertex(point)
 # Pine's exposed lower trunk carries a few bare, broken limbs.
 if kind==2:
  for i in 5:
   var a=i*2.399;var p=Vector3(0,3+i*.65,0)
   author.tube_mesh(timber,p,p+Vector3(cos(a)*.65,.18,sin(a)*.65),.05,.006)
 timber.generate_normals();leaves.generate_normals()
 var wood=timber.commit();var canopy=leaves.commit()
 var bark=ShaderMaterial.new();bark.shader=preload("res://materials/nordic_bark.gdshader");bark.set_shader_parameter("species",kind);wood.surface_set_material(0,bark)
 var leaf=ShaderMaterial.new();leaf.shader=preload("res://materials/outdoor_foliage.gdshader");canopy.surface_set_material(0,leaf)
 meshes[key]=[wood,canopy];return meshes[key]
