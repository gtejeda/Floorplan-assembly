import { useEffect, useRef } from 'react';
import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3,
  Mesh,
  ActionManager,
  ExecuteCodeAction,
  HighlightLayer,
  SceneLoader,
  AbstractMesh,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import type { Asset } from '@models/types';

interface Asset3DProps {
  scene: Scene;
  asset: Asset;
  isSelected: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (id: string, shiftKey: boolean) => void;
}

export function Asset3D({
  scene,
  asset,
  isSelected,
  onHover,
  onClick,
}: Asset3DProps) {
  const meshRef = useRef<Mesh | AbstractMesh | null>(null);
  const meshesRef = useRef<AbstractMesh[]>([]);
  const materialRef = useRef<StandardMaterial | null>(null);
  const highlightLayerRef = useRef<HighlightLayer | null>(null);

  // Create/update mesh based on asset type
  useEffect(() => {
    const cleanup = () => {
      // Remove highlight first
      if (highlightLayerRef.current) {
        if (meshRef.current) {
          highlightLayerRef.current.removeMesh(meshRef.current as Mesh);
        }
        meshesRef.current.forEach((m) => {
          highlightLayerRef.current!.removeMesh(m as Mesh);
        });
      }

      // Dispose meshes
      meshesRef.current.forEach((m) => m.dispose());
      meshesRef.current = [];

      if (meshRef.current) {
        meshRef.current.dispose();
        meshRef.current = null;
      }

      if (materialRef.current) {
        materialRef.current.dispose();
        materialRef.current = null;
      }
    };

    // Get/create highlight layer
    let highlightLayer = scene.getHighlightLayerByName('selectionHighlight');
    if (!highlightLayer) {
      highlightLayer = new HighlightLayer('selectionHighlight', scene);
    }
    highlightLayerRef.current = highlightLayer;

    if (asset.type === 'image') {
      // Create a plane for 2D images
      const plane = MeshBuilder.CreatePlane(
        `asset-${asset.id}`,
        {
          width: asset.width,
          height: asset.height,
        },
        scene
      );

      // Position plane (lying flat on the ground, slightly above)
      plane.position.x = asset.x + asset.width / 2;
      plane.position.y = 0.01; // Just above ground
      plane.position.z = asset.y + asset.height / 2;

      // Rotate to lie flat on ground
      plane.rotation.x = Math.PI / 2;
      plane.rotation.y = (asset.rotation * Math.PI) / 180;

      // Create material with texture
      const material = new StandardMaterial(`material-${asset.id}`, scene);
      material.diffuseTexture = new Texture(asset.sourceUrl, scene);
      material.diffuseTexture.hasAlpha = true;
      material.useAlphaFromDiffuseTexture = true;
      material.backFaceCulling = false;
      material.specularColor = new Color3(0, 0, 0);
      plane.material = material;

      // Setup action manager
      plane.actionManager = new ActionManager(scene);

      plane.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
          onHover?.(asset.id);
          material.emissiveColor = new Color3(0.1, 0.1, 0.1);
        })
      );

      plane.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
          onHover?.(null);
          material.emissiveColor = new Color3(0, 0, 0);
        })
      );

      plane.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, (evt) => {
          const shiftKey = evt.sourceEvent?.shiftKey ?? false;
          onClick?.(asset.id, shiftKey);
        })
      );

      meshRef.current = plane;
      materialRef.current = material;
    } else if (asset.type === 'model') {
      // Load GLTF/GLB model
      loadModel();
    }

    async function loadModel() {
      if (!asset.sourceUrl) return;

      try {
        // Convert data URL to blob URL for loading
        let blobUrl: string | null = null;
        let fileUrl = asset.sourceUrl;

        if (asset.sourceUrl.startsWith('data:')) {
          const response = await fetch(asset.sourceUrl);
          const blob = await response.blob();
          blobUrl = URL.createObjectURL(blob);
          fileUrl = blobUrl;
        }

        // Determine the file extension from the original filename
        const extension = asset.originalFilename.toLowerCase().endsWith('.glb')
          ? '.glb'
          : '.gltf';

        const result = await SceneLoader.ImportMeshAsync(
          '',
          '',
          fileUrl,
          scene,
          undefined,
          extension
        );

        // Revoke blob URL if created
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }

        const meshes = result.meshes;
        meshesRef.current = meshes;

        // Calculate bounding box to get current size
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        meshes.forEach((mesh) => {
          // Use computeWorldMatrix to ensure bounding info is current
          mesh.computeWorldMatrix(true);
          const boundingInfo = mesh.getBoundingInfo();
          const min = boundingInfo.boundingBox.minimumWorld;
          const max = boundingInfo.boundingBox.maximumWorld;
          minX = Math.min(minX, min.x);
          minY = Math.min(minY, min.y);
          minZ = Math.min(minZ, min.z);
          maxX = Math.max(maxX, max.x);
          maxY = Math.max(maxY, max.y);
          maxZ = Math.max(maxZ, max.z);
        });

        const currentWidth = maxX - minX || 1;
        const currentHeight = maxY - minY || 1;
        const currentDepth = maxZ - minZ || 1;

        // Calculate scale to fit desired dimensions
        const scaleX = asset.width / currentWidth;
        const scaleY = asset.depth / currentHeight; // depth is vertical in 3D
        const scaleZ = asset.height / currentDepth;

        // Apply uniform scale based on smallest dimension (to preserve proportions)
        const uniformScale = Math.min(scaleX, scaleY, scaleZ) * asset.scale;

        // Position and scale all meshes
        meshes.forEach((mesh) => {
          mesh.scaling.set(uniformScale, uniformScale, uniformScale);

          // Center the model at the asset position
          mesh.position.x = asset.x + asset.width / 2 - (minX + maxX) / 2 * uniformScale;
          mesh.position.y = -minY * uniformScale; // Place on ground
          mesh.position.z = asset.y + asset.height / 2 - (minZ + maxZ) / 2 * uniformScale;

          mesh.rotation.y = (asset.rotation * Math.PI) / 180;

          // Setup action manager for each mesh
          if (!mesh.actionManager) {
            mesh.actionManager = new ActionManager(scene);

            mesh.actionManager.registerAction(
              new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                onHover?.(asset.id);
              })
            );

            mesh.actionManager.registerAction(
              new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                onHover?.(null);
              })
            );

            mesh.actionManager.registerAction(
              new ExecuteCodeAction(ActionManager.OnPickTrigger, (evt) => {
                const shiftKey = evt.sourceEvent?.shiftKey ?? false;
                onClick?.(asset.id, shiftKey);
              })
            );
          }
        });

        // Store first mesh for highlight
        if (meshes.length > 0) {
          meshRef.current = meshes[0];
        }
      } catch (error) {
        console.error('Failed to load 3D model:', asset.originalFilename, error);
      }
    }

    return cleanup;
  }, [
    scene,
    asset.id,
    asset.type,
    asset.sourceUrl,
    asset.originalFilename,
    asset.x,
    asset.y,
    asset.width,
    asset.height,
    asset.depth,
    asset.rotation,
    asset.scale,
    onHover,
    onClick,
  ]);

  // Update selection highlight
  useEffect(() => {
    if (!highlightLayerRef.current) return;

    const highlightColor = new Color3(0, 0.5, 1);

    if (isSelected) {
      if (meshRef.current) {
        highlightLayerRef.current.addMesh(meshRef.current as Mesh, highlightColor);
      }
      meshesRef.current.forEach((mesh) => {
        if (mesh.name !== '__root__') {
          highlightLayerRef.current!.addMesh(mesh as Mesh, highlightColor);
        }
      });
    } else {
      if (meshRef.current) {
        highlightLayerRef.current.removeMesh(meshRef.current as Mesh);
      }
      meshesRef.current.forEach((mesh) => {
        highlightLayerRef.current!.removeMesh(mesh as Mesh);
      });
    }
  }, [isSelected]);

  // Component renders nothing - mesh is added directly to scene
  return null;
}
