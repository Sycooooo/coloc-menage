'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { APARTMENT_ENVELOPE } from '@/lib/apartment-geometry'

export default function CameraController() {
  const { centerX, centerZ } = APARTMENT_ENVELOPE
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    // Force camera position on mount
    camera.position.set(centerX, 10, centerZ + 0.1)
    camera.lookAt(centerX, 0, centerZ)
    camera.updateProjectionMatrix()

    if (controlsRef.current) {
      controlsRef.current.target.set(centerX, 0, centerZ)
      controlsRef.current.update()
    }
  }, [camera, centerX, centerZ])

  return (
    <OrbitControls
      ref={controlsRef}
      target={[centerX, 0, centerZ]}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2.5}
      minDistance={4}
      maxDistance={22}
      enablePan={true}
      panSpeed={0.8}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      enableDamping
      dampingFactor={0.1}
      makeDefault
    />
  )
}
