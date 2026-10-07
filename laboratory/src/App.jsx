import ReactionEngineering from './components/ReactionEngineering.jsx'
import DatabaseComparison from './components/DatabaseComparison.jsx'
import CalculationDatabasePicker from './components/CalculationDatabasePicker.jsx'
import { lazy, Suspense } from 'react'
import {ironCeriumExample} from './data/ironCeriumExample.js'
import DatabaseWorkspace from './components/DatabaseWorkspace.jsx'
import {emptyLibrary,compileLibrary,databaseCollections} from './thermodynamics/databaseLibrary.js'
import IntroPane from './components/IntroPane.jsx'
import {prepareArea} from './calculations/predominanceArea.js'
import {automaticBoundaries,normalizeAutomaticDefinition,boundaryComponents} from './calculations/automaticBoundaries.js'
import WetLab from './components/WetLab.jsx'
import {runClosedReagentCalculation} from './calculations/closedReagentSetup.js'
import {closedReagentExample} from './data/closedReagentExample.js'
import {runImposedEh} from './calculations/imposedEh.js'
import {FePhaseDisclosure} from './components/FePourbaixSetup.jsx'
import {prepareFeCandidate} from './analysis/prepareFeCandidate.js'
import {fePourbaixExample} from './data/fePourbaixExample.js'
import {publicFeSetupReason} from './calculations/fePublicSetup.js'
import {configurePourbaixDefinition,runUserPourbaix} from './calculations/userPourbaix.js'
import {redoxWorkflowExample} from './data/redoxWorkflowExample.js'
import {runPublicFePourbaix} from './calculations/publicFePourbaix.js'
import { independentSurfaceExample } from './data/surfaceExamples.js'
import { metalLigandSurfaceExample } from './data/metalLigandSurfaceExample.js'
import MnDiagnostic from './components/MnDiagnostic.jsx'
import { runIndependentSolubility, commitIndependentSolubility, solubilityPairs } from './calculations/independentSolubility.js'
import { magnesiumSolubilityExample, mixedCarbonateSolubilityExample } from './data/solubilityExample.js'
import { useReducer, useState, useMemo, useEffect } from 'react'
import ElementSelector from './components/ElementSelector.jsx'
import ReactionReview from './components/ReactionReview.jsx'
import SystemDefinition from './components/SystemDefinition.jsx'
import DatabaseSource from './components/DatabaseSource.jsx'
import ComponentSelector from './components/ComponentSelector.jsx'
import { getSystemCapabilities } from './chemistry/components.js'
import { thermodynamicRepository as demoRepository } from './thermodynamics/index.js'
import { solventElements, elementRemovalBlock } from './chemistry/system.js'
import { discoverReactionSet } from './thermodynamics/compatibility.js'
import { createWorkspaceSession, updateLaboratorySession } from './session/laboratorySession.js'
import CalculationWorkspace from './components/CalculationWorkspace.jsx'
import { validateChemicalSystem } from './chemistry/validation.js'
import { solverStatus } from './solver/contract.js'
import {constructEquilibrium} from './thermodynamics/equilibriumConstructor.js'
import { solvePoint } from './solver/point.js'
import { createSweepDefinition, runSweep } from './calculations/sweep.js'
import { composeUserChemistry } from './thermodynamics/userComponents.js'
import UserChemistry from './components/UserChemistry.jsx'
import SelectedSystem from './components/SelectedSystem.jsx'
import SystemReadiness from './components/SystemReadiness.jsx'
import { createLiveRun } from './calculations/liveRun.js'
import { createGridDefinition, runGrid } from './calculations/grid.js'
import { validateOutputRequest } from './calculations/outputDescriptors.js'
import { elementInteraction } from './chemistry/elementInteraction.js'
import './App.css'

const UpperFloor = lazy(() => import('./components/UpperFloor.jsx'))
const ISEExperiment = lazy(() => import('./components/ISEExperiment.jsx'))
const KFTitration = lazy(() => import('./components/KFTitration.jsx'))

