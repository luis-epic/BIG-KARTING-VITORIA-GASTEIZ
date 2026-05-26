const fs = require('fs');

const path = 'c:/Users/luis/OneDrive/Documents/proyectos/bigkarting/public/models/go-kart 3d model.glb';

try {
  const fileContent = fs.readFileSync(path);
  const jsonChunkLength = fileContent.readUInt32LE(12);
  const jsonChunkType = fileContent.readUInt32LE(16);
  
  if (jsonChunkType === 0x4E4F534A) { // 'JSON'
    const jsonStr = fileContent.toString('utf8', 20, 20 + jsonChunkLength);
    const gltf = JSON.parse(jsonStr);
    
    console.log('--- GLB NODES ---');
    if (gltf.nodes) {
      gltf.nodes.forEach((node, idx) => {
        if (node.name) {
          console.log(`Node ${idx}: ${node.name}`);
        }
      });
    }
    
    console.log('--- GLB MESHES ---');
    if (gltf.meshes) {
      gltf.meshes.forEach((mesh, idx) => {
        if (mesh.name) {
          console.log(`Mesh ${idx}: ${mesh.name}`);
        }
      });
    }
  } else {
    console.log('No JSON chunk found.');
  }
} catch (e) {
  console.error('Error:', e);
}
