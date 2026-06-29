import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, User, Menu, X, LogOut, Crown, Shield } from "lucide-react";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Accueil" },
    { path: "/catalogue", label: "Nos Box" },
    { path: "/plats-africains", label: "Plats Africains" },
    { path: "/abonnement", label: "Abonnement" },
    { path: "/blog", label: "Blog" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass border-b border-stone-200/50" data-testid="navbar">
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center group" data-testid="logo-link">
            <img
              src="/logo-okoume-box.png"
              alt="Okoumé Box"
              className="h-12 md:h-14 w-auto group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link text-sm font-medium transition-colors ${
                  isActive(link.path) ? "text-orange-600" : "text-stone-700 hover:text-orange-500"
                }`}
                data-testid={`nav-link-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/cart" data-testid="cart-link">
                  <Button variant="ghost" size="icon" className="relative hover:bg-orange-100">
                    <ShoppingCart className="w-5 h-5 text-stone-700" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 hover:bg-orange-100"
                      data-testid="user-menu-trigger"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{user.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-stone-700">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2" data-testid="profile-link">
                        <User className="w-4 h-4" />
                        Mon Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/abonnement" className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-orange-500" />
                        Abonnement
                      </Link>
                    </DropdownMenuItem>
                    {user.is_admin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-orange-600" />
                          Dashboard Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600" data-testid="logout-btn">
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth" data-testid="login-link">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6">
                  Connexion
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-stone-700" />
            ) : (
              <Menu className="w-6 h-6 text-stone-700" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-stone-200 animate-fade-in" data-testid="mobile-menu">
            {/* Logo mobile */}
            <div className="flex justify-center mb-4 pb-4 border-b border-stone-100">
              <img src="/logo-okoume-box.png" alt="Okoumé Box" className="h-16 w-auto" />
            </div>
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-base font-medium py-2 ${
                    isActive(link.path) ? "text-orange-600" : "text-stone-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-stone-200 pt-4 mt-2">
                {user ? (
                  <>
                    <Link
                      to="/cart"
                      className="flex items-center gap-2 py-2 text-stone-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Panier
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 py-2 text-stone-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Mon Profil
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2 py-2 text-red-600 w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full">
                      Connexion
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
