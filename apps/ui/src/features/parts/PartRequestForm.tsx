// src/features/parts/PartRequestForm.tsx
import { useState } from 'react'
import { MACHINES, MATERIALS, type MaterialThickness, type MachineId, type MaterialId, MATERIAL_THICKNESSES } from './constants'

export function PartRequestForm() {
  const [machine, setMachine] = useState<MachineId>('co2_laser')
  const [partName, setPartName] = useState('')
  const [material, setMaterial] = useState<MaterialId | ''>('')
  const [thickness, setThickness] = useState<MaterialThickness | ''>('')
  const [quantity, setQuantity] = useState('1')

  // Derived. Not state.
  const machineDef = MACHINES[machine]
  const availableMaterials = machineDef.materials
  const availableThicknesses = material ? MATERIAL_THICKNESSES[material] ?? [] : []

  function handleMachineChange(next: MachineId) {
    setMachine(next)
    // Clear the material if the new machine cannot use it.
    const stillValid = MACHINES[next].materials.includes(material as never)
    if (!stillValid) setMaterial('')
  }

  function handleMaterialChange(next: MaterialId | '') {
    setMaterial(next)
    setThickness('')
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
        <span>Part Name</span>
        <input
          type="text"
          value={partName}
          placeholder="Part Name Required"
          onChange={(e) => setPartName(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span>Material</span>
        <select
          value={material}
          onChange={(e) => handleMaterialChange(e.target.value as MaterialId)}
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
          <select
            value={thickness}
            onChange={(e) => setThickness(e.target.value)}
          >
            <option value="">Select a thickness</option>
            {availableThicknesses.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
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