# ANÁLISIS COMPLETO: scrape-argenprop.ts

## Resumen Ejecutivo

El scraper extrae:
- **28 campos** desde tarjetas de listado en ArgentProp
- **40+ campos** desde páginas de detalle
- **Imágenes** de 6 fuentes diferentes (deduplicadas)
- **Coordenadas geográficas** (Nominatim opcional)
- **URLs a Cloudinary** (inteligración incluida)

## 1. Campos Extraídos Actualmente

### De Tarjetas de Listado (a.card[data-item-card])
- `id` (data-item-card)
- `detailUrl` (href)
- `tipo` (idtipopropiedad)
- `operacion` (idtipooperacion)
- `moneda` (idmoneda)
- `precio` (montonormalizado)
- `direccion` (.card__address)
- `barrio` (data-barrio)
- `ciudad` (parseado)
- `m2Cubiertos` (.card__main-features)
- `dormitorios` (attribute + parsing)
- `antiguedad` (.card__main-features)
- `titulo` (h2.card__title)
- `descripcion` (p.card__info)
- `fotosChico[]` (.card__photos img)
- `aptoBancoCard` (img alt text)
- `permutaCard` (img alt text)
- `expensasCard` (.card__expenses)

### De Páginas de Detalle (ul.property-features)

#### Checklist Items (li.property-features-item)
- `cochera` → /cochera|box|garage/i
- `balcon` → /balc/i
- `jardin` → /jard(in|ín)|parque/i
- `parrilla` → /parrilla|quincho/i
- `pileta` → /pileta|piscina/i
- `aptoBanco` → /(apto.*(cred|cré|prof))/i
- `permuta` → /permuta/i

#### Key-Value Pairs (h3 con strong)
- `banos` → Label /baños?\b|toilette/i, Value regex /(\d+)/
- `ambientes` → Label /ambiente/i, Value regex /(\d+)/
- `m2Totales` → Label /sup\.?\s*total/i, Value regex /([\d.,]+)/
- `m2Cubiertos` → Label /sup\.?\s*cubierta/i, Value regex /([\d.,]+)/
- `m2Terreno` → Label /sup\.?\s*terreno/i, Value regex /([\d.,]+)/
- `m2Descubierta` → Label /sup\.?\s*descubierta/i, Value regex /([\d.,]+)/
- `cantPlantas` → Label /plantas/i, Value regex /(\d+)/
- `piso` → Label /^piso\b/i, Value strongText
- `antiguedad` → Label /antiguedad/i, Value regex /(\d+)/ = "{num} años"
- `expensas` → Label /expensas/i, Value strongText

