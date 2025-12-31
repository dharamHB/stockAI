import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
        return [];
      }
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, availableStock) => {
    const existingItem = cartItems.find((item) => item.id === product.id);
    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > availableStock) {
      toast.error(`Cannot add more. Only ${availableStock} items in stock.`, {
        icon: "⚠️",
        duration: 3000,
        id: `stock-limit-${product.id}`,
      });
      return;
    }

    if (existingItem) {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQuantity, availableStock }
            : item
        )
      );
      toast.success(`Updated ${product.name} quantity!`, {
        icon: "🛒",
        id: `cart-success-${product.id}`,
      });
    } else {
      setCartItems((prevItems) => [
        ...prevItems,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          quantity: quantity,
          availableStock: availableStock,
        },
      ]);
      toast.success(`Added ${product.name} to cart!`, {
        icon: "🛒",
        id: `cart-success-${product.id}`,
      });
    }
  };

  const updateQuantity = (productId, newQuantity, availableStock) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > availableStock) {
      toast.error(
        `Cannot add more. Only ${availableStock} items available in stock.`,
        {
          icon: "⚠️",
          duration: 3000,
          id: `stock-limit-${productId}`,
        }
      );
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
