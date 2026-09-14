/**
 * Mismos basemaps gratuitos que usa frontend/src/components/map/AppMapTileLayer.jsx
 * (Esri/ArcGIS Online, sin llave — CARTO dejó de ser gratis). Dato puro, sin
 * dependencia de Leaflet ni de react-native-maps: cada plataforma arma su
 * propio componente de capa de tiles (`<TileLayer>` en web, `<UrlTile>` en
 * mobile) a partir de esto.
 *
 * Nota de plataforma: el orden de placeholders de Esri en la URL es
 * `{z}/{y}/{x}` (no el orden convencional `{z}/{x}/{y}` de OSM) — es correcto
 * tal cual, ambas librerías de tiles hacen reemplazo de texto por nombre de
 * token, no por posición.
 */
export const MAP_TILE_PROVIDERS = {
  dark: {
    url: 'https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, HERE, Garmin, FAO, NOAA, USGS',
    maxZoom: 16,
  },
  light: {
    url: 'https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, HERE, Garmin, FAO, NOAA, USGS',
    maxZoom: 16,
  },
  voyager: {
    url: 'https://server.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, HERE, Garmin, FAO, NOAA, USGS',
    maxZoom: 19,
  },
};

export function getMapTileProvider(styleKey) {
  return MAP_TILE_PROVIDERS[styleKey] || MAP_TILE_PROVIDERS.light;
}