#### Otras fuentes
- `descripcion` (section#description p - override de listado)
- `fotos[]` (6 fuentes):
  1. JSON-LD script[type="application/ld+json"].image
  2. Hero images (.hero-image [data-open-gallery] style url)
  3. Gallery carousel ([data-url-get-gallery] - llamada API)
  4. Open Graph (meta[property="og:image"])
  5. Image source link (link[rel="image_src"])
  6. Imágenes genéricas (img[src/data-src] filtradas)
- `lat`, `lng` (data-lat/latitude/latitud, data-lng/longitude/longitud)

## 2. Estructura HTML Específica

### Tarjeta de Listado
```html
<a class="card" 
   data-item-card="12345678"
   data-barrio="Centro"
   idtipopropiedad="1"
   idtipooperacion="1"
   idmoneda="2"
   montonormalizado="250000"
   dormitorios="2"
   href="/inmueble/12345678">
  <div class="card__address">Calle 123, Apto 4B</div>
  <p class="card__title--primary">Departamento en Venta en Centro...</p>
  <h2 class="card__title">Venta - 2 ambientes - 52 m2</h2>
  <p class="card__info">Hermoso departamento frente al parque...</p>
  <ul class="card__main-features">
    <li><span>52 m2</span></li>
    <li><span>2 Dorm</span></li>
    <li><span>50 años</span></li>
  </ul>
  <div class="card__expenses">$15,000</div>
  <ul class="card__photos">
    <li>
      <img src="..." alt="Apto profesional" data-src="...">
    </li>
  </ul>
</a>
```

### Página de Detalle (Características)
```html
<ul class="property-features">
  <!-- Checklist item -->
  <li class="property-features-item">
    <h3>Balcón</h3>
  </li>
  
  <!-- Key-value pair -->
  <li>
    <h3>Baños: <strong>2</strong></h3>
  </li>
  
  <!-- Boolean sin label -->
  <li>
    <h3><strong>Apto Profesional</strong></h3>
  </li>
</ul>

<!-- Imágenes -->
<div class="hero-image">
  <div data-open-gallery style="background-image: url('...')"></div>
</div>

<script type="application/ld+json">
{"image": "https://...", ...}
</script>

<div data-url-get-gallery="/api/properties/12345/gallery"></div>

<!-- Coordenadas -->
<div data-lat="-34,94301" data-lng="-57,96254"></div>
```

## 3. Campos DISPONIBLES pero NO EXTRAÍDOS

Estos campos podrían capturarse fácilmente agregando patrones regex:

| Campo | Patrón Regex | Tipo |
|-------|-------------|------|
| disposicion | /(frente\|contrafrente\|interior\|fondo)/i | string |
| orientacion | /(norte\|sur\|este\|oeste)/i | string |
| tipoBalcon | /balc.*?(francés\|inglés\|corrido)/i | string |
| tipoPiso | /(parquet\|cerámica\|laminado)/i | string |
| tipoCosta | /(costa\s+(mar\|río)\|frente\s+(mar\|río))/i | string |
| ascensor | /ascensor/i | boolean |
| calefaccion | /(calefacción\|radiadores)/i | boolean |
| aireAcondicionado | /aire\s+(acondicionado\|ac)/i | boolean |
| portero24h | /(portero\|vigilancia)\s+(24\|permanente)/i | boolean |
| estacionamiento | /(estacionamiento\|parking)/i | boolean |
| amueblado | /amueblado/i | boolean |
| estadoPropiedad | /(a\s+estrenar\|para\s+reformar)/i | string |
| cantDeptosPorPiso | /(deptos?\|dpts?)\s+por\s+piso.*?(\d+)/i | number |
| servicios | agua, gas, electricidad | string[] |

## 4. Flujo de Procesamiento (Líneas 650-923)

### Línea 657: Deduplicación de Fotos
- Agrupa por UUID en URL (`static-content/{tipo}/{uuid}`)
- Prefiere tamaños: `_u_large` (4) > sin `_u_` (3) > `_u_medium` (2) > `_u_small` (1)
- Devuelve array sin duplicados con mejor tamaño

### Líneas 659-660: Cálculos Inteligentes
```typescript
if (ambientes === 0) ambientes = Math.max(dormitorios + 1, 2);
if (banos === 0) banos = Math.max(1, Math.floor(dormitorios / 2));
```

### Líneas 662-693: Construcción EnrichedProperty
- Compila todos los datos en estructura uniforme
- **Aquí es donde agregar nuevos campos**

### Línea 695: Delay
- 1500ms entre propiedades (DELAY_MS)

### Fase 3: Upload a Cloudinary (702-759)
- Para cada foto: `cloudinary.uploader.upload()`
- public_id: `argenprop-{id}-{j}`
- folder: `"comesana-propiedades"`
- Reemplaza URLs locales por Cloudinary URLs

### Fase 3.5: Geocoding (823-890) [OPCIONAL --geocode]
- Nominatim OpenStreetMap
- Query: `"{dir}, {barrio}, {ciudad}, Argentina"`
- Solo si no tiene lat/lng
- Delay: 1000ms entre requests

### Fase 4: CSV Generation (761-821)
- Header: 29 campos
- Body: 1 fila por propiedad
- Fotos: unidas con `|`
- BOM UTF-8 para Excel
- Output: `{CWD}/datos-argenprop.csv`

## 5. Recomendaciones para Capturar Más Campos

### Paso 1: Extender EnrichedProperty Interface
```typescript
interface EnrichedProperty {
  // ... campos actuales ...
  disposicion?: string;
  orientacion?: string;
  tipoBalcon?: string;
  tipoPiso?: string;
  tipoCosta?: string;
  servicios?: string[];
  cantDeptosPorPiso?: number;
  estadoPropiedad?: string;
  ascensor?: boolean;
  calefaccion?: boolean;
  aireAcondicionado?: boolean;
}
```

### Paso 2: Extender scrapeDetails() (línea 480)
Agregar a la búsqueda en `.property-features`:
```typescript
if (/disposicion/i.test(lLow)) disposicion = strongText;
if (/orientacion/i.test(lLow)) orientacion = strongText;
if (/balc.*tipo/i.test(lLow)) tipoBalcon = strongText;
if (/piso.*tipo/i.test(lLow)) tipoPiso = strongText;
if (/ascensor/i.test(tLow)) ascensor = true;
```

### Paso 3: Actualizar CSV Header (línea 766)
```typescript
const header = "...existing...,disposicion,orientacion,tipo_balcon,tipo_piso,...";
```

### Paso 4: Actualizar generateCsv() (línea 774)
```typescript
p.disposicion || "",
p.orientacion || "",
p.tipoBalcon || "",
```

## 6. Notas Críticas

### Coordenadas
- ArgentProp usa **COMA** como separador: `"-34,94301"`
- `parseCoord()` convierte automáticamente a punto

### Deduplicación de Fotos
- Agrupa por UUID en URL
- Prefiere tamaños mayores
- Devuelve array sin duplicados

### Valores Calculados
- `ambientes = max(dorms + 1, 2)` si falta
- `banos = max(1, floor(dorms / 2))` si faltan

### CSV con Excel
- BOM UTF-8 (`\uFEFF`) necesario para caracteres acentuados
- Escaping CSV correcto con comillas

### Delays
- 1500ms entre propiedades
- 500ms entre fotos de misma propiedad
- 1000ms entre requests de Nominatim

## 7. Patrones Regex Utilizados

### Búsqueda de Labels
```regex
/baños?\b|toilette/i        → Baños
/ambiente/i                 → A
