import {
  type DefaultNodeTypes,
  type SerializedBlockNode,
  type SerializedLinkNode,
} from '@payloadcms/richtext-lexical'
import { type JSXConvertersFunction, LinkJSXConverter, RichText } from '@payloadcms/richtext-lexical/react'
import React from 'react'

import { docPath } from '@/utilities/paths'
import { CalcBlock, EngineScripts, StatesData } from './CalcBlock'
import { Img } from './Img'
import { hasLexical, lexicalText, prepareHtml, slugify } from './text'

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<any>

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  return typeof value === 'object' ? docPath(relationTo, value as any) : '/'
}

function TableFromText({ csv, caption }: { csv: string; caption?: string }) {
  const rows = csv
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => r.split('|').map((c) => c.trim()))
  if (!rows.length) return null
  const [head, ...body] = rows
  return (
    <div className="tablewrap">
      <table>
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {head.map((c, i) => (
              <th key={i} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const converters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  heading: ({ node, nodesToJSX }) => {
    const Tag = node.tag as 'h2'
    const id = node.tag === 'h2' || node.tag === 'h3' ? slugify(lexicalText(node)) : undefined
    return <Tag id={id}>{nodesToJSX({ nodes: node.children })}</Tag>
  },
  upload: ({ node }) => (
    <figure>
      <Img media={(node as any).value} />
    </figure>
  ),
  blocks: {
    mediaBlock: ({ node }: any) => (
      <figure>
        <Img media={node.fields.media} />
        {node.fields.media?.caption ? (
          <figcaption>
            <RichText data={node.fields.media.caption} disableContainer />
          </figcaption>
        ) : null}
      </figure>
    ),
    banner: ({ node }: any) => (
      <div className={`callout callout--${node.fields.style === 'warning' || node.fields.style === 'error' ? 'warning' : 'note'}`}>
        <RichText data={node.fields.content} disableContainer />
      </div>
    ),
    callout: ({ node }: any) => (
      <div className={`callout callout--${node.fields.style || 'note'}`}>
        {node.fields.title ? <p className="callout__title">{node.fields.title}</p> : null}
        <p>{node.fields.text}</p>
      </div>
    ),
    table: ({ node }: any) => <TableFromText csv={node.fields.csv || ''} caption={node.fields.caption} />,
    calculatorEmbed: ({ node }: any) => {
      const tool = node.fields.tool
      const state = node.fields.state
      const slug = typeof tool === 'object' ? tool?.slug : null
      return slug ? <CalcBlock toolSlug={slug} stateSlug={typeof state === 'object' ? state?.slug : null} /> : null
    },
  },
})

/** Rich text written in the editor, or migrated WordPress HTML when the editor field is empty. */
export function Prose({ data, legacyHtml, className = 'prose' }: { data?: any; legacyHtml?: string | null; className?: string }) {
  if (hasLexical(data)) {
    return (
      <div className={className}>
        <RichText data={data} converters={converters} disableContainer />
      </div>
    )
  }
  if (legacyHtml && legacyHtml.trim()) {
    const needsEngine = /data-cv-(calc|picker|filter|toolsearch)/.test(legacyHtml)
    return (
      <>
        <div className={className} dangerouslySetInnerHTML={{ __html: prepareHtml(legacyHtml).html }} />
        {needsEngine ? (
          <>
            <StatesData />
            <EngineScripts />
          </>
        ) : null}
      </>
    )
  }
  return null
}
