export const MATERIALS = {
  srpp: 'SRPP',
  polycarbonate: 'Polycarbonate',
  wood: 'Plywood',
  al6061: 'Aluminum 6061',
  al7075: 'Aluminum 7075',
  al5052: 'Aluminum 5052',
  tpu: 'TPU (95A)',
  petg: 'PETG',
  pla: 'PLA+',
  nylon: 'NYLON',
  onyx: 'Onyx (Markforged Only)'
} as const

export type MaterialId = keyof typeof MATERIALS

export const MACHINES = {
  co2_laser: {
    label: 'CO2 Laser',
    materials: ['srpp', 'polycarbonate', 'wood'],
    needsThickness: true,
  },
  router: {
    label: 'Router',
    materials: ['srpp', 'polycarbonate', 'wood', 'al6061', 'al7075', 'al5052'],
    needsThickness: true,
  },
  printer: {
    label: '3D Printer',
    materials: ['tpu', 'petg', 'pla', 'nylon', 'onyx'],
    needsThickness: false,
  },
} as const satisfies Record<string, MachineDef>

type MachineDef = {
  label: string
  materials: readonly MaterialId[]
  needsThickness: boolean
}

export type MachineId = keyof typeof MACHINES

export const MATERIAL_THICKNESSES: Partial<Record<MaterialId, readonly number[]>> = {
  srpp: [0.25],
  polycarbonate: [0.118, 0.196, 0.236],
  wood: [], // TODO: measue
  al6061: [0.125, 0.1875, 0.25],
  al7075: [], // TODO: measue
  al5052: [], // TODO: measue
  // ...
}
