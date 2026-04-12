export { PROMPTS } from '../constants';
export { sceneTemplates, getTemplateByName, getTemplateByPrompt } from './scene-templates';
export { default as materials } from '../textures/materials';

export const defaultScene: string = `<!DOCTYPE html>
<html>
<head>
    <title>Iterative Visual Loop - ${TITLE || 'Scene'}</title>
    <meta charset="utf-8">
    <style>body { margin: 0; overflow: hidden; }</style>
</head>
<body>
    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls, RGBELoader, EffectComposer, RenderPass } from 'three/addons/...';
        
        // 1. Setup Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        renderer.domElement = document.getElementById('scene-canvas');
        
        // 2. Global State
        window.scene = scene;
        window.camera = camera;
        window.renderer = renderer;
        
        // 3. Scene construction, materials, lighting, animation loop
        scene.background = null;
        
        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        
        animate();
        
        window.inspectionViews = [];
        window.controls = new THREE.OrbitControls(camera, renderer.domElement);
    </script>
</body>
</html>`;

export default {
    defaultScene,
    PROMPTS
};
