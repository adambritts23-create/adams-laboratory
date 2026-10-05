import AdamMedia from './AdamMedia.jsx'
export default function IntroPane({onEnter}) {
 return <main className="intro-pane" aria-label="Introduction to Adam’s Laboratory">
  <img className="intro-laboratory-art" src={import.meta.env.BASE_URL+'artwork/laboratory-intro.png'} width="2454" height="1224" alt="Adam’s Chemical Software Laboratory — Nuclear Night Shift. Complete wide laboratory artwork with Adam, the central burette and beaker, and laboratory details on both sides."/>
  <button className="intro-enter" onClick={onEnter}>Enter laboratory →</button>
  <div className="intro-photo-gallery"><AdamMedia media={{image:'artwork/adam-portrait.png',portrait:true,title:'Adam portrait',alt:'Adam wearing sunglasses beside a stone wall',caption:'Image supplied by Adam.'}}/><AdamMedia media={{image:'artwork/adam-studio.png',portrait:true,controlLabel:'Open Adam studio portrait',title:'Adam studio portrait',alt:'Adam seated in a green shirt against a dark background',caption:'Studio portrait supplied by Adam.'}}/><AdamMedia media={{image:'artwork/adam-laboratory-team.png',controlLabel:'Open laboratory photograph',title:'Adam’s Laboratory',alt:'Two men in white protective coveralls in an industrial laboratory',caption:'Image supplied by Adam.'}}/><AdamMedia media={{image:'artwork/adam-nuclear-night-shift.png',controlLabel:'Open Nuclear Night Shift poster',title:'Nuclear Night Shift',alt:'Nuclear Night Shift poster featuring two men in protective coveralls in a laboratory',caption:'Artwork supplied by Adam.'}}/></div>
 </main>
}
