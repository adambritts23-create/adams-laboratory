shader_type spatial;
uniform vec4 paint : source_color=vec4(.6,.2,.12,1);
uniform int kind=0;
varying vec3 world;
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1)).xyz;}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void fragment(){
 float grain=hash(floor(world.xz*280.0));
 if(kind==0){
  ALBEDO=vec3(.075,.081,.083)*(0.85+.30*grain);
  float wear=sin(world.x*.6+world.z*.027)*sin(world.z*.071)*.035;
  ALBEDO+=vec3(wear);ROUGHNESS=.88;SPECULAR=.22;
 }else if(kind==1){
  float boards=abs(sin((world.x+world.z)*16.0));
  float seam=smoothstep(.025,.10,boards);
  float weather=.91+.07*sin(world.y*3.0+sin(world.x*23.0))+grain*.03;
  ALBEDO=paint.rgb*weather*mix(.55,1.0,seam);ROUGHNESS=.83;
 }else if(kind==2){
  float rows=fract(world.y*4.0);float tile=fract((world.x+world.z)*3.3+floor(world.y*4.0)*.5);
  float seam=smoothstep(.0,.065,rows)*smoothstep(.0,.05,tile);
  ALBEDO=paint.rgb*(.75+grain*.25)*mix(.45,1.0,seam);ROUGHNESS=.88;
 }else{
  float corrugation=.85+.15*sin((world.x+world.z)*22.0);
  ALBEDO=paint.rgb*corrugation;ROUGHNESS=.65;METALLIC=.28;
 }
}
