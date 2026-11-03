import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

import { Banner } from '../blocks/Banner/config'
import { MediaBlock } from '../blocks/MediaBlock/config'

/** Puts a working calculator inside any article or page. */
export const CalculatorEmbed: Block = {
  slug: 'calculatorEmbed',
  interfaceName: 'CalculatorEmbedBlock',
  labels: { singular: 'Calculator', plural: 'Calculators' },
  fields: [
    { name: 'tool', type: 'relationship', relationTo: 'tools', required: true },
    { name: 'state', type: 'relationship', relationTo: 'states', admin: { description: 'Optional: lock it to one state.' } },
  ],
}

/** A boxed note: key takeaway, warning or tip. */
export const Callout: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  fields: [
    { name: 'style', type: 'select', defaultValue: 'note', options: ['note', 'warning', 'takeaway'].map((v) => ({ label: v, value: v })) },
    { name: 'title', type: 'text' },
    { name: 'text', type: 'textarea', required: true },
  ],
}

/** A simple table typed as rows of cells (first row is the header). */
export const TableBlock: Block = {
  slug: 'table',
  interfaceName: 'TableBlock',
  fields: [
    { name: 'caption', type: 'text' },
    { name: 'csv', type: 'textarea', required: true, admin: { description: 'One row per line, cells separated by | . First line is the header.' } },
  ],
}

export const articleEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BlocksFeature({ blocks: [MediaBlock, Banner, Callout, TableBlock, CalculatorEmbed] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
    HorizontalRuleFeature(),
  ],
})
