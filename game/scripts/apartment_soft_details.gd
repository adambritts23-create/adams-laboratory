extends "res://scripts/lab_props.gd"
# Static artificial ivy and gathered curtains: no wind movement indoors.
var leaf_mesh:Mesh

func build():
 name="WarmApartmentDetails";init_materials()
 green=material(Color(.13,.34,.075),0,.86).duplicate();green.cull_mode=BaseMaterial3D.CULL_DISABLED
 leaf_mesh=make_leaf()
 # Ivy above the low bedside mirror / wildlife frames and across the headboard wall.
 vine(Vector3(.16,2.55,2.5),Vector3(.16,2.55,4.72),Vector3.RIGHT,42)
 vine(Vector3(.17,2.48,4.72),Vector3(.17,1.55,4.77),Vector3.RIGHT,19)
 vine(Vector3(.16,2.50,2.50),Vector3(.16,1.8,2.42),Vector3.RIGHT,17)
 vine(Vector3(.25,1.67,4.86),Vector3(2.1,1.67,4.86),Vector3.FORWARD,36)
 # Short trailing tendrils bridge the bed corner without covering the photos.
 vine(Vector3(.16,2.55,4.62),Vector3(.58,2.55,4.86),Vector3(1,0,-1).normalized(),12)
 for gap in [Vector2(-3.3,-.55),Vector2(.55,1.7),Vector2(2,3.05),Vector2(3.35,4.55)]:
  var kitchen=gap.x<0
  tube(Vector3(6.27,2.52,gap.x-.13),Vector3(6.27,2.52,gap.y+.13),.018,dark)
  for edge in [gap.x,gap.y]:
   var centre=edge+(.045 if edge==gap.x else -.045)
   curtain(centre,.25 if kitchen else .21,.83 if kitchen else .30,2.47)
   for i in 5:
    var z=centre-.08+i*.04
    tube(Vector3(6.27,2.52,z),Vector3(6.27,2.45,z),.008,metal)
 # Shielded LED strips and low-intensity bounced red light, separate from the room lamps.
 var led=material(Color(.62,.006,.003),0,.8,1.5)
 box(Vector3(.115,2.62,3.58),Vector3(.028,.022,2.62),led)
 box(Vector3(4.04,1.23,4.88),Vector3(2.7,.018,.025),led)
 box(Vector3(3.7,1.22,.35),Vector3(1.37,.018,.026),led)
 for p in [Vector3(.45,2.38,3.6),Vector3(4,1.5,4.60),Vector3(3.7,1.35,.72)]:
  var glow=OmniLight3D.new();add_child(glow);glow.position=p;glow.light_color=Color(1,.035,.018);glow.light_energy=.19;glow.omni_range=2.3;glow.omni_attenuation=1.7;glow.shadow_enabled=false;glow.light_cull_mask=4|64|128
 # A shaded reading lamp gives the bedside a warm, recognisable light source.
 tube(Vector3(2.35,.08,4.65),Vector3(2.35,1.46,4.65),.014,brass)
 cylinder(Vector3(2.35,.055,4.65),.16,.06,dark)
 cylinder(Vector3(2.35,1.55,4.65),.19,.27,material(Color(.63,.35,.16),0,1),.13)
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=4
func make_leaf()->Mesh:
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 var points=[Vector3(0,.11,0),Vector3(-.064,.047,0),Vector3(-.073,-.012,0),Vector3(-.026,-.051,0),Vector3(0,-.031,0),Vector3(.026,-.051,0),Vector3(.073,-.012,0),Vector3(.064,.047,0)]
 for i in points.size():
  for v in [Vector3(0,.02,.02),points[i],points[(i+1)%points.size()]]:st.add_vertex(v)
 st.generate_normals();return st.commit()
func vine(a:Vector3,b:Vector3,normal:Vector3,count:int):
 var stem=material(Color(.065,.14,.035),0,1)
 var last=a
 for i in count+1:
  var t=float(i)/count;var p=a.lerp(b,t)+Vector3.UP*sin(t*TAU*2)*.035
  if i>0:tube(last,p,.007,stem)
  var leaf=MeshInstance3D.new();leaf.mesh=leaf_mesh;leaf.material_override=green;add_child(leaf)
  leaf.position=p+normal*.025+Vector3.UP*(.036 if i%2==0 else -.044)
  leaf.basis=Basis.looking_at(-normal,Vector3.UP);leaf.rotate_object_local(Vector3.FORWARD,sin(i*2.39)*.8);leaf.scale=Vector3.ONE*(.65+.28*(sin(i*1.7)+1))
  last=p
func curtain(z:float,width:float,bottom:float,top:float):
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for i in 24:
  for j in 12:
   for uv in [Vector2(i/24.0,j/12.0),Vector2((i+1)/24.0,j/12.0),Vector2((i+1)/24.0,(j+1)/12.0),Vector2(i/24.0,j/12.0),Vector2((i+1)/24.0,(j+1)/12.0),Vector2(i/24.0,(j+1)/12.0)]:
    var fold=sin(uv.x*TAU*4)*.035
    st.set_uv(uv);st.add_vertex(Vector3(6.24+fold,bottom+(top-bottom)*uv.y+.014*sin(uv.x*TAU*4)*(1-uv.y),z+(uv.x-.5)*width))
 st.generate_normals();var cloth=MeshInstance3D.new();cloth.mesh=st.commit();add_child(cloth)
 var mat=material(Color(.016,.019,.022),0,1).duplicate();mat.cull_mode=BaseMaterial3D.CULL_DISABLED;cloth.material_override=mat

