import { useEffect, useState } from "react";
import { useAuth, API } from "@/App";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, ShoppingBag, Package, TrendingUp, Clock, CheckCircle,
  Truck, XCircle, Euro, RefreshCw, Shield, ChevronDown
} from "lucide-react";

const STATUS_LABELS = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "En préparation", color: "bg-orange-100 text-orange-700" },
  shipped: { label: "Expédiée", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
};

const NEXT_STATUSES = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-2xl font-bold text-stone-900">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const AdminPage = () => {
  const { user, token } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (user?.is_admin) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, usersRes, boxesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/orders`, { headers }),
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/boxes`),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
      setBoxes(boxesRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await axios.put(`${API}/admin/orders/${orderId}/status?status=${newStatus}`, {}, { headers });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (stats) {
        fetchAll(); // refresh stats
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const toggleAdmin = async (userId) => {
    try {
      const res = await axios.put(`${API}/admin/users/${userId}/toggle-admin`, {}, { headers });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: res.data.is_admin } : u));
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return <Navigate to="/auth" replace />;
  if (!user.is_admin) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Card className="border-0 shadow-sm text-center p-8 max-w-sm">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Accès refusé</h2>
          <p className="text-stone-500 text-sm">Vous n'avez pas les droits administrateur.</p>
        </Card>
      </div>
    );
  }

  const TABS = [
    { id: "dashboard", label: "Tableau de bord" },
    { id: "orders", label: `Commandes ${orders.length > 0 ? `(${orders.length})` : ""}` },
    { id: "users", label: `Utilisateurs ${users.length > 0 ? `(${users.length})` : ""}` },
    { id: "boxes", label: `Boxes ${boxes.length > 0 ? `(${boxes.length})` : ""}` },
  ];

  return (
    <div className="min-h-screen bg-stone-50" data-testid="admin-page">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="container-custom py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-stone-900 text-lg leading-none">Dashboard Admin</h1>
              <p className="text-xs text-stone-500">Okoumé Box — {user.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAll}
            className="text-stone-500 hover:text-orange-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Tabs */}
        <div className="container-custom">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* ── DASHBOARD ── */}
            {tab === "dashboard" && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Utilisateurs" value={stats.users_count} color="bg-blue-500" />
                  <StatCard icon={ShoppingBag} label="Commandes" value={stats.orders_count} color="bg-orange-500" />
                  <StatCard icon={Package} label="Boxes actives" value={stats.boxes_count} color="bg-green-500" />
                  <StatCard icon={Euro} label="Chiffre d'affaires" value={`${stats.total_revenue.toLocaleString("fr-FR")} €`} color="bg-purple-500" />
                </div>

                {/* Orders by status */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: "pending", label: "En attente", icon: Clock, color: "text-yellow-500" },
                    { key: "confirmed", label: "Confirmées", icon: CheckCircle, color: "text-blue-500" },
                    { key: "delivered", label: "Livrées", icon: Truck, color: "text-green-500" },
                    { key: "cancelled", label: "Annulées", icon: XCircle, color: "text-red-500" },
                  ].map(({ key, label, icon: Icon, color }) => (
                    <Card key={key} className="border-0 shadow-sm">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${color}`} />
                        <div>
                          <p className="text-xs text-stone-400">{label}</p>
                          <p className="font-bold text-stone-900">{stats.orders_by_status[key] ?? 0}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recent orders */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Commandes récentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.recent_orders.length === 0 ? (
                      <p className="text-stone-400 text-sm py-4 text-center">Aucune commande pour l'instant</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.recent_orders.map(order => (
                          <div key={order.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-stone-900">{order.user_name || "Client"}</p>
                              <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-stone-900">{order.total?.toFixed(2)} €</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[order.status]?.color || "bg-stone-100 text-stone-600"}`}>
                                {STATUS_LABELS[order.status]?.label || order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-stone-900">{orders.length} commande{orders.length !== 1 ? "s" : ""}</h2>
                </div>
                {orders.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center text-stone-400">Aucune commande</CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <Card key={order.id} className="border-0 shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-stone-900">{order.user_name || "Client"}</span>
                                <span className="text-xs text-stone-400">{order.user_email}</span>
                              </div>
                              <p className="text-xs text-stone-400 mb-2">
                                {new Date(order.created_at).toLocaleString("fr-FR")} · {order.items?.length} article{order.items?.length !== 1 ? "s" : ""}
                              </p>
                              <p className="text-sm text-stone-500 truncate">{order.delivery_address}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-bold text-stone-900">{order.total?.toFixed(2)} €</span>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_LABELS[order.status]?.color || "bg-stone-100 text-stone-600"}`}>
                                {STATUS_LABELS[order.status]?.label || order.status}
                              </span>
                              {NEXT_STATUSES[order.status]?.length > 0 && (
                                <div className="relative group">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={updatingOrder === order.id}
                                    className="text-xs"
                                  >
                                    {updatingOrder === order.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>Changer <ChevronDown className="w-3 h-3 ml-1" /></>
                                    )}
                                  </Button>
                                  <div className="absolute right-0 top-8 bg-white border border-stone-200 rounded-lg shadow-lg z-10 hidden group-hover:block min-w-[140px]">
                                    {NEXT_STATUSES[order.status].map(s => (
                                      <button
                                        key={s}
                                        onClick={() => updateOrderStatus(order.id, s)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-stone-50 first:rounded-t-lg last:rounded-b-lg"
                                      >
                                        {STATUS_LABELS[s]?.label || s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── USERS ── */}
            {tab === "users" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-stone-900">{users.length} utilisateur{users.length !== 1 ? "s" : ""}</h2>
                <div className="space-y-3">
                  {users.map(u => (
                    <Card key={u.id} className="border-0 shadow-sm">
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            <span className="text-orange-600 font-semibold">{u.name?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-stone-900">{u.name}</span>
                              {u.is_admin && (
                                <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Admin</Badge>
                              )}
                            </div>
                            <p className="text-sm text-stone-400">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-stone-900">{u.order_count} commande{u.order_count !== 1 ? "s" : ""}</p>
                            <p className="text-xs text-stone-400">{new Date(u.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={u.is_admin ? "destructive" : "outline"}
                            onClick={() => toggleAdmin(u.id)}
                            disabled={u.id === user.id}
                            className="text-xs"
                          >
                            {u.is_admin ? "Retirer admin" : "Rendre admin"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── BOXES ── */}
            {tab === "boxes" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-stone-900">{boxes.length} box{boxes.length !== 1 ? "es" : ""}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {boxes.map(box => (
                    <Card key={box.id} className="border-0 shadow-sm overflow-hidden">
                      <div className="h-36 bg-stone-100 relative overflow-hidden">
                        <img
                          src={box.image_url}
                          alt={box.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = "none"; }}
                        />
                        <span className="absolute top-2 left-2 text-xl">{box.country_flag}</span>
                      </div>
                      <CardContent className="p-4">
                        <p className="font-semibold text-stone-900 text-sm leading-tight mb-1">{box.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className="bg-stone-100 text-stone-600 border-0 text-xs">{box.category}</Badge>
                          <span className="font-bold text-orange-600">{box.price} €</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
