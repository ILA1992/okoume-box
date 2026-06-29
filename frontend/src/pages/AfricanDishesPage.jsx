import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";

// Coordonnées SVG pour les 25 pays (viewBox "0 0 100 110")
const COUNTRY_MAP_POINTS = {
  // Maghreb
  MA: { x: 18, y: 19, label: "Maroc" },
  DZ: { x: 30, y: 16, label: "Algérie" },
  TN: { x: 38, y: 14, label: "Tunisie" },
  LY: { x: 46, y: 18, label: "Libye" },
  MR: { x: 14, y: 27, label: "Mauritanie" },
  // Afrique de l'Ouest
  SN: { x: 14, y: 34, label: "Sénégal" },
  GN: { x: 18, y: 42, label: "Guinée" },
  ML: { x: 26, y: 30, label: "Mali" },
  BF: { x: 30, y: 37, label: "Burkina Faso" },
  CI: { x: 24, y: 46, label: "Côte d'Ivoire" },
  GH: { x: 30, y: 46, label: "Ghana" },
  NG: { x: 40, y: 41, label: "Nigeria" },
  // Afrique Centrale
  CM: { x: 46, y: 45, label: "Cameroun" },
  GA: { x: 48, y: 53, label: "Gabon" },
  CG: { x: 52, y: 55, label: "Congo-Brazzaville" },
  CD: { x: 58, y: 55, label: "RD Congo" },
  "RW-BI": { x: 63, y: 55, label: "Rwanda & Burundi" },
  // Afrique de l'Est
  ET: { x: 65, y: 38, label: "Éthiopie" },
  KE: { x: 67, y: 48, label: "Kenya" },
  TZ: { x: 65, y: 58, label: "Tanzanie" },
  MZ: { x: 64, y: 68, label: "Mozambique" },
  // Afrique Australe
  ZA: { x: 54, y: 82, label: "Afrique du Sud" },
  ZW: { x: 60, y: 72, label: "Zimbabwe" },
  NA: { x: 48, y: 76, label: "Namibie" },
  MG: { x: 75, y: 67, label: "Madagascar" },
};

const countryMeta = {
  SN: { region: "Afrique de l'Ouest", ethnicity: "Wolof, Sérère, Peul", cuisine: "Cuisine sénégalaise" },
  NG: { region: "Afrique de l'Ouest", ethnicity: "Yoruba, Igbo, Hausa", cuisine: "Cuisine nigériane" },
  GH: { region: "Afrique de l'Ouest", ethnicity: "Akan, Ewe, Ga", cuisine: "Cuisine ghanéenne" },
  CI: { region: "Afrique de l'Ouest", ethnicity: "Baoulé, Bété, Akan", cuisine: "Cuisine ivoirienne" },
  ML: { region: "Afrique de l'Ouest", ethnicity: "Bambara, Peul, Songhai", cuisine: "Cuisine malienne" },
  BF: { region: "Afrique de l'Ouest", ethnicity: "Mossi, Fulani, Bobo", cuisine: "Cuisine burkinabè" },
  GN: { region: "Afrique de l'Ouest", ethnicity: "Soussou, Malinké, Peul", cuisine: "Cuisine guinéenne" },
  CM: { region: "Afrique Centrale", ethnicity: "Bamiléké, Bassa, Beti", cuisine: "Cuisine camerounaise" },
  CD: { region: "Afrique Centrale", ethnicity: "Kongo, Luba, Mongo", cuisine: "Cuisine congolaise (RDC)" },
  CG: { region: "Afrique Centrale", ethnicity: "Kongo, Teke, Mbochi", cuisine: "Cuisine congolaise (Brazzaville)" },
  GA: { region: "Afrique Centrale", ethnicity: "Fang, Punu, Nzebi", cuisine: "Cuisine gabonaise" },
  "RW-BI": { region: "Afrique Centrale", ethnicity: "Hutu, Tutsi, Twa", cuisine: "Cuisine rwando-burundaise" },
  MA: { region: "Maghreb", ethnicity: "Berbères, Arabes", cuisine: "Cuisine marocaine" },
  DZ: { region: "Maghreb", ethnicity: "Berbères, Arabes", cuisine: "Cuisine algérienne" },
  TN: { region: "Maghreb", ethnicity: "Arabes, Berbères", cuisine: "Cuisine tunisienne" },
  LY: { region: "Maghreb", ethnicity: "Arabes, Berbères, Touaregs", cuisine: "Cuisine libyenne" },
  MR: { region: "Maghreb", ethnicity: "Maures, Haratines, Peul", cuisine: "Cuisine mauritanienne" },
  ET: { region: "Afrique de l'Est", ethnicity: "Oromo, Amhara, Tigrigna", cuisine: "Cuisine éthiopienne" },
  KE: { region: "Afrique de l'Est", ethnicity: "Kikuyu, Luo, Kamba", cuisine: "Cuisine kényane" },
  TZ: { region: "Afrique de l'Est", ethnicity: "Sukuma, Chagga, Maasai", cuisine: "Cuisine tanzanienne" },
  MZ: { region: "Afrique de l'Est", ethnicity: "Makua, Tsonga, Shona", cuisine: "Cuisine mozambicaine" },
  ZA: { region: "Afrique Australe", ethnicity: "Zulu, Xhosa, Sotho", cuisine: "Cuisine sud-africaine" },
  ZW: { region: "Afrique Australe", ethnicity: "Shona, Ndebele", cuisine: "Cuisine zimbabwéenne" },
  NA: { region: "Afrique Australe", ethnicity: "Ovambo, Herero, San", cuisine: "Cuisine namibienne" },
  MG: { region: "Afrique Australe", ethnicity: "Merina, Betsileo, Sakalava", cuisine: "Cuisine malgache" },
};

