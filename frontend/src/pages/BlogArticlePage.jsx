import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, Users, ChefHat, ArrowLeft, Check, 
  Share2, Bookmark, Printer, Lightbulb 
} from "lucide-react";
import { toast } from "sonner";

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

const BlogArticlePage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`${API}/recipes/${id}`);
        setRecipe(response.data);
      } catch (error) {
        console.error("Error fetching recipe:", error);
        toast.error("Impossible de charger cette recette");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-stone-900 mb-4">Recette introuvable</h2>
          <Link to="/blog">
            <Button className="bg-amber-600 hover:bg-amber-700">
              Retour au blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50" data-testid="blog-article-page">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="container-custom py-4">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors"
            data-testid="back-to-blog"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au blog
          </Link>
        </div>
      </div>

      <article className="container-custom py-12">
        {/* Header */}
        <header className="max-w-3xl mx-auto text-center mb-12">
          <Badge className={`${regionColors[recipe.region]} border-0 mb-4`}>
            {regionLabels[recipe.region]}
          </Badge>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-stone-900 mb-4">
            {recipe.title}
          </h1>
          <p className="text-lg text-stone-600 mb-6">
            {recipe.description}
          </p>
          
          {/* Meta */}
          <div className="flex items-center justify-center gap-6 text-sm text-stone-500 mb-6">
            <span>Par <strong className="text-stone-700">{recipe.author}</strong></span>
            <span>•</span>
            <span>{recipe.difficulty}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              className="border-stone-200 hover:border-amber-600 hover:text-amber-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-stone-200 hover:border-amber-600 hover:text-amber-600"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.print()}
              className="border-stone-200 hover:border-amber-600 hover:text-amber-600"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          </div>
        </header>

        {/* Hero Image */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={recipe.image_url} 
              alt={recipe.title}
              className="w-full h-[400px] object-cover"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <div className="grid grid-cols-3 divide-x divide-stone-200">
              <div className="text-center px-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <p className="font-heading text-2xl font-bold text-stone-900">
                  {recipe.prep_time + recipe.cook_time}
                </p>
                <p className="text-sm text-stone-500">minutes</p>
              </div>
              <div className="text-center px-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-heading text-2xl font-bold text-stone-900">
                  {recipe.serves}
                </p>
                <p className="text-sm text-stone-500">personnes</p>
              </div>
              <div className="text-center px-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <ChefHat className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-heading text-2xl font-bold text-stone-900">
                  {recipe.difficulty}
                </p>
                <p className="text-sm text-stone-500">niveau</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <Card className="border-0 shadow-sm sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-amber-600" />
                  Ingrédients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-stone-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2 space-y-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Préparation</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-6">
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                        {idx + 1}
                      </div>
                      <div className="pt-2">
                        <p className="text-stone-700">{step}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Tips */}
            {recipe.tips && (
              <Card className="border-0 shadow-sm bg-amber-50">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-stone-900 mb-1">
                        Conseil du chef
                      </h4>
                      <p className="text-stone-600 text-sm">{recipe.tips}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-600 to-amber-500">
            <CardContent className="p-8">
              <h3 className="font-heading text-2xl font-bold text-white mb-2">
                Envie de préparer ce plat ?
              </h3>
              <p className="text-amber-100 mb-6">
                Commandez votre box avec tous les ingrédients dosés et la recette détaillée.
              </p>
              <Link to="/catalogue">
                <Button className="bg-white text-amber-600 hover:bg-amber-50 rounded-full px-8 py-6 text-lg font-semibold">
                  Voir nos box
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </article>
    </div>
  );
};

export default BlogArticlePage;
