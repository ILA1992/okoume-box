import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import BoxCard from "@/components/BoxCard";
import { Filter, Grid3X3, LayoutList, Sparkles } from "lucide-react";

const CataloguePage = () => {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        const params = new URLSearchParams();
        if (categoryFilter !== "all") params.append("category", categoryFilter);
        if (regionFilter !== "all") params.append("region", regionFilter);
        
        const response = await axios.get(`${API}/boxes?${params.toString()}`);
        setBoxes(response.data);
      } catch (error) {
        console.error("Error fetching boxes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoxes();
  }, [categoryFilter, regionFilter]);

  const categories = [
    { value: "all", label: "Toutes les box" },
    { value: "decouverte", label: "Box Découverte" },
    { value: "famille", label: "Box Famille" },
    { value: "solo", label: "Box Solo" },
  ];

  const regions = [
    { value: "all", label: "Toutes les régions" },
    { value: "nord", label: "Afrique du Nord" },
    { value: "sud", label: "Afrique du Sud" },
    { value: "est", label: "Afrique de l'Est" },
    { value: "ouest", label: "Afrique de l'Ouest" },
  ];

  return (
    <div className="min-h-screen bg-amber-50" data-testid="catalogue-page">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-12">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-stone-900 mb-4">
              Nos Box Africaines
            </h1>
            <p className="text-lg text-stone-600">
              Découvrez notre sélection de box alimentaires saines, inspirées des 
              quatre coins de l&apos;Afrique. Chaque box contient une recette détaillée 
              et tous les ingrédients nécessaires.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-stone-200 sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-stone-600">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtrer:</span>
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] border-stone-200" data-testid="category-filter">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[180px] border-stone-200" data-testid="region-filter">
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

            <Button 
              variant="outline" 
              className="border-amber-600 text-amber-600 hover:bg-amber-50"
              onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()}
              data-testid="personalize-btn"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Personnaliser avec IA
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl h-96 skeleton" />
            ))}
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="font-heading text-xl font-semibold text-stone-900 mb-2">
              Aucune box trouvée
            </h3>
            <p className="text-stone-500 mb-4">
              Essayez de modifier vos filtres pour trouver des box.
            </p>
            <Button 
              onClick={() => { setCategoryFilter("all"); setRegionFilter("all"); }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-6">
              {boxes.length} box{boxes.length > 1 ? "s" : ""} trouvée{boxes.length > 1 ? "s" : ""}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {boxes.map((box, idx) => (
                <div 
                  key={box.id} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <BoxCard box={box} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CataloguePage;
