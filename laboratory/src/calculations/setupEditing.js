/** UI definition edits only; preserve unedited controls and scientific precision. */
export const editFixedCondition=(definition,condition)=>({...definition,componentConditions:definition.componentConditions.map(c=>c.componentId===condition.componentId?condition:c)})
export const editAxis=(definition,index,patch)=>({...definition,independentVariables:definition.independentVariables.map((a,i)=>i===index?{...a,...patch}:a)})
