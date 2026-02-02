import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Users, ChefHat, ArrowRight } from "lucide-react";

const regionColors = {
  nord: "bg-amber-100 text-amber-700",
  sud: "bg-green-100 text-green-700",
  est: "bg-red-100 text-red-700",
  ouest: "bg-blue-100 text-blue-700",
};

const regionLabels = {
  nord: "Afrique du Nord",
  sud: "Afrique du Sud",
  est: "Afrique de l'Est",
  ouest: "Afrique de l'Ouest",
};

const BlogPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState("all");

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const params = regionFilter !== "all" ? `?region=${regionFilter}` : "";
        const response = await axios.get(`${API}/recipes${params}`);
        setRecipes(response.data);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, [regionFilter]);

  const regions = [
    { value: "all", label: "Toutes les régions" },
    { value: "nord", label: "Afrique du Nord" },
    { value: "sud", label: "Afrique du Sud" },
    { value: "est", label: "Afrique de l'Est" },
    { value: "ouest", label: "Afrique de l'Ouest" },
  ];

  return (
    <div className="min-h-screen bg-amber-50" data-testid="blog-page">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-12">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-stone-900 mb-4">
              Blog Recettes Africaines
            </h1>
            <p className="text-lg text-stone-600">
              Découvrez des idées de recettes africaines équilibrées, venues des quatre 
              coins du continent. Des plats authentiques revisités pour votre bien-être.
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border-b border-stone-200 sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-stone-600">Filtrer par région:</span>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[180px] border-stone-200" data-testid="blog-region-filter">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                {regions.map(reg => (
                  <SelectItem key={reg.value} value={reg.value}>
                    {reg.label}
                  </SelectItem>
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
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-80 skeleton" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="font-heading text-xl font-semibold text-stone-900 mb-2">
              Aucune recette trouvée
            </h3>
            <p className="text-stone-500 mb-4">
              Essayez de modifier votre filtre.
            </p>
            <Button 
              onClick={() => setRegionFilter("all")}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Voir toutes les recettes
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-6">
              {recipes.length} recette{recipes.length > 1 ? "s" : ""} trouvée{recipes.length > 1 ? "s" : ""}
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              {recipes.map((recipe, idx) => (
                <Card 
                  key={recipe.id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden border-0 animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  data-testid={`recipe-card-${recipe.id}`}
                >
                  <div className="grid md:grid-cols-2">
                    {/* Image */}
                    <div className="relative h-48 md:h-full overflow-hidden">
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge 
                        className={`absolute top-3 left-3 ${regionColors[recipe.region]} border-0`}
                      >
                        {regionLabels[recipe.region]}
                      </Badge>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-2">
                          {recipe.difficulty}
                        </p>
                        <h3 className="font-heading text-xl font-semibold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors">
                          {recipe.title}
                        </h3>
                        <p className="text-stone-500 text-sm line-clamp-2 mb-4">
                          {recipe.description}
                        </p>
                      </div>

                      <div>
                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-4 text-sm text-stone-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>{recipe.prep_time + recipe.cook_time} min</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-500" />
                            <span>{recipe.serves} pers.</span>
                          </div>
                        </div>

                        {/* Author */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-stone-400">
                            Par {recipe.author}
                          </p>
                          <Link to={`/blog/${recipe.id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 group/btn"
                              data-testid={`view-recipe-btn-${recipe.id}`}
                            >
                              Lire
                              <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
