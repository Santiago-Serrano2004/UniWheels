export interface LeafletHtmlOptions {
  tileUrl: string;
  maxZoom: number;
  initialCenter: [number, number];
  initialZoom: number;
  isDark?: boolean;
}

export function generateLeafletHtml(options: LeafletHtmlOptions): string {
  const { tileUrl, maxZoom, initialCenter, initialZoom, isDark } = options;
  const bgColor = isDark ? '#020617' : '#f8fafc';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>UniWheels Map</title>
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: ${bgColor};
    }
    #map {
      width: 100%;
      height: 100%;
      background-color: ${bgColor};
    }
    .leaflet-control-attribution {
      display: none !important;
    }
    .leaflet-tile-pane {
      filter: none;
    }
    .leaflet-div-icon {
      background: transparent;
      border: none;
    }
    @keyframes gpsPulse {
      0% {
        transform: scale(0.9);
        opacity: 0.8;
      }
      70% {
        transform: scale(2.2);
        opacity: 0;
      }
      100% {
        transform: scale(2.2);
        opacity: 0;
      }
    }
    .gps-beacon-ring {
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      background: rgba(2, 132, 199, 0.4);
      animation: gpsPulse 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script>
    (function() {
      function postRN(data) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      }

      function isUniversityCampusLocation(location) {
        if (!location) return false;
        if (typeof location === 'object') {
          if (location.isCampus || location.type === 'campus') return true;
          if (location.name) return isUniversityCampusLocation(location.name);
          if (location.destination) return isUniversityCampusLocation(location.destination);
          if (location.origin) return isUniversityCampusLocation(location.origin);
          return false;
        }
        var str = String(location).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
        return (
          str.indexOf('campus') !== -1 ||
          str.indexOf('universidad') !== -1 ||
          str.indexOf('unab') !== -1 ||
          str.indexOf('jardin') !== -1 ||
          str.indexOf('bosque') !== -1 ||
          str.indexOf('csu') !== -1 ||
          str.indexOf('casona') !== -1 ||
          str.indexOf('sede ') !== -1 ||
          str.indexOf('facultad') !== -1 ||
          str.indexOf('rectoria') !== -1 ||
          str.indexOf('uis') !== -1 ||
          str.indexOf('upb') !== -1 ||
          str.indexOf('usta') !== -1
        );
      }

      function lerpAngle(current, target, factor) {
        var diff = ((target - current + 180) % 360) - 180;
        if (diff < -180) diff += 360;
        return current + diff * (factor !== undefined ? factor : 0.18);
      }

      function createVehicleMarker(heading, color) {
        if (heading === undefined) heading = 0;
        if (!color) color = '#0284c7';
        return L.divIcon({
          className: 'custom-vehicle-marker',
          html: '<div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: rotate(' + heading + 'deg); transition: transform 0.12s linear;">' +
            '<div class="gps-beacon-ring"></div>' +
            '<svg width="42" height="42" viewBox="0 0 100 100" fill="none" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">' +
              '<polygon points="50,15 18,-15 82,-15" fill="rgba(254,240,138,0.45)" />' +
              '<rect x="22" y="24" width="9" height="18" rx="3.5" fill="#0f172a" />' +
              '<rect x="69" y="24" width="9" height="18" rx="3.5" fill="#0f172a" />' +
              '<rect x="22" y="62" width="9" height="18" rx="3.5" fill="#0f172a" />' +
              '<rect x="69" y="62" width="9" height="18" rx="3.5" fill="#0f172a" />' +
              '<rect x="27" y="14" width="46" height="74" rx="15" fill="' + color + '" stroke="#ffffff" stroke-width="2.8" />' +
              '<path d="M 33 34 Q 50 28 67 34 L 64 45 Q 50 41 36 45 Z" fill="#e0f2fe" opacity="0.95" />' +
              '<rect x="34" y="45" width="32" height="22" rx="6" fill="rgba(0,0,0,0.2)" />' +
              '<path d="M 36 69 Q 50 66 64 69 L 62 75 Q 50 73 38 75 Z" fill="#bae6fd" opacity="0.9" />' +
              '<circle cx="34" cy="18" r="3.5" fill="#fef08a" />' +
              '<circle cx="66" cy="18" r="3.5" fill="#fef08a" />' +
              '<rect x="32" y="84" width="8" height="3" rx="1.5" fill="#ef4444" />' +
              '<rect x="60" y="84" width="8" height="3" rx="1.5" fill="#ef4444" />' +
            '</svg>' +
          '</div>',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });
      }

      function createMotoVehicleMarker(heading, isMoving, color) {
        if (heading === undefined) heading = 0;
        if (!color) color = '#f59e0b';
        var beacon = isMoving ? '<div class="gps-beacon-ring" style="background: rgba(245, 158, 11, 0.45);"></div>' : '';
        var lightBeam = isMoving ? '<polygon points="50,14 24,-12 76,-12" fill="rgba(254,240,138,0.42)"/>' : '';
        return L.divIcon({
          className: 'custom-vehicle-marker',
          html: '<div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: rotate(' + heading + 'deg); transition: transform 0.08s linear;">' +
            beacon +
            '<svg width="42" height="42" viewBox="0 0 100 100" fill="none" style="filter: drop-shadow(0 6px 12px rgba(0,0,0,0.45));">' +
              lightBeam +
              '<rect x="46" y="8" width="8" height="22" rx="3.5" fill="#0f172a" stroke="#64748b" stroke-width="1"/>' +
              '<rect x="27" y="25" width="46" height="4.5" rx="2" fill="#334155" stroke="#ffffff" stroke-width="1"/>' +
              '<circle cx="27" cy="27" r="3.5" fill="' + color + '"/>' +
              '<circle cx="73" cy="27" r="3.5" fill="' + color + '"/>' +
              '<path d="M 43 32 Q 50 26 57 32 L 60 48 Q 50 53 40 48 Z" fill="' + color + '" stroke="#ffffff" stroke-width="2"/>' +
              '<circle cx="50" cy="52" r="10.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.8"/>' +
              '<path d="M 43 49 Q 50 45 57 49 L 56 53 Q 50 50 44 53 Z" fill="#38bdf8"/>' +
              '<path d="M 37 61 Q 50 57 63 61 L 59 71 Q 50 68 41 71 Z" fill="#1e293b"/>' +
              '<rect x="46" y="70" width="8" height="24" rx="3.5" fill="#0f172a" stroke="#64748b" stroke-width="1"/>' +
              '<rect x="56" y="72" width="3.5" height="15" rx="1.5" fill="#94a3b8"/>' +
              '<circle cx="50" cy="92" r="3" fill="#ef4444"/>' +
            '</svg>' +
          '</div>',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });
      }

      function createCarVehicleMarker(heading, isMoving, color) {
        return createVehicleMarker(heading, color || '#0284c7');
      }

      function createTeardropPin(color, dotColor, label, isPulse, forceBirrete) {
        if (!color) color = '#0284c7';
        if (!dotColor) dotColor = '#ffffff';
        var isCampus = forceBirrete || isUniversityCampusLocation(label);
        var birreteHtml = isCampus
          ? '<div style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); width: 30px; height: 20px; pointer-events: none; z-index: 30;">' +
              '<svg viewBox="0 0 32 24" fill="none" style="width: 100%; height: 100%; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));">' +
                '<path d="M 8 10.5 L 8 15.5 C 8 19 24 19 24 15.5 L 24 10.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.3"/>' +
                '<polygon points="16,2 31,8.5 16,15 1,8.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>' +
                '<circle cx="16" cy="8.5" r="1.6" fill="#f59e0b"/>' +
                '<path d="M 16 8.5 Q 25 9.5 27 14.5" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round"/>' +
                '<circle cx="27" cy="15.5" r="2" fill="#f59e0b"/>' +
              '</svg>' +
            '</div>'
          : '';

        var labelHtml = label
          ? '<span style="position: absolute; bottom: ' + (isCampus ? '48px' : '42px') + '; left: 50%; transform: translateX(-50%); background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.25); pointer-events: none; z-index: 40;">' +
              label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            '</span>'
          : '';

        var pulseHtml = isPulse ? '<div class="gps-beacon-ring" style="inset: -4px;"></div>' : '';

        return L.divIcon({
          className: 'custom-teardrop-pin',
          html: '<div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">' +
            pulseHtml +
            '<div style="width: 36px; height: 36px; background: ' + color + '; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 5px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; position: relative; z-index: 10;">' +
              '<div style="width: 11px; height: 11px; background: ' + dotColor + '; border-radius: 50%; transform: rotate(45deg);"></div>' +
            '</div>' +
            birreteHtml +
            labelHtml +
          '</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        });
      }

      function getIconForMarker(m) {
        switch (m.kind) {
          case 'vehicle-car':
            return createCarVehicleMarker(m.rotation || 0, m.isMoving, m.color);
          case 'vehicle-moto':
            return createMotoVehicleMarker(m.rotation || 0, m.isMoving, m.color);
          case 'destination':
          case 'campus':
            return createTeardropPin(m.color || '#10b981', m.dotColor || '#ffffff', m.label || '', m.isLive || m.isPulse, m.forceBirrete !== undefined ? m.forceBirrete : true);
          case 'pickup':
            return createTeardropPin(m.color || '#f59e0b', m.dotColor || '#ffffff', m.label || 'Punto de recogida', false, m.forceBirrete);
          case 'user':
            return createTeardropPin(m.color || '#0284c7', m.dotColor || '#ffffff', m.label || '', m.isLive !== false, false);
          case 'origin':
            return createTeardropPin(m.color || '#0284c7', m.dotColor || '#ffffff', m.label || '', m.isPulse, m.forceBirrete);
          case 'pin':
          default:
            return createTeardropPin(m.color || '#0284c7', m.dotColor || '#ffffff', m.label || '', m.isPulse, m.forceBirrete);
        }
      }

      var map = L.map('map', {
        center: [${initialCenter[0]}, ${initialCenter[1]}],
        zoom: ${initialZoom},
        zoomControl: false,
        attributionControl: false
      });

      var tileLayer = L.tileLayer('${tileUrl}', {
        maxZoom: ${maxZoom},
        attribution: ''
      }).addTo(map);

      var activeMarkers = {};
      var activePolylines = {};

      map.on('click', function(e) {
        postRN({
          type: 'onMapPress',
          coordinate: [e.latlng.lat, e.latlng.lng]
        });
      });

      map.on('moveend', function() {
        var c = map.getCenter();
        postRN({
          type: 'onRegionChangeComplete',
          center: [c.lat, c.lng],
          zoom: map.getZoom()
        });
      });

      window.__uniwheelsMap = {
        setTileProvider: function(url, maxZ) {
          if (tileLayer) {
            tileLayer.setUrl(url);
            if (maxZ) tileLayer.options.maxZoom = maxZ;
          }
        },

        updateMarkers: function(newMarkers) {
          if (!newMarkers || !Array.isArray(newMarkers)) return;
          var newIds = {};
          for (var i = 0; i < newMarkers.length; i++) {
            newIds[newMarkers[i].id] = true;
          }

          // Quitar marcadores eliminados
          for (var id in activeMarkers) {
            if (!newIds[id]) {
              activeMarkers[id].leafletMarker.remove();
              delete activeMarkers[id];
            }
          }

          // Agregar o actualizar marcadores
          for (var j = 0; j < newMarkers.length; j++) {
            var m = newMarkers[j];
            var existing = activeMarkers[m.id];
            var icon = getIconForMarker(m);

            if (!existing) {
              var lm = L.marker(m.coordinate, {
                icon: icon,
                draggable: !!m.draggable
              }).addTo(map);

              if (m.draggable) {
                (function(markerId) {
                  lm.on('dragend', function(e) {
                    var pos = e.target.getLatLng();
                    postRN({
                      type: 'onMarkerDragEnd',
                      id: markerId,
                      coordinate: [pos.lat, pos.lng]
                    });
                  });
                })(m.id);
              }

              activeMarkers[m.id] = { leafletMarker: lm, data: m, currentRotation: m.rotation || 0 };
            } else {
              // Posición
              if (existing.data.coordinate[0] !== m.coordinate[0] || existing.data.coordinate[1] !== m.coordinate[1]) {
                existing.leafletMarker.setLatLng(m.coordinate);
              }

              // Draggable cambio
              if (existing.data.draggable !== m.draggable) {
                if (m.draggable) {
                  existing.leafletMarker.dragging.enable();
                } else {
                  existing.leafletMarker.dragging.disable();
                }
              }

              // Rotación suave o cambio de icono
              var kindChanged = existing.data.kind !== m.kind;
              var labelChanged = existing.data.label !== m.label;
              var colorChanged = existing.data.color !== m.color;
              var movingChanged = existing.data.isMoving !== m.isMoving;
              var pulseChanged = existing.data.isPulse !== m.isPulse || existing.data.isLive !== m.isLive;
              var rotChanged = (existing.data.rotation || 0) !== (m.rotation || 0);

              if (kindChanged || labelChanged || colorChanged || movingChanged || pulseChanged || rotChanged) {
                existing.leafletMarker.setIcon(icon);
                existing.currentRotation = m.rotation || 0;
              }

              existing.data = m;
            }
          }
        },

        updatePolylines: function(newPolylines) {
          if (!newPolylines || !Array.isArray(newPolylines)) return;
          var newIds = {};
          for (var i = 0; i < newPolylines.length; i++) {
            newIds[newPolylines[i].id] = true;
          }

          // Quitar polilíneas eliminadas
          for (var id in activePolylines) {
            if (!newIds[id]) {
              activePolylines[id].leafletPolyline.remove();
              delete activePolylines[id];
            }
          }

          // Agregar o actualizar polilíneas
          for (var j = 0; j < newPolylines.length; j++) {
            var p = newPolylines[j];
            var existing = activePolylines[p.id];
            var styleObj = {
              color: p.color || '#0284c7',
              weight: p.weight !== undefined ? p.weight : 5,
              opacity: p.opacity !== undefined ? p.opacity : 0.9,
              dashArray: p.dashArray || null
            };

            if (!existing) {
              var lp = L.polyline(p.coordinates, styleObj).addTo(map);
              activePolylines[p.id] = { leafletPolyline: lp, data: p };
            } else {
              if (JSON.stringify(existing.data.coordinates) !== JSON.stringify(p.coordinates)) {
                existing.leafletPolyline.setLatLngs(p.coordinates);
              }
              if (
                existing.data.color !== p.color ||
                existing.data.weight !== p.weight ||
                existing.data.opacity !== p.opacity ||
                existing.data.dashArray !== p.dashArray
              ) {
                existing.leafletPolyline.setStyle(styleObj);
              }
              existing.data = p;
            }
          }
        },

        animateTo: function(center, zoom, duration) {
          if (!center) return;
          var dur = (duration !== undefined && duration > 0) ? duration / 1000 : 0.6;
          var targetZoom = zoom !== undefined ? zoom : map.getZoom();
          map.flyTo(center, targetZoom, {
            duration: dur,
            easeLinearity: 0.25
          });
        },

        fitToCoordinates: function(coords, padding, duration) {
          if (!coords || !Array.isArray(coords) || coords.length === 0) return;
          var dur = (duration !== undefined && duration > 0) ? duration / 1000 : 0.5;
          var bounds = L.latLngBounds(coords);
          var options = {
            animate: true,
            duration: dur,
            maxZoom: 17
          };

          if (typeof padding === 'number') {
            options.padding = [padding, padding];
          } else if (padding && typeof padding === 'object') {
            options.paddingTopLeft = [padding.left || padding.paddingSide || 20, padding.top || 20];
            options.paddingBottomRight = [padding.right || padding.paddingSide || 20, padding.bottom || 20];
          }

          map.fitBounds(bounds, options);
        },

        setCenter: function(center, zoom) {
          if (!center) return;
          map.setView(center, zoom !== undefined ? zoom : map.getZoom(), { animate: false });
        },

        invalidateSize: function() {
          map.invalidateSize();
        }
      };

      // Notificar a React Native que Leaflet inicializó
      setTimeout(function() {
        map.invalidateSize();
        postRN({ type: 'onReady' });
      }, 50);
    })();
  </script>
</body>
</html>`;
}
