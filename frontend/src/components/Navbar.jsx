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
import { ShoppingCart, User, Menu, X, LogOut, ChefHat } from "lucide-react";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Accueil" },
    { path: "/catalogue", label: "Nos Box" },
    { path: "/blog", label: "Blog Recettes" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass border-b border-stone-200/50" data-testid="navbar">
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold text-stone-900">
              Afro<span className="text-amber-600">Box</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link text-sm ${isActive(link.path) ? "text-amber-600" : ""}`}
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
                  <Button variant="ghost" size="icon" className="relative hover:bg-amber-100">
                    <ShoppingCart className="w-5 h-5 text-stone-700" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-amber-100" data-testid="user-menu-trigger">
                      <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
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
                <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6">
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
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-base font-medium py-2 ${isActive(link.path) ? "text-amber-600" : "text-stone-700"}`}
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
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-full">
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
