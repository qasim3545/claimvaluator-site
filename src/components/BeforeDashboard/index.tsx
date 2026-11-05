import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { SetupContent } from './SetupContent'
import './index.scss'

const baseClass = 'before-dashboard'

const links: [string, string][] = [
  ['Write a blog post', '/admin/collections/posts/create'],
  ['Edit a calculator page', '/admin/collections/tools'],
  ['Edit a state guide', '/admin/collections/states'],
  ['Edit a state calculator page', '/admin/collections/state-pages'],
  ['Class-action tracker', '/admin/collections/settlements'],
  ['Leads inbox', '/admin/collections/leads'],
  ['Menus', '/admin/globals/header'],
  ['Redirects', '/admin/collections/redirects'],
  ['Site settings', '/admin/globals/site-settings'],
]

const BeforeDashboard: React.FC = () => (
  <div className={baseClass}>
    <Banner className={`${baseClass}__banner`} type="success">
      <h4>ClaimValuator editor</h4>
    </Banner>
    <SetupContent />
    <ul className={`${baseClass}__instructions`}>
      {links.map(([label, href]) => (
        <li key={href}>
          <a href={href}>{label}</a>
        </li>
      ))}
    </ul>
    <p>
      Every page keeps its old WordPress address. If you ever change a slug, add a 301 in Redirects so
      the old address keeps working.
    </p>
  </div>
)

export default BeforeDashboard
