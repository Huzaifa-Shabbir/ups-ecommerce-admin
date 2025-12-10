import React, { useEffect, useState } from 'react';
import { ordersAPI } from '../../services/api';
import { ShoppingCart, DollarSign, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrdersSummary = ({ className = '', compact = false }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await ordersAPI.getSummary();
        const report = data.report || data;
        if (!mounted) return;
        setSummary(report);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load order summary');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // If compact is true (used on Dashboard), show only Today Sales and Pending Orders
  const fullCards = [
    { title: 'Today Sales', value: summary?.today_sales ?? 0, icon: Calendar, color: 'bg-indigo-500' },
    { title: 'Total Orders', value: summary?.total_orders ?? 0, icon: ShoppingCart, color: 'bg-purple-500' },
    // Keep icon for Total Revenue and allow it to take extra width (span 2 columns)
    { title: 'Total Revenue', value: `$${(summary?.total_revenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'bg-amber-500', colClass: 'md:col-span-2' },
    { title: 'Pending Orders', value: summary?.pending_orders ?? 0, icon: Clock, color: 'bg-yellow-500' },
  ];

  const compactCards = [
    { title: 'Today Sales', value: summary?.today_sales ?? 0, icon: Calendar, color: 'bg-indigo-500' },
    { title: 'Pending Orders', value: summary?.pending_orders ?? 0, icon: Clock, color: 'bg-yellow-500' },
  ];

  const cards = compact ? compactCards : fullCards;

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-700">Error loading order summary: {error}</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${className}`}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link key={c.title} to="/admin/reports" className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition ${c.colClass || ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{c.title}</p>
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              </div>
              {/* Icon container: render only if Icon exists; otherwise preserve spacing */}
              {Icon ? (
                <div className={`${c.color} p-3 rounded-xl text-white w-12 h-12 flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-12 h-12" />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default OrdersSummary;
