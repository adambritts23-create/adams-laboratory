/** Browser smoke for the local app. Call with the CUA tab.playwright handle after database load.
 * Starts from the default H+/water System and default analytical Wet Lab setup.
 * Deliberately uses visible UI only; never invokes a solver or edits application state.
 */
export async function strongAnalyticalWetLabSmoke(page){
 await page.getByRole('button',{name:'Wet Lab',exact:true}).click()
 await page.getByRole('button',{name:'Prepare experiment',exact:true}).click()
 await page.getByRole('combobox',{name:'Calculated sample',exact:true}).waitFor({state:'visible',timeoutMs:60000})
 const samples=page.getByRole('combobox',{name:'Calculated sample',exact:true})
 if(await samples.getByRole('option').count()!==107)throw new Error('Expected 107 calculated samples')
 const labels=await samples.getByRole('option').allTextContents()
 if(labels.some(x=>/unavailable/i.test(x)))throw new Error('Strong control contains a gap')
 await samples.selectOption({label:'50.00 mL · pH 7.00075'})
 const result=await page.getByRole('region',{name:'Titration results',exact:true}).innerText()
 if(!result.includes('7.00075'))throw new Error('Selected equivalence sample mismatch')
 return {samples:107,equivalencePH:7.00075}
}
