import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, ChefHat, ArrowRight } from "lucide-react";

const BlogPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");

  useEffect(() => {
    axios.get(`${API}/countries`).then(res => setCountries(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const params = countryFilter !== "all" ? `?country=${countryFilter}` : "";
    axios.get(`${API}/recipes${params}`)
      .then(res => setRecipes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [countryFilter]);

  const getCountryData = (countryId) => {
    const c = countries.find(x => x.id === countryId);
    return c || { name: countryId, flag: "🌍" };
  };

  return (
    <div className="min-h-screen bg-orange-50" data-testid="blog-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="container-custom py-16">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Blog Recettes Africaines</h1>
          <p className="text-lg text-orange-100 max-w-2xl">
            Découvrez les secrets des plats emblématiques d'Afrique. Recettes authentiques revisitées healthy.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border-b border-stone-200 sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-stone-600">Filtrer par pays:</span>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[180px] border-stone-200" data-testid="blog-country-filter">
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                {countries.filter(c => c.id !== "multi").map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.flag} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-8">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-80 skeleton" />)}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-10 h-10 text-orange-600 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">Aucune recette trouvée</h3>
            <Button onClick={() => setCountryFilter("all")} className="bg-orange-600 hover:bg-orange-700">Voir toutes</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-6">{recipes.length} recette{recipes.length > 1 ? "s" : ""}</p>
            <div className="grid md:grid-cols-2 gap-8">
              {recipes.map((recipe, idx) => {
                const countryData = getCountryData(recipe.country);
                return (
                  <Card key={recipe.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden border-0 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }} data-testid={`recipe-card-${recipe.id}`}>
                    <div className="grid md:grid-cols-2">
                      <div className="relative h-48 md:h-full overflow-hidden">
                        <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <Badge className="absolute top-3 left-3 bg-white/95 text-stone-800 border-0 font-semibold">
                          {countryData.flag} {countryData.name}
                        </Badge>
                      </div>
                      <CardContent className="p-6 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-2">{recipe.difficulty}</p>
                          <h3 className="font-heading text-xl font-semibold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">{recipe.title}</h3>
                          <p className="text-stone-500 text-sm line-clamp-2 mb-4">{recipe.description}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-4 text-sm text-stone-600">
                            <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-orange-500" /><span>{recipe.prep_time + recipe.cook_time} min</span></div>
                            <div className="flex items-center gap-1"><Users className="w-4 h-4 text-orange-500" /><span>{recipe.serves} pers.</span></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-stone-400">Par {recipe.author}</p>
                            <Link to={`/blog/${recipe.id}`}>
                              <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 group/btn" data-testid={`view-recipe-btn-${recipe.id}`}>
                                Lire <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
