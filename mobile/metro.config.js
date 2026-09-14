const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..'); // UniWheels/

const config = getDefaultConfig(projectRoot);

// @uniwheels/shared vive fuera de mobile/ (../packages/shared, consumido vía
// dependencia "file:", no un workspace) — sin esto Metro no ve sus cambios en
// watch mode, y peor: al resolver los `import 'react'`/`import 'zustand'` que
// hace ese paquete, podría cargar una copia distinta desde
// packages/shared/node_modules en vez de la única copia real de mobile/,
// rompiendo los hooks de React ("Invalid hook call") de forma intermitente.
// `disableHierarchicalLookup` + apuntar `nodeModulesPaths` solo a
// mobile/node_modules fuerza una única fuente de verdad para todas las
// dependencias, vengan del código de mobile/ o del código symlinkeado de
// packages/shared/.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './src/global.css' });