export default function App() {
  const [diagnostic,setDiagnostic]=useState(false)
  const [active, setActive] = useState(null), [generation, setGeneration] = useState(0)
  const change = value => { setActive(value); setGeneration(n => n + 1) }
  return <div className="laboratory">
    <header><h1>Adam’s Laboratory</h1><span className="badge">Scientific workspace</span></header>
    <div>
    <DatabaseSource active={active} onLoad={change} onDemo={() => change(null)} />
    {!active&&<p className="demo-banner">Choose a database above, or start with explicit custom chemistry. Demo identities contain no equilibrium constants.</p>}
    <SystemBuilder key={generation} repository={active?.repository ?? demoRepository} />
    </div>
    {import.meta.env.DEV&&<details><summary>Development diagnostics</summary><button aria-pressed={diagnostic} onClick={()=>setDiagnostic(!diagnostic)}>Diagnostic Mn Pourbaix (internal)</button>{diagnostic&&<MnDiagnostic/>}</details>}
    <footer>User-selected Pourbaix: reference-validated or internally verified status is shown for each accepted calculation. Reviewed closed-reagent calculations have an explicit bounded scope. General closed chemistry requires an audited source network and explicit phase/gas scope. Nonideal closed models remain unsupported.</footer>
  </div>
}
function SystemBuilder({ repository: base }) {
  const [floorOpen,setFloorOpen]=useState(()=>new URLSearchParams(location.search).get('floor')==='upper'),[floorVisited,setFloorVisited]=useState(()=>new URLSearchParams(location.search).get('floor')==='upper')
  const [engineeringImport,setEngineeringImport]=useState(null)
  const [databaseBase,setDatabaseBase]=useState(base)
  const [library,setLibrary]=useState(emptyLibrary)
  const activeDatabases=useMemo(()=>databaseCollections(databaseBase,library).filter(c=>c.enabled>0),[databaseBase,library])
  const [databaseBlocked,setDatabaseBlocked]=useState(false)
  const [sourceGeneration,setSourceGeneration]=useState(0)
  const [elementNotice,setElementNotice]=useState(null)
  const [data, setData] = useState({ repository: base, componentRepository: base, records: [], components: [] })
  const [focus,setFocus]=useState(null),[context,setContext]=useState([]),[customOpen,setCustomOpen]=useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const repository = data.repository
  const [fePreparation,setFePreparation]=useState(null)
  useEffect(()=>{let current=true;prepareFeCandidate(repository).then(p=>{if(current)setFePreparation({repository,value:p})}).catch(()=>{if(current)setFePreparation({repository,value:null})});return ()=>{current=false}},[repository])
  const feReady=fePreparation?.repository===repository?fePreparation.value:null
  const [session, update] = useReducer((state, action) => action.type === 'comparisonResult' ? commitIndependentSolubility(state, action.result) : updateLaboratorySession(state, action, repository), repository, repo => {const initial=createWorkspaceSession(repo);return {...initial,visualizationState:{...initial.visualizationState,workspace:'intro'}}})
  const system = session.chemicalSystem
  const [exampleError, setExampleError] = useState(null)
  const loadRedox = label => {
    try {const example=redoxWorkflowExample(repository,label);invalidate();setPointFeedback(null);setExampleError(null);update({type:'loadExample',session:example,id:'redox-'+label,label:label+' Pourbaix'})}catch(e){setExampleError(e.message)}
  }
  const loadSolubility = (mixed = false) => {
    try {
      const example = mixed === 'iron-cerium' ? ironCeriumExample(repository) : mixed === 'closed-reagents' ? closedReagentExample(repository) : mixed === 'fe-pourbaix' ? fePourbaixExample(repository,feReady) : mixed === 'metal-ligand' ? metalLigandSurfaceExample(repository) : typeof mixed === 'string' ? independentSurfaceExample(repository, mixed === 'mixed-surface') : mixed ? mixedCarbonateSolubilityExample(repository) : magnesiumSolubilityExample(repository)
      invalidate(); setFeedback(null); setPointFeedback(null); setExampleError(null)
      setFocus(null);setContext([]);setElementNotice(null);setCustomOpen(false);setReviewOpen(false)
      update({ type: 'loadExample', session: example, id:String(mixed), label:mixed==='iron-cerium'?'Fe(II) / Ce(IV) closed equilibrium':mixed==='closed-reagents'?'Reviewed Fe(II)/H₂O₂ closed addition':mixed==='fe-pourbaix'?'Bounded Fe Pourbaix v1':mixed==='metal-ligand'?'Ni–ammonia response surface':mixed===true?'Ca–carbonate–Mg':mixed?'Carbonate response surface':'Mg hydroxide solubility' })
    } catch (error) { setExampleError(error.message) }
  }
  const [feedback, setFeedback] = useState(null)
  const [pointFeedback, setPointFeedback] = useState(null), [busy, setBusy] = useState(false)
  const [live] = useState(() => createLiveRun(async ({ snapshot, repo }, control) => {
    setBusy(true); setPointFeedback(null)
    try {
      if(snapshot.calculationDefinition.closedReagents){
        const result=await runClosedReagentCalculation(snapshot,repo,control)
        if(control.isCurrent()){if(result.ok)update({type:'closedReagentResult',result});else setPointFeedback({message:result.reason??'Closed reagent scope unavailable. No ordinary sweep was substituted.',diagnostics:result.diagnostics,revision:snapshot.revision})}
        return
      }
      if(snapshot.calculationDefinition.imposedEh){
        const result=await runImposedEh(snapshot,repo,control)
        if(control.isCurrent()){if(result.ok)update({type:'imposedEhResult',result});else setPointFeedback({message:result.reason??'Imposed-Eh preparation failed.',diagnostics:result.diagnostics,revision:snapshot.revision})}
        return
      }
      if(snapshot.calculationDefinition.pourbaix){
        const result=await runUserPourbaix(snapshot,repo,control)
        if(control.isCurrent()){if(result.ok)update({type:'userPourbaixResult',result});else setPointFeedback({message:result.reason??'Some requested points failed scientific checks; no classified map was accepted.',diagnostics:result.diagnostics,revision:snapshot.revision})}
        return
      }
      if(snapshot.calculationDefinition.publicFePourbaix==='fe-v1'){
        const result=await runPublicFePourbaix(snapshot,repo,control)
        if(control.isCurrent()){if(result.ok)update({type:'publicFeResult',result});else setPointFeedback({message:result.reason,revision:snapshot.revision})}
        return
      }
      if (snapshot.calculationDefinition.solubilityComparison) {
        const names=snapshot.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id)?.name)
        if(snapshot.calculationDefinition.solubilityComparison.pairs.some(p=>!names.includes(solubilityPairs.find(pair=>pair.id===p.id)?.component))) throw new Error('Select each comparison component in System before calculating.')
        const result = await runIndependentSolubility(repo, snapshot.calculationDefinition, snapshot.revision, control)
        if (control.isCurrent()) update({ type: 'comparisonResult', result })
        return
      }
      const inferredComponents=boundaryComponents(snapshot.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id)),repo)
      const inferred=automaticBoundaries(snapshot.calculationDefinition,inferredComponents,repo)
      if(inferred.reason){setPointFeedback({message:inferred.reason,revision:snapshot.revision});return}
      snapshot={...snapshot,calculationDefinition:normalizeAutomaticDefinition(snapshot.calculationDefinition,inferredComponents)}
      const gridMode=(snapshot.calculationDefinition.dimensions ?? snapshot.calculationDefinition.independentVariables.length)===2
      const prepared = inferred.redox?await prepareArea({...snapshot,calculationDefinition:{...snapshot.calculationDefinition,predominanceArea:{componentId:snapshot.visualizationState.plot?.componentId??snapshot.chemicalSystem.selectedComponents.find(id=>repo.getComponentById(id)?.role==='basis-choice'),interpretation:'carrier'}}},repo,{sweep:!gridMode}):await constructEquilibrium(repo,{adapter:'ordinary',session:snapshot,options:{sweep:!gridMode,grid:gridMode}})
      if (!control.isCurrent()) return
      if (!prepared.ok) { setPointFeedback({ message: prepared.reason??'New calculation preparation failed. Any retained plot shows its original conditions.', diagnostics: prepared.diagnostics, revision: snapshot.revision }); return }
      const plot = snapshot.visualizationState.plot ?? {}
      const outputCheck = validateOutputRequest(prepared.system, { type: ['total-fraction','aqueous-fraction'].includes(plot.type) ? plot.type : snapshot.calculationDefinition.mixedSolubility ? 'saturated-log-solubility' : plot.type ?? 'log-concentration', ...(['total-fraction','aqueous-fraction'].includes(plot.type) ? {} : snapshot.calculationDefinition.mixedSolubility ?? {}), componentId:plot.componentId, seriesId:plot.gridSeriesId, redoxQuantity:plot.redoxQuantity ?? 'pe' }, { requireSeries:gridMode, definition:snapshot.calculationDefinition })
      if (!outputCheck.ok) { setPointFeedback({ message:'Output preflight failed. No grid or sweep was started; retained results keep their original conditions.', diagnostics:outputCheck.diagnostics, revision:snapshot.revision }); return }
      const definition = await (gridMode?createGridDefinition:createSweepDefinition)(prepared.system, prepared.definition??snapshot.calculationDefinition, snapshot.revision)
      if (!control.isCurrent()) return
      if (!definition.ok) { setPointFeedback({ message: definition.status, diagnostics: definition.diagnostics, revision: snapshot.revision }); return }
      update({ type: gridMode?'beginGrid':'beginSweep', revision: snapshot.revision, systemId: prepared.system.id, system: prepared.system, ...(gridMode?{gridId:definition.grid.id}:{sweepId:definition.sweep.id}) })
      const result = await (gridMode?runGrid:runSweep)(prepared.system, gridMode?definition.grid:definition.sweep, control)
      if (control.isCurrent()) update({ type: gridMode?'gridResult':'sweepResult', result })
    } catch (error) { if (control.isCurrent()) setPointFeedback({ message: 'Calculation failed.', diagnostics: [{ code: 'sweep-error', message: error.message }], revision: snapshot.revision }) }
    finally { if (control.isCurrent()) setBusy(false) }
  }))
  useEffect(() => () => live.cancel(), [live])
  const invalidate = () => { live.cancel(); setBusy(false) }
  const reactionSet = useMemo(() => discoverReactionSet(repository, system), [repository, system])
  const implicit = useMemo(()=>solventElements(system, repository),[system,repository])
  const components = useMemo(()=>repository.getComponents(),[repository])
  const availableComponents = components.filter(c => c.role !== 'basis-choice' || c.associations.every(a => [...system.selectedElements, ...implicit].includes(a.element)))
  const dispatch = action => { if(action.type==='toggleElement')action={...action,type:'toggleSelectedElement'}; if(action.type==='toggleSelectedElement'){const block=elementRemovalBlock(system,action.symbol,repository);if(block){setElementNotice(block);return}if(system.selectedElements.includes(action.symbol))setFocus(null)} setElementNotice(null); invalidate(); setFeedback(null); setPointFeedback(null); update({ type: 'system', action }) }
  const review = () => { setReviewOpen(true); update({ type: 'workspace', workspace: 'system' }); requestAnimationFrame(() => document.getElementById('reaction-review')?.scrollIntoView({ block: 'start' })) }
  const changeRecords = (components, records) => {
    const next = composeUserChemistry(compileLibrary(databaseBase,library).repository, components, records)
    invalidate(); setData(next); setPointFeedback(null); setSourceGeneration(n=>n+1)
    update({ type: 'sources', repository: next.repository })
  }
  const changeLibrary = (nextLibrary,nextBase=databaseBase,clearCustom=false) => {
    const compiled=compileLibrary(nextBase,nextLibrary)
    const next=composeUserChemistry(compiled.repository,clearCustom?[]:data.components,clearCustom?[]:data.records)
    invalidate();setDatabaseBase(nextBase);setLibrary(nextLibrary);setData(next);setPointFeedback(null)
    setDatabaseBlocked(compiled.conflicts.some(c=>!c.winner));setSourceGeneration(n=>n+1)
    update({type:'sources',repository:next.repository})
  }
  const focusElement = symbol => {
    const interaction = elementInteraction(symbol,components,system.selectedElements,implicit)
    setFocus(symbol);setContext(previous=>previous.includes(symbol)?previous:[...previous,symbol])
    if(interaction.discover||system.selectedElements.includes(symbol)||implicit.includes(symbol)) dispatch({type:'toggleElement',symbol})
  }
  const reset = type => {setElementNotice(null);setExampleError(null);invalidate();setFeedback(null);setPointFeedback(null);update({type});if(type==='newSystem'){setFocus(null);setContext([]);setCustomOpen(false)}}
  const calculateSweep = () => { if(databaseBlocked)return; setBusy(true); live.schedule({ snapshot: session, repo: repository }, true) }
  const changeCalculation = (definition, plotPatch, { manual = false } = {}) => {
    invalidate(); setPointFeedback(null)
    const action = { type: 'calculation', definition }
    let next = updateLaboratorySession(session, action, repository)
    update(action)
    if (plotPatch) {
      const viewAction = { type: 'plotView', patch: plotPatch }
      next = updateLaboratorySession(next, viewAction, repository)
      update(viewAction)
    }
    if (!databaseBlocked && !manual && session.lastPlot && session.visualizationState.plot?.live !== false) { setBusy(true); live.schedule({ snapshot: next, repo: repository }) }
  }
  const calculatePoint = async () => {
    if(databaseBlocked)return
    const boundary=automaticBoundaries(session.calculationDefinition,boundaryComponents(session.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)),repository),repository)
    if(boundary.reason||boundary.electron.kind==='derived'){setPointFeedback({message:boundary.reason??'Use Plot diagram for closed composition. Each accepted sample supplies its exact equilibrium inspection.',revision:session.revision});return}
    if(session.calculationDefinition.closedReagents){setPointFeedback({message:'Use Plot diagram for the validated closed-reagent sweep. No ordinary fixed-point calculation was substituted.',revision:session.revision});return}
    setBusy(true); setPointFeedback(null)
    try {
      const prepared = await constructEquilibrium(repository,{adapter:'ordinary',session})
      if (!prepared.ok) {
        update({ type: 'pointFailure', revision: session.revision })
        setPointFeedback({ message: 'This definition is not ready for the restricted point solver.', diagnostics: prepared.diagnostics, revision: session.revision }); return
      }
      update({ type: 'beginPoint', revision: session.revision, systemId: prepared.system.id, inputId: prepared.input.id, system:prepared.system, input:prepared.input })
      const result = solvePoint(prepared.system, prepared.input)
      if (result.ok) update({ type: 'pointResult', result })
      else {
        update({ type: 'pointFailure', revision: session.revision })
        setPointFeedback({ message: 'No accepted point result. See scientific diagnostics.', diagnostics: [...result.diagnostics, ...result.attempts.flatMap(a => a.diagnostics ?? (a.code ? [{ code: a.code, message: a.message }] : []))], revision: session.revision })
      }
    } catch (error) {
      update({ type: 'pointFailure', revision: session.revision })
      setPointFeedback({ message: 'Preparation could not finish.', diagnostics: [{ code: 'preparation-error', message: error.message }], revision: session.revision })
    } finally { setBusy(false) }
  }
  const calculate = () => {
    const errors = validateChemicalSystem(system, repository)
    setFeedback({ errors, message: errors.length ? 'Review the system definition below. No calculation was performed.' : `Draft input checks passed. ${solverStatus.message}` })
  }
  return <><div className="database-active-strip"><span><strong>Calculation database:</strong> {activeDatabases.map(c=>c.name).join(' + ')||'None'}{databaseBlocked?' · Conflicts need review':''}</span><button onClick={()=>update({type:'workspace',workspace:'database'})}>Change databases</button></div><nav className="workspace-nav" aria-label="Laboratory workspaces"><button className="workspace-primary" aria-pressed={session.visualizationState.workspace === 'intro'} onClick={() => update({type:'workspace',workspace:'intro'})}>Intro</button><button className="workspace-primary" aria-pressed={session.visualizationState.workspace === 'database'} onClick={()=>update({type:'workspace',workspace:'database'})}>Database</button><button className="workspace-primary" aria-pressed={session.visualizationState.workspace === 'system'} onClick={() => {update({ type: 'workspace', workspace: 'system' })}}>System</button><button className="workspace-primary" aria-pressed={session.visualizationState.workspace === 'calculation'} onClick={() => {update({ type: 'workspace', workspace: 'calculation' })}}>Calculation</button><button className="workspace-primary" aria-pressed={session.visualizationState.workspace === 'wet-lab'} onClick={() => update({type:'workspace',workspace:'wet-lab'})}>Wet Lab</button><button className="workspace-primary" aria-pressed={session.visualizationState.workspace === 'engineering'} onClick={()=>update({type:'workspace',workspace:'engineering'})}>Reaction Engineering</button><button className="workspace-primary" aria-pressed={session.visualizationState.workspace === 'kf-titration'} onClick={() => update({type:'workspace',workspace:'kf-titration'})}>KF titration</button><button className="workspace-primary" aria-pressed={session.visualizationState.workspace === 'ise'} onClick={() => update({type:'workspace',workspace:'ise'})}>Fluoride ISE</button><button className="workspace-primary" onClick={()=>{setFloorVisited(true);setFloorOpen(true)}}>Explore Adam’s Lab</button><a className="workspace-primary" href={`${import.meta.env.BASE_URL}game/`} target="_blank" rel="noopener noreferrer">Play the game ↗</a><span className="nav-spacer"/><button className="workspace-secondary" onClick={()=>reset('newSystem')}>New system</button><button className="workspace-secondary" onClick={()=>reset('resetCalculation')}>Reset calculation</button></nav>
    <Suspense fallback={<p>Opening Adam’s Lab…</p>}>{floorVisited&&<UpperFloor systemPanel={<><h2>System · periodic table</h2><p>Select elements and component forms using the laboratory’s shared chemical system.</p>{elementNotice&&<p role="status">{elementNotice}</p>}<ElementSelector components={components} selected={system.selectedElements} implicit={implicit} focused={focus} onToggle={focusElement}/><section className="component-context"><h2>{focus?`Component forms · ${focus}`:'Choose component forms'}</h2><ComponentSelector components={focus?components.filter(c=>c.associations.some(a=>a.element===focus)||c.role!=='basis-choice'):availableComponents} discoveryElements={[...system.selectedElements,...implicit]} selected={system.selectedComponents} onToggle={id=>dispatch({type:'toggleComponent',id})}/></section><p>Selected elements: {system.selectedElements.join(', ')||'Water / solvent only'}</p></>} onSystem={()=>{setFloorOpen(false);update({type:"workspace",workspace:"system"})}} active={floorOpen} onClose={()=>setFloorOpen(false)} repository={repository} chemicalSystem={system}/>}</Suspense>
    <div>
    {['calculation','wet-lab','database','engineering'].includes(session.visualizationState.workspace)&&<CalculationDatabasePicker base={databaseBase} library={library} onChange={changeLibrary} onReview={()=>update({type:'workspace',workspace:'database'})}/>}
    {session.visualizationState.workspace==='calculation'&&!databaseBlocked&&<DatabaseComparison base={databaseBase} library={library} repository={repository} session={session}/>}
    <div hidden={session.visualizationState.workspace !== 'engineering'}><ReactionEngineering databaseName={activeDatabases.map(c=>c.name).join(' + ')} repository={repository} blocked={databaseBlocked} incoming={engineeringImport}/></div><div hidden={session.visualizationState.workspace !== 'wet-lab'}>{!databaseBlocked&&<WetLab active={session.visualizationState.workspace === 'wet-lab'} key={sourceGeneration} onSendToEngineering={state=>{setEngineeringImport({state,repository,databaseName:activeDatabases.map(c=>c.name).join(' + ')});update({type:'workspace',workspace:'engineering'})}} repository={repository} chemicalSystem={system} onSystem={()=>update({type:"workspace",workspace:"system"})}/>}</div>{session.visualizationState.workspace === 'ise' ? <Suspense fallback={<p role="status">Loading fluoride ISE…</p>}><ISEExperiment/></Suspense> : session.visualizationState.workspace === 'kf-titration' ? <Suspense fallback={<p role="status">Loading KF cell…</p>}><KFTitration/></Suspense> : session.visualizationState.workspace === 'database' ? <DatabaseWorkspace base={databaseBase} library={library} repository={data.componentRepository} onChange={changeLibrary} onReset={nextLibrary=>changeLibrary(nextLibrary,databaseBase,true)} onRestore={(newBase,newLibrary)=>changeLibrary(newLibrary,newBase)}/> : databaseBlocked ? <section className="card" role="alert">Resolve or disable conflicting database alternatives in the Database tab before calculating.<button onClick={()=>update({type:'workspace',workspace:'database'})}>Review database conflicts</button></section> : session.visualizationState.workspace === 'intro' ? <IntroPane onEnter={()=>update({type:'workspace',workspace:'system'})}/> : ['wet-lab','engineering'].includes(session.visualizationState.workspace) ? null : session.visualizationState.workspace === 'calculation' ? <CalculationWorkspace onIronCeriumExample={()=>loadSolubility('iron-cerium')} onClosedExample={()=>loadSolubility('closed-reagents')} onFeExample={()=>loadRedox('Fe')} onRedoxExample={loadRedox} feAvailable={!!feReady?.ok} onMetalLigandExample={()=>loadSolubility('metal-ligand')} onSurfaceExample={mixed=>loadSolubility(mixed?'mixed-surface':'carbonate-surface')} onMixedExample={()=>loadSolubility(true)} exampleError={exampleError} reactionSet={{...reactionSet,pourbaixReason:null}} onReview={review} session={session} repository={repository} onChange={changeCalculation} onView={patch => { if (patch.live === false) invalidate(); update({ type: 'plotView', patch }) }} onCalculate={calculatePoint} onSweep={calculateSweep} onCancel={() => { live.stop(); setBusy(false); setPointFeedback({ message: 'Calculation cancelled. Retained plots keep their original conditions.', revision: session.revision }) }} busy={busy} pointFeedback={pointFeedback?.revision === session.revision ? pointFeedback : null} /> : <main className="builder">
    <details className="system-extra"><summary>Load example…</summary><button disabled={!feReady?.ok} onClick={()=>loadRedox('Fe')}>Load Fe Pourbaix</button><button onClick={()=>loadRedox('Cu')}>Load Cu Pourbaix</button><button onClick={()=>loadRedox('U')}>Uranium readiness</button><button onClick={()=>loadSolubility()}>Load Mg(OH)₂ pH solubility example</button><button onClick={()=>loadSolubility(true)}>Load mixed Ca–carbonate–Mg solubility example</button><small> Replaces setup · Mg-only uses one crystalline solid; mixed Ca–carbonate–Mg explicitly enables the audited multi-solid system. Unsaturated samples remain gaps.</small>{exampleError&&<p role="alert">{exampleError}</p>}</details>
    {elementNotice&&<p role="alert">{elementNotice}</p>}
    <ElementSelector electron={components.find(c=>c.role==='electron')} electronSelected={components.some(c=>c.role==='electron'&&system.selectedComponents.includes(c.id))} onElectron={id=>dispatch({type:'toggleComponent',id})} components={components} selected={system.selectedElements} implicit={implicit} focused={focus} onToggle={focusElement} />
    <section className="component-context"><h2>{focus?`Component forms · ${focus}`:'Choose component forms'}</h2>
      {focus&&!components.some(c=>c.associations.some(a=>a.element===focus))&&<p role="status">No component data for {focus} in the current database. You can define custom chemistry explicitly.</p>}
      <button onClick={()=>setCustomOpen(true)}>Define custom chemistry…</button>
      <ComponentSelector components={focus?components.filter(c=>c.associations.some(a=>a.element===focus)||c.role!=='basis-choice'):availableComponents} discoveryElements={[...system.selectedElements,...implicit]} selected={system.selectedComponents} onToggle={id => dispatch({ type: 'toggleComponent', id })} />
      <small>Click an element to select or remove it. Choose a component form explicitly; removing an element removes its forms and incompatible species.</small>
    </section>
    {session.calculationDefinition.publicFePourbaix==='fe-v1'?<section className="system-extra"><h2>Bounded Fe canonical reaction set</h2><p>{publicFeSetupReason(session,feReady)??'19 Fe carriers · 7 included solid candidates · one total Fe inventory across all oxidation states.'}</p><FePhaseDisclosure/></section>:<SelectedSystem system={system} repository={repository} onRemove={dispatch} reactionSet={reactionSet} onReview={review}/>}
    <details className="system-extra" open={customOpen}><summary onClick={event=>{event.preventDefault();setCustomOpen(!customOpen)}}>Custom chemistry · USER-DEFINED / UNVERIFIED</summary>{customOpen&&<UserChemistry base={compileLibrary(databaseBase,library).repository} data={data} context={context} onChange={changeRecords}/>}</details>
    <details hidden={session.calculationDefinition.publicFePourbaix==='fe-v1'} id="reaction-review" className="system-extra" open={reviewOpen}><summary onClick={e => { e.preventDefault(); setReviewOpen(!reviewOpen) }}>Review reaction set · {reactionSet.selectedSpecies.length} included</summary>{reviewOpen && <ReactionReview reactionSet={reactionSet} onToggle={id => dispatch({ type: 'toggleSpecies', id })}/>}</details>
    {session.calculationDefinition.publicFePourbaix==='fe-v1'?<button onClick={()=>update({type:'workspace',workspace:'calculation'})}>Continue to calculation</button>:<><button disabled={!system.selectedElements.length} onClick={()=>{changeCalculation(configurePourbaixDefinition(session.calculationDefinition),{type:'pourbaix'},{manual:true});update({type:'workspace',workspace:'calculation'})}}>Set up Pourbaix / pH–Eh</button><p>Select an element, then set up Pourbaix. Its redox forms are discovered automatically.</p><SystemReadiness session={session} repository={repository} onContinue={()=>update({type:'workspace',workspace:'calculation'})}/></>}
    <details className="system-extra"><summary>Advanced system settings</summary><SystemDefinition calculationManaged system={system} capabilities={getSystemCapabilities(system, repository)} phases={repository.getPhases()} solvent={repository.getSpeciesById(system.solvent.speciesId)} dispatch={dispatch} calculate={calculate} feedback={feedback} /></details>
  </main>}</div></>
}

