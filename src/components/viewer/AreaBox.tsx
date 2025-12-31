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

  // Create/update mesh
  useEffect(() => {
    // Create box mesh
    const box = MeshBuilder.CreateBox(
      `area-${area.id}`,
      {
        width: area.width,
        height: area.elevation,
        depth: area.height, // depth corresponds to Y in 2D
      },
      scene
    );

    // Position box (Babylon: X right, Y up, Z forward)
    // In 2D, X is right, Y is down (we convert Y to Z in 3D)
    box.position.x = area.x + area.width / 2;
    box.position.y = area.elevation / 2; // Center vertically
    box.position.z = area.y + area.height / 2;

    // Create material
    const rgb = hexToRgb(area.color);
    const material = new StandardMaterial(`material-${area.id}`, scene);
    material.diffuseColor = new Color3(rgb.r, rgb.g, rgb.b);
    material.specularColor = new Color3(0.2, 0.2, 0.2);
    material.alpha = area.opacity;
    box.material = material;

    // Setup action manager for hover and click
    box.actionManager = new ActionManager(scene);

    // Hover enter
    box.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        onHover?.(area.id);
        // Subtle hover effect
        material.emissiveColor = new Color3(0.1, 0.1, 0.1);
      })
    );

    // Hover exit
    box.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        onHover?.(null);
        material.emissiveColor = new Color3(0, 0, 0);
      })
    );

    // Click
    box.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, (evt) => {
        const shiftKey = evt.sourceEvent?.shiftKey ?? false;
        onClick?.(area.id, shiftKey);
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
  }, [scene, area.id, area.x, area.y, area.width, area.height, area.elevation, area.color, area.opacity, onHover, onClick]);

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
