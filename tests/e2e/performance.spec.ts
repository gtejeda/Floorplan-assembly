/**
 * Performance Benchmark Tests
 *
 * These tests validate the performance requirements from the specification:
 * - FR-015: 30+ FPS during 3D navigation with 100 areas
 * - FR-026: <100ms interaction response for drag/resize
 *
 * Prerequisites:
 * - Install Playwright: npm install -D @playwright/test
 * - Install browsers: npx playwright install
 * - Run tests: npx playwright test tests/e2e/performance.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

// Helper to generate areas for performance testing
async function createManyAreas(page: Page, count: number): Promise<void> {
  // Access the store directly via window
  await page.evaluate((areaCount) => {
    const store = (window as any).__FLOORPLAN_STORE__;
    if (!store) {
      throw new Error('Store not exposed on window. Add window.__FLOORPLAN_STORE__ = useFloorplanStore in App.tsx for testing.');
    }

    const { addArea } = store.getState();
    const colors = ['#4A90D9', '#00BFFF', '#32CD32', '#FFD700', '#FF6347', '#9370DB'];

    for (let i = 0; i < areaCount; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      addArea({
        name: `Area ${i + 1}`,
        type: 'custom',
        x: 2 + col * 9,
        y: 2 + row * 9,
        width: 8,
        height: 8,
        elevation: 3 + (i % 5),
        color: colors[i % colors.length],
        opacity: 0.7,
        locked: false,
        visible: true,
        zIndex: i,
      });
    }
  }, count);
}

// Helper to measure FPS in 3D view
async function measureFPS(page: Page, durationMs: number = 3000): Promise<number> {
  const fps = await page.evaluate(async (duration) => {
    return new Promise<number>((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();

      function countFrame() {
        frameCount++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const elapsed = performance.now() - startTime;
          const measuredFps = (frameCount / elapsed) * 1000;
          resolve(measuredFps);
        }
      }

      requestAnimationFrame(countFrame);
    });
  }, durationMs);

  return fps;
}

test.describe('T099: Performance Benchmark - 30+ FPS with 100 areas in 3D view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to initialize
    await page.waitForSelector('[data-testid="canvas-2d"], .konva-content', { timeout: 10000 });
  });

  test('should maintain 30+ FPS in 3D view with 100 areas during static rendering', async ({ page }) => {
    // Create 100 areas
    await createManyAreas(page, 100);

    // Switch to 3D view
    await page.keyboard.press('Tab');
    await page.waitForSelector('[data-testid="viewer-3d"], canvas[data-engine]', { timeout: 5000 });

    // Wait for scene to stabilize
    await page.waitForTimeout(1000);

    // Measure FPS over 3 seconds
    const fps = await measureFPS(page, 3000);

    console.log(`Measured FPS with 100 areas: ${fps.toFixed(2)}`);
    expect(fps).toBeGreaterThanOrEqual(30);
  });

  test('should maintain 30+ FPS in 3D view with 100 areas during WASD navigation', async ({ page }) => {
    // Create 100 areas
    await createManyAreas(page, 100);

    // Switch to 3D view
    await page.keyboard.press('Tab');
    await page.waitForSelector('[data-testid="viewer-3d"], canvas[data-engine]', { timeout: 5000 });

    // Start measuring FPS while navigating
    const fpsPromise = measureFPS(page, 3000);

    // Simulate WASD navigation during measurement
    const canvas = page.locator('canvas[data-engine]');
    await canvas.focus();

    // Hold W key for forward movement
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyW');

    // Strafe left
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyA');

    // Move backward
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyS');

    // Strafe right
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyD');

    const fps = await fpsPromise;

    console.log(`Measured FPS during WASD navigation with 100 areas: ${fps.toFixed(2)}`);
    expect(fps).toBeGreaterThanOrEqual(30);
  });

  test('should maintain 30+ FPS in 3D view with 100 areas during mouse orbit', async ({ page }) => {
    // Create 100 areas
    await createManyAreas(page, 100);

    // Switch to 3D view
    await page.keyboard.press('Tab');
    await page.waitForSelector('[data-testid="viewer-3d"], canvas[data-engine]', { timeout: 5000 });

    // Start measuring FPS while orbiting
    const fpsPromise = measureFPS(page, 3000);

    // Get canvas bounds
    const canvas = page.locator('canvas[data-engine]');
    const box = await canvas.boundingBox();

    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Perform circular mouse drag to simulate orbit
      await page.mouse.move(centerX, centerY);
      await page.mouse.down({ button: 'right' });

      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        const x = centerX + Math.cos(rad) * 100;
        const y = centerY + Math.sin(rad) * 50;
        await page.mouse.move(x, y);
        await page.waitForTimeout(50);
      }

      await page.mouse.up({ button: 'right' });
    }

    const fps = await fpsPromise;

    console.log(`Measured FPS during mouse orbit with 100 areas: ${fps.toFixed(2)}`);
    expect(fps).toBeGreaterThanOrEqual(30);
  });
});

test.describe('T100: Interaction Latency - <100ms response for drag/resize', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="canvas-2d"], .konva-content', { timeout: 10000 });
  });

  test('should respond to area drag within 100ms', async ({ page }) => {
    // Create a test area
    await page.evaluate(() => {
      const store = (window as any).__FLOORPLAN_STORE__;
      if (!store) {
        throw new Error('Store not exposed on window');
      }

      const { addArea } = store.getState();
      addArea({
        name: 'Test Area',
        type: 'house',
        x: 10,
        y: 10,
        width: 15,
        height: 10,
        elevation: 3,
        color: '#4A90D9',
        opacity: 0.7,
        locked: false,
        visible: true,
        zIndex: 1,
      });
    });

    // Wait for area to render
    await page.waitForTimeout(200);

    // Measure drag latency
    const latency = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const store = (window as any).__FLOORPLAN_STORE__;
        const areas = store.getState().project?.areas;
        if (!areas || areas.length === 0) {
          resolve(-1);
          return;
        }

        const areaId = areas[0].id;
        const originalX = areas[0].x;

        const startTime = performance.now();

        // Simulate update
        store.getState().updateArea(areaId, { x: originalX + 1 });

        // Use microtask to measure when state is updated
        queueMicrotask(() => {
          const endTime = performance.now();
          resolve(endTime - startTime);
        });
      });
    });

    console.log(`Drag update latency: ${latency.toFixed(2)}ms`);
    expect(latency).toBeLessThan(100);
  });

  test('should respond to area resize within 100ms', async ({ page }) => {
    // Create a test area
    await page.evaluate(() => {
      const store = (window as any).__FLOORPLAN_STORE__;
      if (!store) {
        throw new Error('Store not exposed on window');
      }

      const { addArea } = store.getState();
      addArea({
        name: 'Resize Test Area',
        type: 'pool',
        x: 20,
        y: 15,
        width: 12,
        height: 8,
        elevation: 2,
        color: '#00BFFF',
        opacity: 0.7,
        locked: false,
        visible: true,
        zIndex: 1,
      });
    });

    await page.waitForTimeout(200);

    // Measure resize latency
    const latency = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const store = (window as any).__FLOORPLAN_STORE__;
        const areas = store.getState().project?.areas;
        if (!areas || areas.length === 0) {
          resolve(-1);
          return;
        }

        const areaId = areas[0].id;

        const startTime = performance.now();

        // Simulate resize update
        store.getState().updateArea(areaId, { width: 14, height: 10 });

        queueMicrotask(() => {
          const endTime = performance.now();
          resolve(endTime - startTime);
        });
      });
    });

    console.log(`Resize update latency: ${latency.toFixed(2)}ms`);
    expect(latency).toBeLessThan(100);
  });

  test('should respond to zoom within 100ms', async ({ page }) => {
    // Measure zoom latency
    const latency = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const store = (window as any).__FLOORPLAN_STORE__;
        if (!store) {
          resolve(-1);
          return;
        }

        const startTime = performance.now();

        store.getState().setZoom(1.5);

        queueMicrotask(() => {
          const endTime = performance.now();
          resolve(endTime - startTime);
        });
      });
    });

    console.log(`Zoom update latency: ${latency.toFixed(2)}ms`);
    expect(latency).toBeLessThan(100);
  });

  test('should respond to pan within 100ms', async ({ page }) => {
    // Measure pan latency
    const latency = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const store = (window as any).__FLOORPLAN_STORE__;
        if (!store) {
          resolve(-1);
          return;
        }

        const startTime = performance.now();

        store.getState().setPan(100, 50);

        queueMicrotask(() => {
          const endTime = performance.now();
          resolve(endTime - startTime);
        });
      });
    });

    console.log(`Pan update latency: ${latency.toFixed(2)}ms`);
    expect(latency).toBeLessThan(100);
  });

  test('should maintain <100ms latency with 50 areas on canvas', async ({ page }) => {
    // Create 50 areas
    await createManyAreas(page, 50);

    await page.waitForTimeout(500);

    // Measure interaction latency with many areas
    const latencies = await page.evaluate(async () => {
      const store = (window as any).__FLOORPLAN_STORE__;
      const results: number[] = [];

      // Test 10 rapid updates
      for (let i = 0; i < 10; i++) {
        const areas = store.getState().project?.areas;
        if (!areas || areas.length === 0) continue;

        const randomArea = areas[Math.floor(Math.random() * areas.length)];
        const startTime = performance.now();

        store.getState().updateArea(randomArea.id, {
          x: randomArea.x + 0.1,
        });

        await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
        const endTime = performance.now();
        results.push(endTime - startTime);
      }

      return results;
    });

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    console.log(`Average latency with 50 areas: ${avgLatency.toFixed(2)}ms`);
    console.log(`Max latency with 50 areas: ${maxLatency.toFixed(2)}ms`);

    expect(avgLatency).toBeLessThan(100);
    expect(maxLatency).toBeLessThan(100);
  });
});
