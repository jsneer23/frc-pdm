// src/features/parts/PartRequestForm.tsx
import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MACHINES, MATERIALS, type MachineId, type MaterialId, MATERIAL_THICKNESS } from './constants'

type FormErrors = Partial<Record<'partName' | 'material' | 'thickness' | 'quantity', string>>

export function PartRequestForm() {
  const [machine, setMachine] = useState<MachineId>('co2_laser')
  const [partName, setPartName] = useState('')
  const [material, setMaterial] = useState<MaterialId | ''>('')
  const [thickness, setThickness] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [errors, setErrors] = useState<FormErrors>({})


  const machineDef = MACHINES[machine]
  const availableMaterials = machineDef.materials
  const availableThicknesses = material ? MATERIAL_THICKNESS[material] ?? [] : []

  function handleMachineChange(next: MachineId) {
    setMachine(next)
    // clear the material if the new machine cannot use it
    const stillValid = MACHINES[next].materials.includes(material as never)
    if (!stillValid) setMaterial('')
  }

  function handleMaterialChange(next: MaterialId | '') {
    setMaterial(next)
    setThickness('')
    clearError('material', 'thickness')
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const nextErrors: FormErrors = {}

    // part name verification
    const name = partName.trim()
    if (name === '') nextErrors.partName = 'Enter a part name.'
    if (material === '') nextErrors.material = 'Select a material.'
    if (machineDef.needsThickness && thickness === '') nextErrors.thickness = 'Select a thickess.'

    // quantity verifiation
    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty < 1) nextErrors.quantity = 'Enter a valid quantity.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return  

    const request = {
      partName: name,
      machine,
      material,
      thickness: machineDef.needsThickness ? Number(thickness) : null,
      quantity: Number(quantity),
    }

      console.log(request)
  }

  function clearError(...fields: (keyof FormErrors)[]){
    setErrors((prev) => {
      const next = { ...prev }
      for (const field of fields) next[field] = undefined
      return next
    })
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Part Exporter</CardTitle>
        <CardDescription>Send a part to the production queue.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="flex flex-col gap-4">
           <label className="flex flex-col gap-1">
              <span>Machine</span>
              <select
                value={machine}
                onChange={(e) => handleMachineChange(e.target.value as MachineId)}
                aria-invalid={!!errors.partName}
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
              onChange={(e) => {
                setPartName(e.target.value)
                clearError('partName')
              }}
              aria-invalid={!!errors.partName}
            />
          </label>

          {errors.partName && (
            <p className="text-sm text-destructive">{errors.partName}</p>
          )}

          <label className="flex flex-col gap-1">
            <span>Material</span>
            <select
              value={material}
              onChange={(e) => handleMaterialChange(e.target.value as MaterialId)}
              aria-invalid={!!errors.material}
            >
              <option value="">Select a material</option>
              {availableMaterials.map((id) => (
                <option key={id} value={id}>{MATERIALS[id]}</option>
              ))}
            </select>
          </label>

          {errors.material && (
            <p className="text-sm text-destructive">{errors.material}</p>
          )}

          {machineDef.needsThickness && (
            <label className="flex flex-col gap-1">
              <span>Thickness (in)</span>
              <select
                value={thickness}
                onChange={(e) => {
                  setThickness(e.target.value)
                  clearError('thickness')
                }}
                aria-invalid={!!errors.thickness}
              >
                <option value="">Select a thickness</option>
                {availableThicknesses.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          )}

          {errors.thickness && (
            <p className="text-sm text-destructive">{errors.thickness}</p>
          )}

          <label className="flex flex-col gap-1">
            <span>Quantity</span>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                clearError('quantity')
              }}
              aria-invalid={!!errors.quantity}
            />
          </label>

          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity}</p>
          )}
        </CardContent>

        <CardFooter>
          <CardFooter>
            <Button type="submit" className="w-full">Submit Request</Button>
          </CardFooter>
        </CardFooter>
      </form>
    </Card>
  )
    
}
