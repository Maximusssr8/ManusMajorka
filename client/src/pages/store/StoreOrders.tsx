import { Check, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { trpc } from '../../lib/trpc';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  paid: 'text-emerald-400 bg-emerald-400/10',
  failed: 'text-red-400 bg-red-400/10',
};
const FULFIL_COLORS: Record<string, string> = {
  unfulfilled: 'text-orange-400 bg-orange-400/10',
  fulfilled: 'text-emerald-400 bg-emerald-400/10',
};

export default function StoreOrders() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const store = trpc.storefront.getMyStore.useQuery(undefined, { enabled: isAuthenticated });
  const orders = trpc.storefront.getOrders.useQuery(undefined, { enabled: isAuthenticated });
  const markFulfilled = trpc.storefront.markFulfilled.useMutation({
    onSuccess: () => {
      utils.storefront.getOrders.invalidate();
      toast.success('Marked as fulfilled!');
    },
    onError: (e) => toast.error(e.message),
  });

  if (!store.data && !store.isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="mb-4" style={{ color: '#94A3B8' }}>
          No store found.
        </p>
        <Button
          onClick={() => navigate('/app/store/setup')}
          className="text-slate-100 font-semibold"
          style={{ background: '#6366F1' }}
        >
          Set Up Store
        </Button>
      </div>
    );
  }

  const orderList = orders.data || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>
            Orders
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            {orderList.length} total orders
          </p>
        </div>
      </div>

      {orders.isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          ))}
        </div>
      ) : orderList.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 mx-auto mb-4" style={{ color: '#D1D5DB' }} />
          <p className="font-semibold text-slate-100 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
            No orders yet
          </p>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            Share your store link to start getting sales.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: '#05070F',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th
                  className="text-left px-5 py-3 text-xs font-medium uppercase"
                  style={{ color: '#9CA3AF' }}
                >
                  Date
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-medium uppercase"
                  style={{ color: '#9CA3AF' }}
                >
                  Customer
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-medium uppercase"
                  style={{ color: '#9CA3AF' }}
                >
                  Amount
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-medium uppercase"
                  style={{ color: '#9CA3AF' }}
                >
                  Payment
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-medium uppercase"
                  style={{ color: '#9CA3AF' }}
                >
                  Fulfillment
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {orderList.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-[#0D1424]/[0.02]"
                  style={{ borderBottom: '1px solid #F9FAFB' }}
                >
                  <td className="px-5 py-4 text-sm" style={{ color: '#94A3B8' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-100 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {order.customerName}
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      {order.customerEmail}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-100 font-medium">${order.amount || '—'}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status || 'pending'] || STATUS_COLORS.pending}`}
                    >
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${FULFIL_COLORS[order.fulfillmentStatus || 'unfulfilled'] || FULFIL_COLORS.unfulfilled}`}
                    >
                      {order.fulfillmentStatus || 'unfulfilled'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {order.fulfillmentStatus !== 'fulfilled' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-400 hover:text-emerald-300 text-xs h-7"
                        onClick={() => markFulfilled.mutate({ orderId: order.id })}
                        disabled={markFulfilled.isPending}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Fulfill
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
