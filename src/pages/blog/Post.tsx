import { Navigate, useParams } from 'react-router-dom'
import { BlogDocument } from '@/components/landing/BlogDocument'
import { getBlogPost } from '@/lib/blog/posts'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const meta = getBlogPost(slug)

  if (!meta) return <Navigate to="/blog" replace />

  return <BlogDocument meta={meta} />
}
