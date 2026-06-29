import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Flame, ArrowRight, Leaf, Wheat } from "lucide-react";

const countryLabels = {
  gabon: "Gabon",
  cameroun: "Cameroun",
  "cote-ivoire": "Côte d'Ivoire",
  congo: "Congo",
  senegal: "Sénégal",
  multi: "Multi-Pays",
};

export const BoxCard = ({ box }) => {
  const countryName = countryLabels[box.country] || box.country || "Pays";
  return (
    <Card 
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden border-0"
      data-testid={`box-card-${box.id}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={box.image_url} 
          alt={box.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Region Badge */}
        <Badge className="absolute top-3 left-3 bg-white/95 text-stone-800 border-0 font-medium">
          {box.country_flag || "🌍"} {countryName}
        </Badge>

        {/* Diet Badges */}
        <div className="absolute top-3 right-3 flex gap-1">
          {box.is_vegetarian && (
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center" title="Végétarien">
              <Leaf className="w-4 h-4 text-white" />
            </div>
          )}
          {box.is_gluten_free && (
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center" title="Sans gluten">
              <Wheat className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Price */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="font-heading text-lg font-bold text-amber-600">{box.price.toFixed(2)}€</span>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-5">
        <h3 className="font-heading text-xl font-semibold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors">
          {box.name}
        </h3>
        <p className="text-stone-500 text-sm mb-4 line-clamp-2">
          {box.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-stone-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{box.prep_time} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" />
            <span>{box.serves} pers.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>{box.calories} kcal</span>
          </div>
        </div>

        {/* CTA */}
        <Link to={`/box/${box.id}`}>
          <Button 
            variant="ghost" 
            className="w-full justify-between text-amber-600 hover:text-amber-700 hover:bg-amber-50 group/btn"
            data-testid={`view-box-btn-${box.id}`}
          >
            Voir la box
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default BoxCard;