const REGION_COLORS = {
  "Afrique de l'Ouest": "#F59E0B",
  "Afrique Centrale": "#10B981",
  "Maghreb": "#3B82F6",
  "Afrique de l'Est": "#8B5CF6",
  "Afrique Australe": "#EF4444",
};

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const AfricaMap = ({ countries, selectedCode, onSelectCountry }) => {
  const markerList = countries
    .map((country) => ({
      code: country.code,
      region: country.region,
      ...COUNTRY_MAP_POINTS[country.code],
    }))
    .filter((m) => m.x !== undefined);

  return (
    <div className="rounded-3xl overflow-hidden bg-stone-900 p-4 text-white shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Carte interactive</p>
          <h2 className="font-heading text-xl font-bold">Afrique — {countries.length} pays</h2>
        </div>
        <p className="text-xs text-stone-400 max-w-[140px] text-right">Cliquez sur un pays pour ses plats</p>
      </div>
      <div className="relative w-full overflow-hidden" style={{ paddingTop: "100%" }}>
        <svg viewBox="0 0 100 110" className="absolute inset-0 w-full h-full">
          {/* Silhouette Afrique simplifiée */}
          <path
            d="M14 18 L18 16 L30 14 L40 16 L52 22 L58 34 L62 44 L67 56 L69 68 L68 80 L60 90 L48 95 L36 92 L28 86 L22 74 L18 62 L14 48 Z"
            fill="#F59E0B"
            fillOpacity="0.12"
            stroke="#FBBF24"
            strokeWidth="0.8"
          />
          {/* Madagascar */}
          <ellipse cx="75" cy="67" rx="4" ry="8" fill="#F59E0B" fillOpacity="0.12" stroke="#FBBF24" strokeWidth="0.8" />
          {markerList.map((marker) => {
            const isSelected = selectedCode === marker.code;
            const color = REGION_COLORS[marker.region] || "#FBBF24";
            return (
              <g key={marker.code} className="cursor-pointer" onClick={() => onSelectCountry(marker.code)}>
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={isSelected ? 4.5 : 3}
                  fill={isSelected ? color : "#FBBF24"}
                  stroke="#fff"
                  strokeWidth="0.7"
                  opacity={isSelected ? 1 : 0.85}
                />
                {isSelected && (
                  <circle cx={marker.x} cy={marker.y} r={6.5} fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
                )}
                <text x={marker.x + 4.5} y={marker.y + 1.5} fontSize="3.2" fill="#fff" opacity="0.9">
                  {marker.code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Légende régions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(REGION_COLORS).map(([region, color]) => (
          <span key={region} className="flex items-center gap-1 text-xs text-stone-300">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
            {region}
          </span>
        ))}
      </div>
    </div>
  );
};

const AfricanDishesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState("all");
  const [selectedCountryCode, setSelectedCountryCode] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Chargement depuis le fichier statique — fonctionne sans backend
    axios.get("/plats_africains.json")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(() => {
    if (!data) return [];
    return data.regions.flatMap((region) =>
      region.pays.map((pays) => ({ ...pays, region: region.region }))
    );
  }, [data]);

  const filteredCountries = useMemo(() => {
    let list = regionFilter === "all" ? countries : countries.filter((c) => c.region === regionFilter);
    if (selectedCountryCode) {
      list = list.filter((c) => c.code.toLowerCase() === selectedCountryCode.toLowerCase());
    }
    return list;
  }, [countries, regionFilter, selectedCountryCode]);

  const displayCountries = useMemo(() => {
    if (!search.trim()) return filteredCountries;
    const q = search.toLowerCase();
    return filteredCountries
      .map((country) => ({
        ...country,
        plats: country.plats.filter(
          (p) =>
            p.nom.toLowerCase().includes(q) ||
            (p.nom_local || "").toLowerCase().includes(q) ||
            (p.description || "").toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.plats.length > 0);
  }, [filteredCountries, search]);

  const regionOptions = useMemo(() => [
    { value: "all", label: "Toutes les régions" },
    ...( data?.regions.map((r) => ({ value: r.region, label: r.region })) || []),
  ], [data]);

  const totalPlats = useMemo(() => displayCountries.reduce((acc, c) => acc + c.plats.length, 0), [displayCountries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-stone-900">Données introuvables</h2>
          <p className="text-stone-500 mt-2">Impossible de charger les plats africains.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50" data-testid="african-dishes-page">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white">
        <div className="container-custom py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-amber-200 text-sm uppercase tracking-widest mb-2">Gastronomie africaine</p>
              <h1 className="font-heading text-4xl md:text-5xl font-bold">Plats Africains</h1>
              <p className="text-amber-100 max-w-2xl mt-4">
                {data.total_plats} plats traditionnels · {data.regions?.length} régions · {countries.length} pays
              </p>
            </div>
            <Link to="/catalogue">
              <Button className="bg-white text-amber-600 hover:bg-amber-50 rounded-full px-6 py-4">
                Voir nos box <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container-custom py-12 space-y-10">
        {/* Carte + Filtres */}
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="space-y-5">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher un plat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-full border border-stone-200 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            {/* Filtres régions */}
            <div className="flex flex-wrap gap-2">
              {regionOptions.map((r) => (
                <button
                  key={r.value}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    regionFilter === r.value && !selectedCountryCode
                      ? "bg-amber-600 text-white"
                      : "bg-white text-stone-700 hover:bg-amber-100"
                  }`}
                  onClick={() => {
                    setRegionFilter(r.value);
                    setSelectedCountryCode(null);
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {selectedCountryCode && (
              <button
                className="text-sm text-amber-600 underline"
                onClick={() => setSelectedCountryCode(null)}
              >
                ← Tous les pays
              </button>
            )}
            <p className="text-stone-500 text-sm">
              {totalPlats} plat{totalPlats > 1 ? "s" : ""} · {displayCountries.length} pays
            </p>
          </div>
          <AfricaMap
            countries={countries}
            selectedCode={selectedCountryCode}
            onSelectCountry={(code) => {
              setRegionFilter("all");
              setSelectedCountryCode((prev) => (prev === code ? null : code));
            }}
          />
        </div>

        {/* Grille pays + plats */}
        <div className="grid xl:grid-cols-2 gap-6">
          {displayCountries.map((country) => {
            const regionColor = REGION_COLORS[country.region] || "#F59E0B";
            return (
              <Card key={country.code} className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  {/* En-tête pays */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div>
                      <h3 className="font-heading text-xl font-semibold text-stone-900">{country.pays}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{country.region}</p>
                    </div>
                    <Badge
                      className="border-0 text-white text-xs px-3 py-1"
                      style={{ backgroundColor: regionColor }}
                    >
                      {country.plats.length} plats
                    </Badge>
                  </div>
                  {/* Liste plats */}
                  <div className="grid gap-3">
                    {country.plats.map((plat) => (
                      <Link
                        key={plat.nom}
                        to={`/plats-africains/${country.code.toLowerCase()}/${slugify(plat.nom)}`}
                        className="block rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-stone-900 truncate">{plat.nom}</p>
                            {plat.nom_local && plat.nom_local !== plat.nom && (
                              <p className="text-xs text-stone-500 italic">{plat.nom_local}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge className="bg-white text-stone-600 border border-stone-200 text-xs">{plat.type}</Badge>
                            {plat.statut === "Plat national" || plat.patrimoine ? (
                              <span className="text-xs text-amber-600 font-medium">
                                {plat.patrimoine || plat.statut}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-sm text-stone-600 mt-2 line-clamp-2">{plat.description}</p>
                        {plat.regime && (
                          <span className="mt-2 inline-block rounded-full bg-white border border-stone-200 px-2 py-0.5 text-xs text-stone-500">
                            {plat.regime}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {displayCountries.length === 0 && (
          <div className="text-center py-16">
            <p className="text-stone-500 text-lg">Aucun plat trouvé pour « {search} »</p>
            <button className="mt-4 text-amber-600 underline text-sm" onClick={() => setSearch("")}>
              Effacer la recherche
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AfricanDishesPage;
