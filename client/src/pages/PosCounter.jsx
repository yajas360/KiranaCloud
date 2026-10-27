import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import ProductPicker from '../components/pos/ProductPicker';
import CartDrawer from '../components/pos/CartDrawer';
import ReceiptModal from '../components/pos/ReceiptModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatUnit } from '../utils/formatters';

const PosCounter = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      // Fetch full catalog for fast in-memory search on POS counter
      const res = await api.get('/products?limit=200');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load products for POS counter', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          alert(`Maximum stock reached (${product.stockQuantity} ${formatUnit(product.unit)}) for ${product.name}`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product._id === productId) {
          const clampedQty = Math.min(newQuantity, item.product.stockQuantity);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product._id !== productId));
  };

  const handleSubtractFromCart = (productId) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product._id === productId);
      if (!existing) return prevCart;
      if (existing.quantity <= 1) {
        return prevCart.filter((item) => item.product._id !== productId);
      }
      return prevCart.map((item) =>
        item.product._id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckout = async (payload) => {
    try {
      setCheckoutLoading(true);
      const res = await api.post('/sales', payload);
      if (res.data.success) {
        setCompletedSale(res.data.data);
        setIsReceiptOpen(true);
        setCart([]);
        // Re-fetch products to reflect the newly decremented stock!
        fetchProducts();
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Checkout failed.';
      return {
        success: false,
        message: msg,
        creditLimitExceeded: err.response?.data?.creditLimitExceeded || false,
      };
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {loadingProducts ? (
        <LoadingSpinner text="Initializing Billing Counter & products..." size="lg" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
          {/* Left Column: Product Search & Grid */}
          <div className="lg:col-span-7 xl:col-span-8 h-full flex flex-col min-h-0">
            <ProductPicker
              products={products}
              cart={cart}
              onAddToCart={handleAddToCart}
              onSubtractFromCart={handleSubtractFromCart}
            />
          </div>

          {/* Right Column: Billing Counter Cart & Checkout */}
          <div className="lg:col-span-5 xl:col-span-4 h-full flex flex-col min-h-0">
            <CartDrawer
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
              loading={checkoutLoading}
            />
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {isReceiptOpen && completedSale && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          saleData={completedSale}
        />
      )}
    </div>
  );
};

export default PosCounter;
