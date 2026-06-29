import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Clock, Users, Flame, ShoppingCart, ArrowLeft, Check, Leaf, Wheat, Sparkles, ChefHat, Star } from "lucide-react";

const BoxDetailPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    axios.get(`${API}/countries`).then(res => setCountries(res.data)).catch(console.error);
    axios.get(`${API}/boxes/${id}`)
      .then(res => setBox(res.data))
      .catch(() => toast.error("Impossible de charger cette box"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) { toast.error("Veuillez vous connecter"); return; }
    setAddingToCart(true);
    try {
      await axios.post(`${API}/cart/add`, { box_id: box.id, quantity: 1 }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Box ajoutée au panier !");
    } catch (e) { toast.error("Erreur lors de l'ajout"); }
    setAddingToCart(false);
  };

  if (loading) return <div className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" /></div>;
  if (!box) return <div className="min-h-screen bg-orange-50 flex items-center justify-center"><h2>Box introuvable</h2></div>;

  const countryData = countries.find(c => c.id === box.country);

  return (
    <div className="min-h-screen bg-orange-50" data-testid="box-detail-page">
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-4">
          <Link to="/catalogue" className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-600" data-testid="back-to-catalogue">
            <ArrowLeft className="w-4 h-4" />Retour au catalogue
          </Link>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img src={box.image_url} alt={box.name} className="w-full h-[400px] object-cover" />
              <Badge className="absolute top-4 left-4 bg-white/95 text-stone-800 border-0 font-semibold text-lg px-4 py-2">
                {box.country_flag} {countryData?.name || box.country}
              </Badge>
              <div className="absolute top-4 right-4 flex gap-2">
                {box.is_vegetarian && <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"><Leaf className="w-5 h-5 text-white" /></div>}
                {box.is_gluten_free && <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center"><Wheat className="w-5 h-5 text-white" /></div>}
              </div>
            </div>
            
            {/* Highlights */}
            {box.highlights && box.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {box.highlights.map((h, i) => (
                  <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" />{h}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-3">{box.name}</h1>
              <p className="text-lg text-stone-600">{box.description}</p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 py-4 border-y border-stone-200">
              <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /><span>{box.prep_time} min</span></div>
              <div className="flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" /><span>{box.serves} personnes</span></div>
              <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /><span>{box.calories} kcal/portion</span></div>
            </div>

            {/* Price and CTA */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-stone-500 mb-1">Prix de la box</p>
                  <p className="font-heading text-4xl font-bold text-orange-600">{box.price.toFixed(0)}€</p>
                  <p className="text-sm text-stone-500">{box.dishes?.length || 4} recettes / {box.serves} personnes</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-500">Livraison</p>
                  <p className="text-green-600 font-medium">Gratuite</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAddToCart} disabled={addingToCart} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-full py-6 text-lg" data-testid="add-to-cart-btn">
                  {addingToCart ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
                  Ajouter au panier
                </Button>
                <Button variant="outline" className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 rounded-full py-6" onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()} data-testid="personalize-box-btn">
                  <Sparkles className="w-5 h-5 mr-2" />Personnaliser
                </Button>
              </div>
            </div>

            {/* Nutritional Info */}
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="font-heading text-lg">Valeurs nutritionnelles par portion</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-orange-50 rounded-xl"><p className="font-heading text-xl font-bold text-orange-600">{box.nutritional_info.proteins}g</p><p className="text-xs text-stone-500">Protéines</p></div>
                  <div className="text-center p-3 bg-green-50 rounded-xl"><p className="font-heading text-xl font-bold text-green-600">{box.nutritional_info.carbs}g</p><p className="text-xs text-stone-500">Glucides</p></div>
                  <div className="text-center p-3 bg-blue-50 rounded-xl"><p className="font-heading text-xl font-bold text-blue-600">{box.nutritional_info.fats}g</p><p className="text-xs text-stone-500">Lipides</p></div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl"><p className="font-heading text-xl font-bold text-purple-600">{box.nutritional_info.fiber}g</p><p className="text-xs text-stone-500">Fibres</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="dishes" className="w-full">
            <TabsList className="bg-white border border-stone-200 p-1 rounded-full">
              <TabsTrigger value="dishes" className="rounded-full data-[state=active]:bg-orange-600 data-[state=active]:text-white">Plats inclus</TabsTrigger>
              <TabsTrigger value="ingredients" className="rounded-full data-[state=active]:bg-orange-600 data-[state=active]:text-white">Ingrédients</TabsTrigger>
              <TabsTrigger value="recipe" className="rounded-full data-[state=active]:bg-orange-600 data-[state=active]:text-white">Préparation</TabsTrigger>
            </TabsList>

            <TabsContent value="dishes" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {box.dishes && box.dishes.map((dish, i) => (
                  <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Star className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-heading font-semibold text-stone-900">{dish.name}</h4>
                        <p className="text-sm text-stone-500">{dish.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ingredients" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><ChefHat className="w-5 h-5 text-orange-600" />Ingrédients fournis</CardTitle></CardHeader>
                <CardContent>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {box.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-500" /><span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipe" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><ChefHat className="w-5 h-5 text-orange-600" />Étapes de préparation</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {box.recipe_steps.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 text-white font-bold">{i + 1}</div>
                        <p className="pt-1 text-stone-700">{step}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BoxDetailPage;
