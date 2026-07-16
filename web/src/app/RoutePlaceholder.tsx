export function RoutePlaceholder({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return <section className="page-placeholder"><p className="page-placeholder__kicker">{kicker}</p><h1>{title}</h1><p>{description}</p></section>
}
