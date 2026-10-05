import { useEffect, useRef } from 'react'
import markup from '../kf/cell.html?raw'
import { mountKFCell } from '../kf/cell.js'
import './KFTitration.css'
export default function KFTitration({onModel} = {}) {
  const host = useRef(null)
  useEffect(() => {
    const container = host.current
    container.innerHTML = markup
    let dispose
    try { dispose = mountKFCell(container.querySelector('#kf-cell'),{onModel}) }
    catch (error) {
      const status = container.querySelector('#kf-loading')
      status.hidden = false
      status.textContent = `The 3D cell could not start: ${error.message}`
    }
    return () => { dispose?.(); container.replaceChildren() }
  }, [onModel])
  return <section className="kf-workspace" aria-label="KF apparatus"><div ref={host}/></section>
}
