import { Link } from "react-router-dom";
import { ChefHat, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-stone-900 text-white" data-testid="footer">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-2xl font-bold">
                Afro<span className="text-amber-500">Box</span>
              </span>
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed">
              Redécouvrez la cuisine africaine de manière saine et délicieuse. Des box équilibrées pour une alimentation responsable.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-amber-600 transition-colors" data-testid="social-instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-amber-600 transition-colors" data-testid="social-facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-amber-600 transition-colors" data-testid="social-twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-stone-400 hover:text-amber-500 transition-colors text-sm">Accueil</Link></li>
              <li><Link to="/catalogue" className="text-stone-400 hover:text-amber-500 transition-colors text-sm">Nos Box</Link></li>
              <li><Link to="/blog" className="text-stone-400 hover:text-amber-500 transition-colors text-sm">Blog Recettes</Link></li>
              <li><Link to="/auth" className="text-stone-400 hover:text-amber-500 transition-colors text-sm">Mon Compte</Link></li>
            </ul>
          </div>

          {/* Régions */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Nos Régions</h4>
            <ul className="space-y-3">
              <li className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Afrique de l&apos;Ouest
              </li>
              <li className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Afrique du Nord
              </li>
              <li className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Afrique de l&apos;Est
              </li>
              <li className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Afrique du Sud
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-stone-400 text-sm">
                <Mail className="w-4 h-4 text-amber-500" />
                contact@afrobox.fr
              </li>
              <li className="flex items-center gap-3 text-stone-400 text-sm">
                <Phone className="w-4 h-4 text-amber-500" />
                +33 1 23 45 67 89
              </li>
              <li className="flex items-start gap-3 text-stone-400 text-sm">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5" />
                123 Rue des Saveurs<br />75001 Paris, France
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-stone-500 text-sm">
            © 2024 AfroBox. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-stone-500 hover:text-amber-500 text-sm transition-colors">Mentions légales</a>
            <a href="#" className="text-stone-500 hover:text-amber-500 text-sm transition-colors">CGV</a>
            <a href="#" className="text-stone-500 hover:text-amber-500 text-sm transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
