import { useState } from 'react'

/** Decorative companion only; deliberately has no scientific state or callbacks. */
export default function ObserverPortrait() {
  const [failed, setFailed] = useState(false)
  return <figure className="observer-portrait" aria-label="Adam observing the laboratory">
    {failed ? <span>Adam’s Laboratory</span> : <img src={`${import.meta.env.BASE_URL}artwork/adam-observer.png`} alt="Adam seated, looking toward the laboratory workspace" onError={() => setFailed(true)}/>}
    <figcaption>Adam’s Laboratory</figcaption>
  </figure>
}
