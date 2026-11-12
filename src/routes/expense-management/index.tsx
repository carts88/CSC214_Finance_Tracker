import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/expense-management/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/expense-management/"!</div>
}
