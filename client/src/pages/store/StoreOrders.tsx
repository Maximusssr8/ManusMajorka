import { trpc } from "../../lib/trpc";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Package, Check } from "lucide-react";
import { Button } from "../../components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10",
  paid: "text-emerald-400 bg-emerald-400/10",
  failed: "text-red-400 bg-red-400/10",
};
const FULFIL_COLORS: Record<string, string> = {
  unfulfilled: "text-orange-400 bg-orange-400/10",
  fulfilled: "text-emerald-400 bg-emerald-400/10",
};

export default function StoreOrders() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const store = trpc.storefront.getMyStore.useQuery(undefined, { enabled: isAuthenticated });
  const orders = trpc.storefront.getOrders.useQuery(undefined, { enabled: isAuthenticated });
  const markFulfilled = trpc.storefront.markFulfilled.useMutation({
    onSuccess: () => { utils.storefront.getOrders.invalidate(); toast.success("Marked as fulfilled!"); },
    onError: (e) => toast.error(e.message),
  });

  if (!store.data && !store.isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-neutral-400 mb-4">No store found.</p>
        <Button onClick={() => navigate("/app/store/setup")} className="bg-violet-600 text-white">Set Up Store</Button>
      </div>
    );
  }

  const orderList = orders.data || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-neutral-400 text-sm mt-1">{orderList.length} total orders</p>
        </div>
      </div>

      {orders.isLoading ? (
        <div className="text-neutral-400">Loading orders...</div>
      ) : orderList.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400">No orders yet. Share your store link to start getting sales.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-5 py-3 text-neutral-400 text-xs font-medium uppercase">Date</th>
                <th className="text-left px-5 py-3 text-neutral-400 text-xs font-medium uppercase">Customer</th>
                <th className="text-left px-5 py-3 text-neutral-400 text-xs font-medium uppercase">Amount</th>
                <th className="text-left px-5 py-3 text-neutral-400 text-xs font-medium uppercase">Payment</th>
                <th className="text-left px-5 py-3 text-neutral-400 text-xs font-medium uppercase">Fulfillment</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {orderList.map(order => (
                <tr key={order.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                  <td className="px-5 py-4 text-neutral-400 text-sm">
                    {new Date(order.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white text-sm">{order.customerName}</p>
                    <p className="text-neutral-500 text-xs">{order.customerEmail}</p>
                  </td>
                  <td className="px-5 py-4 text-white font-medium">${order.amount || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status || "pending"] || STATUS_COLORS.pending}`}>
                      {order.status || "pending"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${FULFIL_COLORS[order.fulfillmentStatus || "unfulfilled"] || FULFIL_COLORS.unfulfilled}`}>
                      {order.fulfillmentStatus || "unfulfilled"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {order.fulfillmentStatus !== "fulfilled" && (
                      <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 text-xs h-7"
                        onClick={() => markFulfilled.mutate({ orderId: order.id })}
                        disabled={markFulfilled.isPending}>
                        <Check className="w-3 h-3 mr-1" />Fulfill
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
