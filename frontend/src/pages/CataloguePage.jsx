import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { BoxCard } from "@/components/BoxCard";
import { Sparkles, Clock, Users, Flame, ArrowRight, Leaf, Wheat, Search, X, SlidersHorizontal } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "Toutes", emoji: "🍽️" },
  { value: "signature", label: "Signature", emoji: "⭐" },
  { value: "decouverte", label: "Découverte", emoji: "🌱" },
  { value: "multi-pays", label: "Multi-Pays", emoji: "🌍" },
];

const CataloguePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Read country param from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const c = params.get("country");
    if (c) setCountryFilter(c);
  }, [location.search]);

  useEffect(() => {
    axios.get(`${API}/countries`).then(res => setCountries(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (countryFilter !== "all") params.append("country", countryFilter);
    if (categoryFilter !== "all") params.append("category", categoryFilter);
    axios.get(`${API}/boxes?${params.toString()}`)
      .then(res => setBoxes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [countryFilter, categoryFilter]);

  const handleReset = () => {
    setCountryFilter("all");
    setCategoryFilter("all");
    setSearch("");
    navigate("/catalogue");
  };

  const filteredBoxes = boxes.filter(box => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      box.name.toLowerCase().includes(q) ||
      box.description.toLowerCase().includes(q) ||
      (box.dishes || []).some(d => d.name.toLowerCase().includes(q))
    );
  });

  const hasActiveFilters = countryFilter !== "all" || categoryFilter !== "all" || search.trim();
  const selectedCountry = countries.find(c => c.id === countryFilter);

  return (
    <div className="min-h-screen bg-orange-50" data-testid="catalogue-page">
      {/* Header */}
      <div className="bg-stone-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="adinkra-cat" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="22" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <circle cx="30" cy="30" r="12" fill="none" stroke="#d97706" strokeWidth="1" />
                <line x1="8" y1="30" x2="52" y2="30" stroke="#d97706" strokeWidth="1" />
                <line x1="30" y1="8" x2="30" y2="52" stroke="#d97706" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#adinkra-cat)" />
          </svg>
        </div>
        <div className="container-custom py-14 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {selectedCountry && (
                  <span className="text-2xl">{selectedCountry.flag}</span>
                )}
                <h1 className="font-heading text-4xl md:text-5xl font-bold">
                  {selectedCountry ? `Box ${selectedCountry.name}` : "Nos Okoumé Box"}
                </h1>
              </div>
              <p className="text-stone-400 max-w-2xl">
                {selectedCountry
                  ? `Découvrez les plats authentiques du ${selectedCountry.name}.`
                  : "Plats authentiques d'Afrique Centrale & de l'Ouest — Gabon, Cameroun, Côte d'Ivoire, Congo et Sénégal."}
              </p>
            </div>
            <Button
              onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()}
              className="hidden md:flex bg-orange-600 hover:bg-orange-500 text-white rounded-full px-5 shadow-lg"
              data-testid="personalize-btn"
            >
              <Sparkles className="w-4 h-4 mr-2" />IA Personnalisée
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-stone-200 sticky top-16 md:top-20 z-40 shadow-sm">
        <div className="container-custom py-3">
          {/* Country pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => { setCountryFilter("all"); navigate("/catalogue"); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border
                ${countryFilter === "all"
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"}`}
              data-testid="country-filter-all"
            >
              🌍 Tous les pays
            </button>
            {countries.filter(c => c.id !== "multi").map(c => (
              <button
                key={c.id}
                onClick={() => { setCountryFilter(c.id); navigate(`/catalogue?country=${c.id}`); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border
                  ${countryFilter === c.id
                    ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                    : "bg-white text-stone-600 border-stone-200 hover:border-orange-400 hover:bg-orange-50"}`}
                data-testid={`country-filter-${c.id}`}
              >
                {c.flag} {c.name}
              </button>
            ))}
          </div>

          {/* Second row: category + search + reset */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Category pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                    ${categoryFilter === cat.value
                      ? "bg-orange-100 text-orange-700 border-amber-300"
                      : "bg-transparent text-stone-500 border-stone-200 hover:border-stone-300"}`}
                  data-testid={`category-filter-${cat.value}`}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un plat..."
                className="pl-9 pr-4 py-1.5 rounded-full border border-stone-200 text-sm focus:outline-none focus:border-orange-400 bg-orange-50/50 w-48"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-stone-400" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-orange-600 underline underline-offset-2"
              >
                <X className="w-3 h-3" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl h-[480px] skeleton" />)}
          </div>
        ) : filteredBoxes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="font-heading text-xl font-semibold mb-2">Aucune box trouvée</h3>
            <p className="text-stone-500 mb-6 text-sm">Essayez d'autres filtres ou réinitialisez la recherche.</p>
            <Button onClick={handleReset} className="bg-orange-600 hover:bg-orange-700 rounded-full px-8">
              Voir toutes les box
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-stone-500">
                <span className="font-semibold text-stone-800">{filteredBoxes.length}</span> box{filteredBoxes.length > 1 ? "s" : ""} disponible{filteredBoxes.length > 1 ? "s" : ""}
                {countryFilter !== "all" && selectedCountry && (
                  <span className="ml-1">· {selectedCountry.flag} {selectedCountry.name}</span>
                )}
              </p>
              <Button
                onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()}
                variant="outline"
                size="sm"
                className="md:hidden border-orange-600 text-orange-600 hover:bg-orange-50 rounded-full"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />IA
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBoxes.map((box) => (
                <BoxCard key={box.id} box={box} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CataloguePage;
