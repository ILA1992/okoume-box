import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-stone-900 text-white" data-testid="footer">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img
                src="/logo-okoume-box.png"
                alt="Okoumé Box"
                className="h-20 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed">
              Redécouvrez la cuisine africaine de manière saine et délicieuse. Des box équilibrées pour une alimentation responsable.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-orange-600 transition-colors" data-testid="social-instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-orange-600 transition-colors" data-testid="social-facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-orange-600 transition-colors" data-testid="social-twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-stone-400 hover:text-orange-400 transition-colors text-sm">Accueil</Link></li>
              <li><Link to="/catalogue" className="text-stone-400 hover:text-orange-400 transition-colors text-sm">Nos Box</Link></li>
              <li><Link to="/plats-africains" className="text-stone-400 hover:text-orange-400 transition-colors text-sm">Plats Africains</Link></li>
              <li><Link to="/blog" className="text-stone-400 hover:text-orange-400 transition-colors text-sm">Blog Recettes</Link></li>
              <li><Link to="/auth" className="text-stone-400 hover:text-orange-400 transition-colors text-sm">Mon Compte</Link></li>
            </ul>
          </div>

          {/* Régions */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Nos Régions</h4>
            <ul className="space-y-3">
              <li className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Afrique de l&apos;Ouest
              </li>
              <li className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Afrique Centrale
              </li>
              <li className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Maghreb
              </li>
              <li className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Afrique de l&apos;Est
              </li>
              <li className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Afrique Australe
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-stone-400 text-sm">
                <Mail className="w-4 h-4 text-orange-400" />
                contact@okoumebox.fr
              </li>
              <li className="flex items-center gap-3 text-stone-400 text-sm">
                <Phone className="w-4 h-4 text-orange-400" />
                +33 1 23 45 67 89
              </li>
              <li className="flex items-start gap-3 text-stone-400 text-sm">
                <MapPin className="w-4 h-4 text-orange-400 mt-0.5" />
                123 Rue des Saveurs<br />75001 Paris, France
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo-okoume-box.png" alt="" className="h-8 w-auto brightness-0 invert opacity-60" />
            <p className="text-stone-500 text-sm">
              © {new Date().getFullYear()} Okoumé Box. Tous droits réservés.
            </p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-stone-500 hover:text-orange-400 text-sm transition-colors">Mentions légales</a>
            <a href="#" className="text-stone-500 hover:text-orange-400 text-sm transition-colors">CGV</a>
            <a href="#" className="text-stone-500 hover:text-orange-400 text-sm transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
