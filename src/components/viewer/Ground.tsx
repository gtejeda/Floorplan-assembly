import { useEffect, useRef } from 'react';
import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Texture,
  Mesh,
} from '@babylonjs/core';
import type { Lot } from '@models/types';

interface GroundProps {
  scene: Scene;
  lot: Lot;
}

export function Ground({ scene, lot }: GroundProps) {
  const groundRef = useRef<Mesh | null>(null);
  const gridRef = useRef<Mesh | null>(null);

  useEffect(() => {
    // Create main ground plane
    const ground = MeshBuilder.CreateGround(
      'ground',
      {
        width: lot.width,
        height: lot.height,
        subdivisions: 1,
      },
      scene
    );

    // Position ground at center (Babylon uses Y as up, ground at Y=0)
    ground.position.x = lot.width / 2;
    ground.position.z = lot.height / 2;

    // Create ground material
    const groundMaterial = new StandardMaterial('groundMaterial', scene);
    groundMaterial.diffuseColor = new Color3(0.15, 0.2, 0.15); // Dark green-gray
    groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    groundMaterial.backFaceCulling = false;
    ground.material = groundMaterial;

    groundRef.current = ground;

    // Create grid overlay
    const gridSize = lot.gridSize;
    const gridLinesX = Math.ceil(lot.width / gridSize);
    const gridLinesZ = Math.ceil(lot.height / gridSize);

    // Create grid texture dynamically
    const gridCanvas = document.createElement('canvas');
    const gridCtx = gridCanvas.getContext('2d');
    if (gridCtx) {
      const cellSize = 64; // Pixels per grid cell in texture
      gridCanvas.width = gridLinesX * cellSize;
      gridCanvas.height = gridLinesZ * cellSize;

      // Clear with transparent background
      gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

      // Draw grid lines
      gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      gridCtx.lineWidth = 1;

      // Vertical lines
      for (let i = 0; i <= gridLinesX; i++) {
        gridCtx.beginPath();
        gridCtx.moveTo(i * cellSize, 0);
        gridCtx.lineTo(i * cellSize, gridCanvas.height);
        gridCtx.stroke();
      }

      // Horizontal lines
      for (let j = 0; j <= gridLinesZ; j++) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, j * cellSize);
        gridCtx.lineTo(gridCanvas.width, j * cellSize);
        gridCtx.stroke();
      }

      // Create grid plane slightly above ground
      const gridPlane = MeshBuilder.CreateGround(
        'grid',
        {
          width: lot.width,
          height: lot.height,
          subdivisions: 1,
        },
        scene
      );
      gridPlane.position.x = lot.width / 2;
      gridPlane.position.y = 0.01; // Slightly above ground
      gridPlane.position.z = lot.height / 2;

      // Create grid material with texture
      const gridMaterial = new StandardMaterial('gridMaterial', scene);
      const gridTexture = new Texture(
        gridCanvas.toDataURL(),
        scene,
        true,
        true,
        Texture.NEAREST_SAMPLINGMODE
      );
      gridTexture.hasAlpha = true;
      gridMaterial.diffuseTexture = gridTexture;
      gridMaterial.opacityTexture = gridTexture;
      gridMaterial.specularColor = new Color3(0, 0, 0);
      gridMaterial.backFaceCulling = false;
      gridPlane.material = gridMaterial;

      gridRef.current = gridPlane;
    }

    // Cleanup
    return () => {
      ground.dispose();
      groundRef.current = null;

      if (gridRef.current) {
        gridRef.current.dispose();
        gridRef.current = null;
      }
    };
  }, [scene, lot.width, lot.height, lot.gridSize]);

  // Component renders nothing - meshes are added directly to scene
  return null;
}
