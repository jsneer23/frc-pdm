import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/onshape')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/onshape"!</div>
}
