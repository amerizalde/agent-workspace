import { Material } from './textures/materials';

export const PROMPTS = {
  PRODUCT_SCENE: `Generate a photorealistic product showcase scene using Three.js. The scene should include:

Product: ${PRODUCT_NAME || 'Product to be inserted'}
Type: ${PRODUCT_TYPE || '3D product'}

Scene Requirements:
- ${STUDIO_DESCRIPTION || 'Professional studio lighting with softbox setup'}
- ${BACKGROUND_TYPE || 'Neutral studio background'}
- ${LITING_STRATEGY || 'Multi-directional soft lighting'}

Camera Views:
1. Front view (straight on)
2. 45-degree angle (product showcase)
3. Top-down view (detail inspection)
4. Close-up view (texture details)

Quality Target: PLATINUM+ DEPLOYABLE
`,

  ANIMATION_SCENE: `Generate an animated scene showing ${ANIMATION_TYPE || 'product interaction'} with ${ANIMATION_DURATION || '15'} seconds of looping animation:

Animation Requirements:
- ${ANIMATION_LOOP || 'Smooth looping motion'}
- ${LIGHTING_CHANGES || 'Time-of-day lighting transition'}
- ${CAMERA_MOVEMENT || 'Orbit around product'}

Include:
- ${EFFECTS || 'Subtle particle effects (light reflections)'}
- ${TRANSITIONS || 'Smooth camera transitions'}

Output: HTML file with embedded animation loop
`,

  NATURE_SCENE: `Generate a natural environment scene with photorealistic materials. The scene should include:

Environment: ${ELEMENTS || 'forest canopy or water'}
Lighting: ${LIGHTING_TYPE || 'natural sunlight with volumetric fog'}

Include:
- ${LEAF_DETAIL || 'Individual leaves with subsurface scattering'}
- ${TREE_TRUNKS || 'Bark texture with detail maps'}
- ${LIGHT_BEAMS || 'Sunlight rays through trees'}
- ${MIST_FOG || 'Atmospheric volumetrics'}

Quality Target: PLATINUM level

Output: Complete nature scene with organic materials
`,

  URBAN_SCENE: `Generate an urban city street scene with realistic materials and lighting.

Setting: ${SETTING_TYPE || 'modern downtown street'}

Include:
- ${BUILDING_FACADES || 'Glass and concrete buildings'}
- ${STREET_FURNITURE || 'Benches, signs, planters'}
- ${TRAFFIC_LIGHTS || 'LED lighting from traffic signals'}
- ${PEDESTRIAN_SHADOWS || 'Real-time shadows from people'}

Quality Target: DEPLOYABLE
`,

  ABSTRACT_SCENE: `Generate an abstract artistic scene with ${ARTIST_NAME || 'creative'} composition:

Composition: ${COMPOSITION_TYPE || 'symmetrical/asymmetrical'}

Include:
- ${GEOMETRY || 'Geometric shapes and patterns'}
- ${MATERIALS || 'Mixed materials (metal, glass, organic)'}
- ${COLORS || 'Bold, artistic color palette'}
- ${LIGHTING_MODES || 'Dramatic shadows and highlights'}

Style: ${ART_STYLE || 'Modern art/abstract expressionism'}

Output: High-quality artistic render
`,

  STUDIO_SCENE: `Generate a professional studio product render:

Subject: ${PRODUCT_NAME || 'Product to showcase'}
Background: ${BACKGROUND || 'Seamless white/gradient'}
Lighting Setup: ${LIGHTING_NAME || '3-point lighting'}

Camera:
- ${LENS_FOCAL || '85mm portrait lens'}
- ${APERTURE || 'f/2.8 for shallow depth of field'}
- ${ISO_LIGHTING || 'Low ISO for clean image'}

Include:
- ${REFLECTIONS || 'Product reflections in glass/metal'}
- ${SHADOWS_SOFTBOX || 'Soft shadows from softbox'}
- ${BACKGROUND_CLEANUP || 'Clean, minimal background'}

Quality Target: DEPLOYABLE standard
`,

  MATERIAL_LIBRARY: `The scene includes these materials from the PBR library:

Available Materials:
${MATERIAL_LIST.map((m) => `- ${m.name}: ${m.type} (${m.source})`).join('\\n')}

Additional HDRI:
- ${HDRI_SOURCE || 'PolyHaven environment maps'}

Material Count: ${MATERIAL_COUNT || '20+'}
`,

  SCENE_CONFIG: `Configuration for Three.js scene:

Engine: ${THREE_JS_VERSION || 'R128 with React Three Fiber'}
Renderer: ${RENDERER_TYPE || 'WebGL 2.0'}
PostProcessing: ${POST_PROCESSING || 'Bloom, ToneMapping'}

Camera: ${CAMERA_SETTINGS || 'Orthographic perspective'}
SceneGraph: ${SCENE_GRAPH || 'Complex, multi-object graph'}

Optimization:
${OPTIMIZATION_HINTS || 'InstancedMesh for similar objects, TextureAtlas for materials'}
`,

  GENERATION_STATUS: `Workflow Status: ${GENERATION_STATUS || 'Running'}

Progress: ${PROGRESS || '12/' + TOTAL_ITERATIONS} iterations
Quality: ${QUALITY || 'BRONZE -> SILVER -> GOLD'}
Last Update: ${TIMESTAMP || new Date().toISOString()}

Next Action: ${NEXT_ACTION || 'Continue iteration'}
`
} as const;

export const PRODUCTS = [
  { name: 'Phone Case', type: 'Product', id: 'phone-case' },
  { name: 'Shoe', type: 'Product', id: 'shoe' },
  { name: 'Watch', type: 'Product', id: 'watch' },
  { name: 'Car Parts', type: 'Product', id: 'car-parts' },
  { name: 'Furniture', type: 'Product', id: 'furniture' }
] as const;

export const SCENES = [
  { name: 'Interior', id: 'interior' },
  { name: 'Exterior', id: 'exterior' },
  { name: 'Product', id: 'product' },
  { name: 'Studio', id: 'studio' }
] as const;

export default { PROMPTS, PRODUCTS, SCENES };
