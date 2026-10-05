import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const ui=fs.readFileSync('src/components/WetLab.jsx','utf8'),css=fs.readFileSync('src/components/WetLab.css','utf8')
test('primary action precedes builders and secondary presets are disclosed',()=>{
 assert.ok(ui.indexOf('className="wet-setup-header"')<ui.indexOf('className="wet-apparatus-editor"'))
 assert.equal((ui.match(/onClick=\{prepare\}/g)||[]).length,1)
 assert.match(ui,/<details className="wet-presets"><summary>Examples \/ presets<\/summary>/)
 assert.match(ui,/<summary>Advanced chemistry scope<\/summary>/)
 assert.match(css,/\.wet-setup-header\{position:sticky/)
})
test('action exposes real admission reason and only admission failure blocks it',()=>{
 assert.match(ui,/aria-describedby=\{'wet-prepare-status-'\+mode\} disabled=\{busy\|\|!flight\|\|flight.status==='UNAVAILABLE'\}/)
 assert.match(ui,/flight\?\.status==='UNAVAILABLE'\?flight.reason/)
 assert.doesNotMatch(ui,/disabled=\{[^}]*balanced/)
 assert.match(ui,/error\|\|preview.error/)
})
test('only successful preparation requests results focus; cached selections do not',()=>{
 assert.match(ui,/engineRef.current=engine;focusResults.current=true;setReady/)
 assert.match(ui,/if\(data&&focusResults.current\)/)
 assert.match(ui,/ref=\{resultsRef\} tabIndex=\{-1\}/)
 const apply=ui.slice(ui.indexOf('function apply('),ui.indexOf('async function setVolume'))
 assert.doesNotMatch(apply,/focusResults|scrollIntoView/)
})
