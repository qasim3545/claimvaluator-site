/** Responsive WebP image from the media library (no client JavaScript). */
export function Img({ media, sizes = '(min-width: 1024px) 760px, 100vw', priority = false, className }: { media: any; sizes?: string; priority?: boolean; className?: string }) {
  if (!media || typeof media !== 'object' || !media.url) return null
  const s = media.sizes || {}
  const srcSet = ['thumbnail', 'card', 'wide']
    .map((k) => (s[k]?.url && s[k]?.width ? `${s[k].url} ${s[k].width}w` : null))
    .filter(Boolean)
    .concat(media.width ? [`${media.url} ${media.width}w`] : [])
    .join(', ')
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={s.wide?.url || media.url}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      width={media.width || undefined}
      height={media.height || undefined}
      alt={media.alt || ''}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  )
}
