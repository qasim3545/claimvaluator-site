import { ToolGroups } from '@/site/Directory'

export default function NotFound() {
  return (
    <>
      <div className="wrap notfound">
        <h1>This page is not here</h1>
        <p className="lead">The address may have a typo, or the page may have moved. These calculators are a good place to start.</p>
        <p>
          <a className="cv-btn" href="/">Go to the home page</a>
        </p>
      </div>
      <div className="wrap" style={{ paddingBottom: 64 }}>
        <ToolGroups />
      </div>
    </>
  )
}
