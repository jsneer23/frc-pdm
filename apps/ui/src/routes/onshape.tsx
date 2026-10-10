import { createFileRoute } from '@tanstack/react-router'
import { PartRequestForm } from '../features/parts/PartRequestForm'

export const Route = createFileRoute('/onshape')({
  component: OnshapePanel,
})


function OnshapePanel() {
  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-4">New Part Request</h1>
      <PartRequestForm />
    </div>
  )
}