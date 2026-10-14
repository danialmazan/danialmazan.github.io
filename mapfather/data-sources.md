# The Mapfather dataset, v1

The app ships a fixed local dataset; no data service is queried while playing.

## Provenance and licences

- [Natural Earth admin-0 map units](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-details/) and [land](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/), 1:10m, pinned to the [5.1.2 repository tag](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2). [Public domain](https://www.naturalearthdata.com/about/terms-of-use/).
- [World Bank WDI population, SP.POP.TOTL](https://data.worldbank.org/indicator/SP.POP.TOTL), reference year **2024**, retrieved 12 October 2026; the API reports last updated **8 October 2026**. [CC BY 4.0 with World Bank terms](https://datacatalog.worldbank.org/public-licenses). Attribution: World Bank, World Development Indicators. Country filtering and translations were applied; the population numbers were not changed. Vatican City has no World Bank observation and remains `null` / N/A. No estimates were invented.
- Vatican boundary: [geoBoundaries gbOpen VAT ADM0](https://www.geoboundaries.org/api/current/gbOpen/VAT/ADM0/), ID `VAT-ADM0-52476719`, [repository revision 9469f09](https://github.com/wmgeolab/geoBoundaries/tree/9469f09/releaseData/gbOpen/VAT/ADM0). Reference year 2017, built 12 December 2023. Its metadata identifies geoBoundaries / Wikimedia Commons as the source and **Public Domain** as the licence. This replaces Natural Earth's 0.01 km² generalised Vatican polygon with a roughly 0.51 km² digitised boundary. It remains a cartographic boundary with source limitations.
- Fonts: DM Sans and Fraunces via Fontsource, SIL Open Font License 1.1; licence files accompany the npm packages.

Source hashes are recorded in `source-lock.json`. The small mutable population and Vatican source snapshots are committed under `snapshots/`. Natural Earth is downloaded from its fixed tag. Rebuilding with the lockfile preserves the simplification algorithm. Country names, aliases, continents and IDs are frozen in `country-metadata-v1.json`; names initially used Node 25 ICU region names with curated overrides. Do not edit the fixed daily schedule during a routine dataset update.

## Inclusion and territory definition

Exactly **195 playable countries**: the [193 UN members](https://www.un.org/en/about-us/member-states) plus the [Holy See and State of Palestine observers](https://www.un.org/en/about-us/non-member-states). IDs use ISO alpha-3; source codes `PSX` and `SDS` map to `PSE` and `SSD`. Kosovo, Taiwan, dependencies and Antarctica are not answers. Excluded territories can still appear as unlabelled land on the coastline map.

Countries aggregate Natural Earth map units with matching `ADM0_A3`, subject to these explicit exceptions:

| Country | Included units / treatment |
| --- | --- |
| France | FXX, GUF, GLP, MTQ, REU, MYT: metropolitan France/Corsica and all five overseas departments. Excludes French Polynesia, New Caledonia, Saint Pierre and Miquelon, Saint Martin, Saint Barthélemy, Clipperton and southern/Antarctic dependencies. |
| Spain | ESP geometry includes the mainland, Balearics, Canary Islands, Ceuta, Melilla and represented small coastal possessions. Gibraltar is excluded. |
| United States | USA, including Alaska, Hawaii and represented integral islands. Puerto Rico, Guam, American Samoa, US Virgin Islands, Northern Mariana Islands and US Minor Outlying Islands units are excluded. |
| United Kingdom | England, Wales, Scotland, Northern Ireland. Crown dependencies and overseas territories are excluded. |
| Netherlands | NLX and NLY (European Netherlands and the integral Caribbean municipalities); Aruba, Curaçao and Sint Maarten are excluded. |
| Norway | NOW, NJM, NSV (mainland, Jan Mayen, Svalbard); Bouvet and Antarctic dependencies are excluded. |
| New Zealand | NZL, including represented detached islands; Tokelau, Cook Islands and Niue are excluded. |
| China | CHN with Hong Kong and Macao integral SARs. Taiwan and the separate disputed Paracel unit are excluded. |
| Palestine | West Bank and Gaza source map units. |
| Vatican City | Supplementary geoBoundaries geometry replaces the generalised Natural Earth map unit. |

Other countries retain the matching Natural Earth national map units. This is a curated game definition, not automatic aggregation by administering sovereign. Natural Earth uses de facto cartographic treatments for disputed areas; for example Cyprus does not include the separate Northern Cyprus or British base-area units, and Serbia does not include Kosovo. Source geometry and statistics may consequently cover different territorial definitions. Population is World Bank's national series; area is the exact curated game territory. The full unit list is bundled with each country's metadata for audit.

## Continents

Six continents: Europe, Asia, Africa, North America, South America, Oceania. **North America and South America are separate.** Use one primary continent from the source's UN-style classification, overriding Maldives and Timor-Leste to Asia and Seychelles/Mauritius to Africa. Russia and Türkiye are both Europe and Asia. Overseas units do not change the primary continent. Kazakhstan is Asia; Egypt is Africa; France is Europe. Matching means a non-empty intersection of assigned continents.

## Geometry, area and rendering

- Detailed scoring geometry retains all selected 1:10m source vertices, rounded to six decimal degrees (roughly 0.1 m at the equator); rounding is much smaller than the source's positional uncertainty.
- Area is Turf's spherical surface area of these curated land polygons minus interior holes, in km², rounded to two decimals. It is a consistent derived measurement, not an official administrative area or a land-area series from a different vintage.
- Display countries use adaptive Douglas–Peucker simplification, never more than 0.025°. Land has two adaptive LODs, 0.045° initially and 0.003° above 6× zoom. Per-country display geometries are fetched only for the current map stage. Tiny components get smaller tolerances so islands survive. Display polygon winding is checked using spherical D3 area, including antimeridian components.
- Silhouettes group neighbouring components, use north-up local equirectangular coordinates with latitude correction, and fit each group to an independent inset. The main group is chosen by land area. Distant territory groups use insets with no region labels; shapes retain proportions within each panel, and **insets are not to a common scale**. Relative distances across inset panels are intentionally not preserved.
- The map uses D3's Natural Earth projection. SVG zoom/pan transforms are inverted before projection inversion, so scoring always receives geographic coordinates. Zoom up to 4,096×, centre-crosshair selection, keyboard panning and manual coordinates support small islands and microstates. No point is snapped toward the answer.

## Location scoring

Containment tests include polygon boundaries and use unwrapped longitudes so dateline-crossing rings and holes work. A point inside or on the boundary earns 50. For an outside point, Turf `nearestPointOnLine` searches every exterior and hole boundary segment using great-circle closest-point calculations. The nearest distance is used across every national component. This is **not** a centroid or capital distance.

`round(40 × exp(−distanceKm / 1000))`, clamped to 0–40, is the outside bonus. The internal 1,000 km decay is configurable in `src/lib/geometry.ts`. Distances use a spherical Earth (Turf's mean radius), not an ellipsoidal survey calculation. The geographic score is independent of the silhouette score.

## Known limitations

Natural Earth is a 1:10m cartographic dataset, not a cadastral or coastline survey. Small islets, reclaimed coastlines and complex disputed areas can be missing or generalised. Map LODs introduce additional visual simplification; scoring uses the detailed curated boundaries. Inside classifications very close to a coastline inherit the source's uncertainty. Vatican has a different documented source vintage. No sea or maritime claims are included. France's World Bank population coverage and the curated land geometry are not a guarantee of identical statistical scope. Different source vintages and territorial treatment are disclosed in the rules.
