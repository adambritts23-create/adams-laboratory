import test from 'node:test'
import assert from 'node:assert/strict'
import gestures from '../src/components/usePlotGestures.js'
import {selectionReducer} from '../src/plots/resultSelection.js'
import {nearestIndex} from '../src/plots/geometry.js'
function harness(count=3){
 let selection={pinned:0,hover:null}
 const view=Object.freeze({xMin:0,xMax:14,yMin:0,yMax:1})
 const handlers=()=>gestures({count,pinned:selection.pinned,sample:e=>nearestIndex([0,7,14],e.clientX/200*14),preview:i=>selection=selectionReducer(selection,i===null?{type:'leave'}:{type:'hover',index:i,count}),pin:i=>selection=selectionReducer(selection,{type:'pin',index:i,count})})
 return {handlers,view,selection:()=>selection,event:(x,extra={})=>({clientX:x,pointerType:'mouse',preventDefault(){},...extra})}
}
test('shared fixed plot previews exact samples, pins clicked samples and restores selection on leave',()=>{
 const h=harness();h.handlers().onPointerMove(h.event(100));assert.deepEqual(h.selection(),{pinned:0,hover:1})
 h.handlers().onClick(h.event(100));assert.deepEqual(h.selection(),{pinned:1,hover:null})
 h.handlers().onPointerMove(h.event(200));assert.equal(h.selection().hover,2)
 h.handlers().onPointerLeave();assert.deepEqual(h.selection(),{pinned:1,hover:null})
 h.handlers().onPointerMove(h.event(0,{pointerType:'touch'}));assert.equal(h.selection().hover,null)
})
test('fixed plot has no drag/wheel zoom and keys navigate exact samples with bounded endpoints',()=>{
 const h=harness(),before={...h.view};assert.equal(h.handlers().onWheel,undefined);assert.equal(h.handlers().onPointerDown,undefined)
 for(const key of ['ArrowRight','End','ArrowRight'])h.handlers().onKeyDown(h.event(0,{key}))
 assert.equal(h.selection().pinned,2)
 for(const key of ['ArrowLeft','Home','ArrowLeft'])h.handlers().onKeyDown(h.event(0,{key}))
 assert.equal(h.selection().pinned,0)
 for(const key of ['+','-','ArrowUp','ArrowDown'])h.handlers().onKeyDown(h.event(0,{key}))
 assert.deepEqual(h.view,before);assert.equal(h.selection().pinned,0)
 h.handlers().onPointerMove(h.event(200));h.handlers().onBlur();assert.equal(h.selection().hover,null)
})
test('empty fixed plots ignore click and keyboard selection',()=>{
 const h=harness(0);h.handlers().onClick(h.event(100));h.handlers().onKeyDown(h.event(0,{key:'End'}));assert.equal(h.selection().pinned,0)
})
