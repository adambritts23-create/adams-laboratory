import {isPublicFeResult} from '../calculations/publicFePourbaix.js'
import {fePourbaixCandidate} from '../analysis/fePourbaixContract.js'
import {pourbaixPlotBox,pourbaixSampleIndex,pourbaixKeyboardIndex,pourbaixRepresentatives,pourbaixSvg} from './pourbaixView.js'
export const feRegionStyles={0:{label:'Fe(0)',color:'#465260'},2:{label:'Fe(II)',color:'#237b9a'},3:{label:'Fe(III)',color:'#ab7538'},6:{label:'Fe(VI)',color:'#7854aa'}}
export const feView={element:'Fe',yTicks:[-1,-0.5,0,0.5,1,1.2],styles:feRegionStyles,anchors:{0:[7,-0.9],2:[1.5,0],3:[8,0.25],6:[12.5,1.12]}}
export const fePlotBox=pourbaixPlotBox
export const feSampleIndex=(pH,Eh)=>pourbaixSampleIndex(fePourbaixCandidate,pH,Eh)
export const feKeyboardIndex=(index,key)=>pourbaixKeyboardIndex(fePourbaixCandidate,index,key)
export const feRepresentatives=result=>isPublicFeResult(result)?pourbaixRepresentatives(result.pourbaix,feView):{}
export const fePourbaixSvg=(result,index,revision)=>isPublicFeResult(result)?pourbaixSvg(result.pourbaix,index,revision,feView):''
