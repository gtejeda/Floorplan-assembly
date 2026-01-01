import { useEffect, useRef } from 'react';
import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  ActionManager,
  ExecuteCodeAction,
  HighlightLayer,
} from '@babylonjs/core';
import type { Area } from '@models/types';
import { AREA_TYPE_PROPERTIES } from '@models/types';

interface AreaBoxProps {
  scene: Scene;
  area: Area;
  isSelected: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (id: string, shiftKey: boolean) => void;
}

// Parse hex color to RGB values (0-1)
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    };
  }
  return { r: 0.5, g: 0.5, b: 0.5 };
}

export function AreaBox({
  scene,
  area,
  isSelected,
  onHover,
  onClick,
}: AreaBoxProps) {
  const meshRef = useRef<Mesh | null>(null);
  const materialRef = useRef<StandardMaterial | null>(null);
  const highlightLayerRef = useRef<HighlightLayer | null>(null);

  // Create mesh when dimensions/appearance change (NOT position)
  useEffect(() => {
    // Handle elevation: positive = above baseHeight, negative = below baseHeight, 0 = flat
    const baseHeight = area.baseHeight ?? 0;
    const isFlat = area.elevation === 0;
    const boxHeight = isFlat ? 0.1 : Math.abs(area.elevation);

    // Create box mesh
    const box = MeshBuilder.CreateBox(
      `area-${area.id}`,
      {
        width: area.width,
        height: boxHeight,
        depth: area.height,
      },
      scene
    );

    // Set initial position
    // X and Z are horizontal position, Y is vertical (up)
    box.position.x = area.x + area.width / 2;
    box.position.z = area.y + area.height / 2;

    // Y position: baseHeight + half the box height (box is centered on its position)
    if (isFlat) {
      box.position.y = baseHeight + 0.05;
    } else if (area.elevation < 0) {
      // Underground: position below baseHeight
      box.position.y = baseHeight - boxHeight / 2;
    } else {
      // Above ground: position above baseHeight
      box.position.y = baseHeight + boxHeight / 2;
    }

    // Apply rotation around Y axis (vertical) - convert degrees to radians
    box.rotation.y = (area.rotation ?? 0) * (Math.PI / 180);

    // Get type-specific properties
    const typeProps = AREA_TYPE_PROPERTIES[area.type];

    // Create material
    const rgb = hexToRgb(area.color);
    const material = new StandardMaterial(`material-${area.id}`, scene);
    material.diffuseColor = new Color3(rgb.r, rgb.g, rgb.b);
    material.alpha = area.opacity;

    // Special rendering for different types
    if (typeProps.isTransparent) {
      material.specularColor = new Color3(0.8, 0.8, 0.8);
      material.specularPower = 64;
      material.alpha = Math.min(area.opacity, 0.4);
      material.backFaceCulling = false;
    } else if (typeProps.isWireframe) {
      material.wireframe = true;
      material.specularColor = new Color3(0, 0, 0);
    } else {
      material.specularColor = new Color3(0.2, 0.2, 0.2);
    }

    box.material = material;

    // Setup action manager for hover
    box.actionManager = new ActionManager(scene);

    box.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        onHover?.(area.id);
        material.emissiveColor = new Color3(0.1, 0.1, 0.1);
      })
    );

    box.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        onHover?.(null);
        material.emissiveColor = new Color3(0, 0, 0);
      })
    );

    meshRef.current = box;
    materialRef.current = material;

    // Create highlight layer for selection
    let highlightLayer = scene.getHighlightLayerByName('selectionHighlight');
    if (!highlightLayer) {
      highlightLayer = new HighlightLayer('selectionHighlight', scene);
    }
    highlightLayerRef.current = highlightLayer;

    // Cleanup
    return () => {
      if (highlightLayerRef.current && meshRef.current) {
        highlightLayerRef.current.removeMesh(meshRef.current);
      }
      box.dispose();
      material.dispose();
      meshRef.current = null;
      materialRef.current = null;
    };
    // Note: area.x, area.y, area.baseHeight are NOT in dependencies - position is updated separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, area.id, area.width, area.height, area.elevation, area.rotation, area.type, area.color, area.opacity, onHover]);

  // Update position separately (smooth dragging without mesh recreation)
  useEffect(() => {
    if (!meshRef.current) return;

    const box = meshRef.current;
    const baseHeight = area.baseHeight ?? 0;
    const isFlat = area.elevation === 0;
    const boxHeight = isFlat ? 0.1 : Math.abs(area.elevation);

    // Update X and Z (horizontal position)
    box.position.x = area.x + area.width / 2;
    box.position.z = area.y + area.height / 2;

    // Update Y (vertical position based on baseHeight)
    if (isFlat) {
      box.position.y = baseHeight + 0.05;
    } else if (area.elevation < 0) {
      box.position.y = baseHeight - boxHeight / 2;
    } else {
      box.position.y = baseHeight + boxHeight / 2;
    }
  }, [area.x, area.y, area.width, area.height, area.baseHeight, area.elevation]);

  // Update selection highlight
  useEffect(() => {
    if (!meshRef.current || !highlightLayerRef.current) return;

    if (isSelected) {
      highlightLayerRef.current.addMesh(meshRef.current, new Color3(0, 0.5, 1));
    } else {
      highlightLayerRef.current.removeMesh(meshRef.current);
    }
  }, [isSelected]);

  // Component renders nothing - mesh is added directly to scene
  return null;
}
