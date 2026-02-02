import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Clock, Users, Flame, ShoppingCart, ArrowLeft, 
  Check, Leaf, Wheat, Sparkles, ChefHat 
} from "lucide-react";

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

const BoxDetailPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchBox = async () => {
      try {
        const response = await axios.get(`${API}/boxes/${id}`);
        setBox(response.data);
      } catch (error) {
        console.error("Error fetching box:", error);
        toast.error("Impossible de charger cette box");
      } finally {
        setLoading(false);
      }
    };
    fetchBox();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour ajouter au panier");
      return;
    }

    setAddingToCart(true);
    try {
      await axios.post(
        `${API}/cart/add`,
        { box_id: box.id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Box ajoutée au panier !");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Erreur lors de l'ajout au panier");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-stone-900 mb-4">Box introuvable</h2>
          <Link to="/catalogue">
            <Button className="bg-amber-600 hover:bg-amber-700">
              Retour au catalogue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50" data-testid="box-detail-page">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-4">
          <Link 
            to="/catalogue" 
            className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors"
            data-testid="back-to-catalogue"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au catalogue
          </Link>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={box.image_url} 
                alt={box.name}
                className="w-full h-[400px] object-cover"
              />
              <Badge className={`absolute top-4 left-4 ${regionColors[box.region]} border-0`}>
                {regionLabels[box.region]}
              </Badge>
              <div className="absolute top-4 right-4 flex gap-2">
                {box.is_vegetarian && (
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center" title="Végétarien">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                )}
                {box.is_gluten_free && (
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center" title="Sans gluten">
                    <Wheat className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-stone-900 mb-3">
                {box.name}
              </h1>
              <p className="text-lg text-stone-600">
                {box.description}
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 py-4 border-y border-stone-200">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-stone-700">{box.prep_time} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span className="text-stone-700">{box.serves} personnes</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span className="text-stone-700">{box.calories} kcal/portion</span>
              </div>
            </div>

            {/* Price and CTA */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-stone-500 mb-1">Prix de la box</p>
                  <p className="font-heading text-4xl font-bold text-amber-600">
                    {box.price.toFixed(2)}€
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-500">Livraison</p>
                  <p className="text-green-600 font-medium">Gratuite</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-full py-6 text-lg"
                  data-testid="add-to-cart-btn"
                >
                  {addingToCart ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <ShoppingCart className="w-5 h-5 mr-2" />
                  )}
                  Ajouter au panier
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-amber-600 text-amber-600 hover:bg-amber-50 rounded-full py-6"
                  onClick={() => document.querySelector('[data-testid="chat-toggle-btn"]')?.click()}
                  data-testid="personalize-box-btn"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Personnaliser
                </Button>
              </div>
            </div>

            {/* Nutritional Info */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Valeurs nutritionnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <p className="font-heading text-xl font-bold text-amber-600">
                      {box.nutritional_info.proteins}g
                    </p>
                    <p className="text-xs text-stone-500">Protéines</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <p className="font-heading text-xl font-bold text-green-600">
                      {box.nutritional_info.carbs}g
                    </p>
                    <p className="text-xs text-stone-500">Glucides</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <p className="font-heading text-xl font-bold text-blue-600">
                      {box.nutritional_info.fats}g
                    </p>
                    <p className="text-xs text-stone-500">Lipides</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <p className="font-heading text-xl font-bold text-purple-600">
                      {box.nutritional_info.fiber}g
                    </p>
                    <p className="text-xs text-stone-500">Fibres</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recipe Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="ingredients" className="w-full">
            <TabsList className="bg-white border border-stone-200 p-1 rounded-full">
              <TabsTrigger 
                value="ingredients" 
                className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                Ingrédients
              </TabsTrigger>
              <TabsTrigger 
                value="recipe" 
                className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                Recette
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ingredients" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-amber-600" />
                    Liste des ingrédients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {box.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-stone-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipe" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-amber-600" />
                    Étapes de préparation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {box.recipe_steps.map((step, idx) => (
                      <li key={idx} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-amber-600">{idx + 1}</span>
                        </div>
                        <p className="text-stone-700 pt-1">{step}</p>
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
