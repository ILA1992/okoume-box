import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Filter, Sparkles, Clock, Users, Flame, ArrowRight, Leaf, Wheat } from "lucide-react";

const CataloguePage = () => {
  const [boxes, setBoxes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    axios.get(`${API}/countries`).then(res => setCountries(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (countryFilter !== "all") params.append("country", countryFilter);
    if (categoryFilter !== "all") params.append("category", categoryFilter);
    axios.get(`${API}/boxes?${params.toString()}`)
      .then(res => setBoxes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [countryFilter, categoryFilter]);

  const categories = [
    { value: "all", label: "Toutes les box" },
    { value: "signature", label: "Box Signature" },
    { value: "decouverte", label: "Box Découverte" },
    { value: "multi-pays", label: "Box Multi-Pays" }
  ];

  return (
    <div className="min-h-screen bg-amber-50" data-testid="catalogue-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white">
        <div className="container-custom py-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Nos Box Téré</h1>
          <p className="text-lg text-amber-100 max-w-2xl">
            Plats authentiques d'Afrique Centrale & de l'Ouest. Gabon, Cameroun, Côte d'Ivoire, Congo et Sénégal.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-stone-200 sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-stone-600">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtrer:</span>
              </div>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[180px] border-stone-200" data-testid="country-filter">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.flag} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] border-stone-200" data-testid="category-filter">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50"
              onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()} data-testid="personalize-btn">
              <Sparkles className="w-4 h-4 mr-2" />Personnaliser avec IA
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl h-[450px] skeleton" />)}
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="font-heading text-xl font-semibold mb-2">Aucune box trouvée</h3>
            <Button onClick={() => { setCountryFilter("all"); setCategoryFilter("all"); }} className="bg-amber-600 hover:bg-amber-700">
              Réinitialiser
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-6">{boxes.length} box{boxes.length > 1 ? "s" : ""} disponible{boxes.length > 1 ? "s" : ""}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {boxes.map((box, idx) => (
                <Card key={box.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-0 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }} data-testid={`box-card-${box.id}`}>
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img src={box.image_url} alt={box.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {/* Country Badge */}
                    <Badge className="absolute top-3 left-3 bg-white/95 text-stone-800 border-0 font-semibold text-sm">
                      {box.country_flag} {countries.find(c => c.id === box.country)?.name || box.country}
                    </Badge>
                    {/* Diet Badges */}
                    <div className="absolute top-3 right-3 flex gap-1">
                      {box.is_vegetarian && <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center" title="Végétarien"><Leaf className="w-4 h-4 text-white" /></div>}
                      {box.is_gluten_free && <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center" title="Sans gluten"><Wheat className="w-4 h-4 text-white" /></div>}
                    </div>
                    {/* Price */}
                    <div className="absolute bottom-3 right-3 bg-amber-600 text-white rounded-full px-4 py-1.5">
                      <span className="font-heading text-lg font-bold">{box.price.toFixed(0)}€</span>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-5">
                    <h3 className="font-heading text-lg font-bold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">{box.name}</h3>
                    <p className="text-stone-500 text-sm mb-4 line-clamp-2">{box.description}</p>

                    {/* Dishes Preview */}
                    {box.dishes && box.dishes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">{box.dishes.length} plats inclus</p>
                        <div className="flex flex-wrap gap-1">
                          {box.dishes.slice(0, 3).map((dish, i) => (
                            <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">{dish.name}</span>
                          ))}
                          {box.dishes.length > 3 && <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">+{box.dishes.length - 3}</span>}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-stone-600">
                      <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-amber-500" /><span>{box.prep_time}min</span></div>
                      <div className="flex items-center gap-1"><Users className="w-4 h-4 text-amber-500" /><span>{box.serves} pers.</span></div>
                      <div className="flex items-center gap-1"><Flame className="w-4 h-4 text-amber-500" /><span>{box.calories}kcal</span></div>
                    </div>

                    {/* CTA */}
                    <Link to={`/box/${box.id}`}>
                      <Button variant="ghost" className="w-full justify-between text-amber-600 hover:text-amber-700 hover:bg-amber-50 group/btn" data-testid={`view-box-btn-${box.id}`}>
                        Voir la box
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CataloguePage;
