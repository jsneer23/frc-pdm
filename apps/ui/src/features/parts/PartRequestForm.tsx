// src/features/parts/PartRequestForm.tsx
import { useState } from 'react'
import { MACHINES, MATERIALS, type MachineId, type MaterialId } from './constants'

export function PartRequestForm() {
  const [machine, setMachine] = useState<MachineId>('co2_laser')
  const [material, setMaterial] = useState<MaterialId | ''>('')
  const [thickness, setThickness] = useState('')
  const [quantity, setQuantity] = useState('1')

  // Derived. Not state.
  const machineDef = MACHINES[machine]
  const availableMaterials = machineDef.materials

  function handleMachineChange(next: MachineId) {
    setMachine(next)
    // Clear the material if the new machine cannot use it.
    const stillValid = MACHINES[next].materials.includes(material as never)
    if (!stillValid) setMaterial('')
  }

  return (
    <form className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span>Machine</span>
        <select
          value={machine}
          onChange={(e) => handleMachineChange(e.target.value as MachineId)}
        >
          {Object.entries(MACHINES).map(([id, def]) => (
            <option key={id} value={id}>{def.label}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span>Material</span>
        <select
          value={material}
          onChange={(e) => setMaterial(e.target.value as MaterialId)}
        >
          <option value="">Select a material</option>
          {availableMaterials.map((id) => (
            <option key={id} value={id}>{MATERIALS[id]}</option>
          ))}
        </select>
      </label>

      {machineDef.needsThickness && (
        <label className="flex flex-col gap-1">
          <span>Thickness (in)</span>
          <input
            type="number"
            step="0.001"
            value={thickness}
            onChange={(e) => setThickness(e.target.value)}
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span>Quantity</span>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>
    </form>
  )
}