import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Clock, Users, Flame, ShoppingCart, ArrowLeft, Check, Leaf, Wheat, Sparkles, ChefHat } from "lucide-react";

const BoxDetailPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    axios.get(`${API}/boxes/${id}`)
      .then(res => setBox(res.data))
      .catch(() => toast.error("Impossible de charger cette box"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter");
      return;
    }
    setAddingToCart(true);
    try {
      await axios.post(`${API}/cart/add`, { box_id: box.id, quantity: 1 }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Box ajoutée au panier !");
    } catch (e) {
      toast.error("Erreur lors de l'ajout");
    }
    setAddingToCart(false);
  };

  if (loading) return <div className="min-h-screen bg-amber-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" /></div>;
  if (!box) return <div className="min-h-screen bg-amber-50 flex items-center justify-center"><h2>Box introuvable</h2></div>;

  const regionLabel = box.region === "nord" ? "Afrique du Nord" : box.region === "sud" ? "Afrique du Sud" : box.region === "est" ? "Afrique de l'Est" : "Afrique de l'Ouest";
  const regionColor = box.region === "nord" ? "bg-amber-100 text-amber-700" : box.region === "sud" ? "bg-green-100 text-green-700" : box.region === "est" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700";

  return (
    <div className="min-h-screen bg-amber-50" data-testid="box-detail-page">
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-4">
          <Link to="/catalogue" className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-600" data-testid="back-to-catalogue">
            <ArrowLeft className="w-4 h-4" />Retour
          </Link>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img src={box.image_url} alt={box.name} className="w-full h-[400px] object-cover" />
              <Badge className={`absolute top-4 left-4 ${regionColor} border-0`}>{regionLabel}</Badge>
              <div className="absolute top-4 right-4 flex gap-2">
                {box.is_vegetarian && <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center" title="Végétarien"><Leaf className="w-5 h-5 text-white" /></div>}
                {box.is_gluten_free && <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center" title="Sans gluten"><Wheat className="w-5 h-5 text-white" /></div>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-3">{box.name}</h1>
              <p className="text-lg text-stone-600">{box.description}</p>
            </div>

            <div className="flex flex-wrap gap-6 py-4 border-y border-stone-200">
              <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /><span>{box.prep_time} min</span></div>
              <div className="flex items-center gap-2"><Users className="w-5 h-5 text-amber-500" /><span>{box.serves} pers.</span></div>
              <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-amber-500" /><span>{box.calories} kcal</span></div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-stone-500 mb-1">Prix</p>
                  <p className="font-heading text-4xl font-bold text-amber-600">{box.price.toFixed(2)}€</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-500">Livraison</p>
                  <p className="text-green-600 font-medium">Gratuite</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAddToCart} disabled={addingToCart} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-full py-6 text-lg" data-testid="add-to-cart-btn">
                  {addingToCart ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
                  Ajouter au panier
                </Button>
                <Button variant="outline" className="border-2 border-amber-600 text-amber-600 hover:bg-amber-50 rounded-full py-6" onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()} data-testid="personalize-box-btn">
                  <Sparkles className="w-5 h-5 mr-2" />Personnaliser
                </Button>
              </div>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="font-heading text-lg">Valeurs nutritionnelles</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-amber-50 rounded-xl"><p className="font-heading text-xl font-bold text-amber-600">{box.nutritional_info.proteins}g</p><p className="text-xs text-stone-500">Protéines</p></div>
                  <div className="text-center p-3 bg-green-50 rounded-xl"><p className="font-heading text-xl font-bold text-green-600">{box.nutritional_info.carbs}g</p><p className="text-xs text-stone-500">Glucides</p></div>
                  <div className="text-center p-3 bg-blue-50 rounded-xl"><p className="font-heading text-xl font-bold text-blue-600">{box.nutritional_info.fats}g</p><p className="text-xs text-stone-500">Lipides</p></div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl"><p className="font-heading text-xl font-bold text-purple-600">{box.nutritional_info.fiber}g</p><p className="text-xs text-stone-500">Fibres</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="ingredients" className="w-full">
            <TabsList className="bg-white border border-stone-200 p-1 rounded-full">
              <TabsTrigger value="ingredients" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white">Ingrédients</TabsTrigger>
              <TabsTrigger value="recipe" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white">Recette</TabsTrigger>
            </TabsList>

            <TabsContent value="ingredients" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><ChefHat className="w-5 h-5 text-amber-600" />Ingrédients</CardTitle></CardHeader>
                <CardContent>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {box.ingredients.map((ing, i) => <li key={i} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg"><Check className="w-5 h-5 text-green-500" /><span>{ing}</span></li>)}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipe" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><ChefHat className="w-5 h-5 text-amber-600" />Préparation</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {box.recipe_steps.map((step, i) => <li key={i} className="flex gap-4"><div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><span className="font-bold text-amber-600">{i + 1}</span></div><p className="pt-1">{step}</p></li>)}
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
