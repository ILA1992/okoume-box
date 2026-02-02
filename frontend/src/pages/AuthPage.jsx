import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChefHat, Mail, Lock, User, ArrowRight, Leaf } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  if (user) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success("Connexion réussie !");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerEmail, registerPassword, registerName);
      toast.success("Compte créé avec succès !");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex" data-testid="auth-page">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-600 to-amber-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
            <ChefHat className="w-10 h-10" />
          </div>
          <h1 className="font-heading text-4xl font-bold mb-4 text-center">Bienvenue sur AfroBox</h1>
          <p className="text-amber-100 text-center max-w-md mb-8">
            Découvrez la cuisine africaine saine et savoureuse. Des box équilibrées livrées chez vous.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Leaf className="w-4 h-4" /></div>
              <span>Recettes équilibrées et diététiques</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Leaf className="w-4 h-4" /></div>
              <span>Ingrédients frais et de qualité</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Leaf className="w-4 h-4" /></div>
              <span>Assistant IA pour personnaliser vos plats</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/10"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading text-2xl font-bold text-stone-900">Afro<span className="text-amber-600">Box</span></span>
            </Link>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-stone-100 p-1 rounded-full">
              <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-white" data-testid="login-tab">Connexion</TabsTrigger>
              <TabsTrigger value="register" className="rounded-full data-[state=active]:bg-white" data-testid="register-tab">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl">Content de vous revoir !</CardTitle>
                  <CardDescription>Connectez-vous pour accéder à votre compte</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-amber-600" />Email</Label>
                      <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="votre@email.com" required data-testid="login-email-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Lock className="w-4 h-4 text-amber-600" />Mot de passe</Label>
                      <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••" required data-testid="login-password-input" />
                    </div>
                    <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 rounded-full py-6" disabled={loading} data-testid="login-submit-btn">
                      {loading && <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />}
                      Se connecter <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl">Créer un compte</CardTitle>
                  <CardDescription>Rejoignez la communauté AfroBox</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><User className="w-4 h-4 text-amber-600" />Nom</Label>
                      <Input value={registerName} onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="Jean Dupont" required data-testid="register-name-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-amber-600" />Email</Label>
                      <Input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="votre@email.com" required data-testid="register-email-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Lock className="w-4 h-4 text-amber-600" />Mot de passe</Label>
                      <Input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="••••••••" required minLength={6} data-testid="register-password-input" />
                    </div>
                    <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 rounded-full py-6" disabled={loading} data-testid="register-submit-btn">
                      {loading && <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />}
                      Créer mon compte <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
