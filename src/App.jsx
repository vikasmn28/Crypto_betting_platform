import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { ref, set, get, push, onValue } from "firebase/database";
import { signInWithEmailAndPassword } from "firebase/auth";
import TradingViewWidget from "react-tradingview-widget";
import axios from "axios";

export default function App() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [btcPrice, setBtcPrice] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);

  const userId = auth.currentUser?.uid;

  // Auto login
  useEffect(() => {
    signInWithEmailAndPassword(auth, "test@example.com", "test123")
      .then((userCred) => {
        const uid = userCred.user.uid;
        const balanceRef = ref(db, `users/${uid}/balance`);
        get(balanceRef).then((snapshot) => {
          if (!snapshot.exists()) {
            set(balanceRef, 1000); // Set initial balance to $1000
          }
        });
      })
      .catch((err) => console.error("Login failed:", err.message));
  }, []);

  // BTC price
  useEffect(() => {
    const fetchPrice = async () => {
      const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
      setBtcPrice(parseFloat(res.data.price));
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, []);

  // User balance
  useEffect(() => {
    if (!userId) return;
    const balanceRef = ref(db, `users/${userId}/balance`);
    onValue(balanceRef, (snapshot) => {
      setBalance(snapshot.val() ?? 0);
    });
  }, [userId]);

  // Trade history
  useEffect(() => {
    if (!userId) return;
    const historyRef = ref(db, `users/${userId}/trades`);
    onValue(historyRef, (snapshot) => {
      const trades = snapshot.val() || {};
      const parsed = Object.values(trades).sort((a, b) => b.timestamp - a.timestamp);
      setTradeHistory(parsed);
    });
  }, [userId]);

  // Place order
  const placeOrder = (type) => {
    const amt = Number(amount);
    if (!userId || !amt || amt <= 0 || amt > balance) return alert("Invalid order");

    const orderPrice = btcPrice;
    const orderId = Date.now();
    const newOrder = { id: orderId, type, amount: amt, startTime: Date.now(), price: orderPrice };
    setOrders([...orders, newOrder]);

    set(ref(db, `users/${userId}/balance`), balance - amt);

    setTimeout(() => {
      const currentPrice = btcPrice;
      const isWin = (type === "buy" && currentPrice > orderPrice) || (type === "sell" && currentPrice < orderPrice);
      const profit = isWin ? amt * 0.8 : 0;
      const newBalance = isWin ? balance - amt + amt + profit : balance - amt;

      set(ref(db, `users/${userId}/balance`), newBalance);

      const result = {
        ...newOrder,
        endTime: Date.now(),
        result: isWin ? "win" : "loss",
        profit: isWin ? profit : -amt,
        finalPrice: currentPrice,
        timestamp: Date.now()
      };
      push(ref(db, `users/${userId}/trades`), result);
    }, 60000);
  };

  const getRemaining = (startTime) => {
    const diff = 60 - Math.floor((Date.now() - startTime) / 1000);
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Chart Left */}
      <div className="w-3/4 h-full">
        <TradingViewWidget symbol="BINANCE:BTCUSDT" theme="dark" autosize />
      </div>

      {/* Sidebar Right */}
      <div className="w-1/4 flex flex-col h-full border-l border-gray-800 p-4">
        <h1 className="text-2xl font-bold text-purple-400 mb-2">Crypto Betting App</h1>
        <p className="text-md text-green-400 font-semibold mb-2">Balance: ${balance.toFixed(2)}</p>
        <p className="text-sm text-blue-400 mb-4">Live BTC: ${btcPrice?.toFixed(2)}</p>

        {/* Trade History */}
        <div className="flex-1 overflow-y-auto bg-[#1e1e2e] p-3 rounded mb-4">
          <h2 className="text-md font-bold border-b border-gray-700 mb-2">Trade History</h2>
          {tradeHistory.length === 0 ? (
            <p className="text-sm text-gray-400">No trades yet</p>
          ) : (
            tradeHistory.map((trade, i) => (
              <div key={i} className="border-b border-gray-700 pb-2 mb-2 text-sm">
                <div className="flex justify-between">
                  <span className="capitalize">{trade.type}</span>
                  <span className={trade.result === "win" ? "text-green-400" : "text-red-400"}>
                    {trade.result}
                  </span>
                </div>
                <div className="text-gray-300">Amount: ${trade.amount}</div>
                <div className="text-gray-300">Profit/Loss: {trade.profit}</div>
              </div>
            ))
          )}
        </div>

        {/* Buy/Sell Inputs */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 p-2 bg-[#2a2a40] text-white rounded placeholder:text-gray-400"
          />
          <button onClick={() => placeOrder("buy")} className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded">
            Buy
          </button>
          <button onClick={() => placeOrder("sell")} className="bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded">
            Sell
          </button>
        </div>

        {/* Active Orders */}
        <div className="mt-4 text-xs">
          <h3 className="font-semibold border-b border-gray-700 mb-1">Active Trades</h3>
          {orders.map((order) => (
            <div key={order.id} className="flex justify-between text-gray-400">
              <span>{order.type}</span>
              <span>{getRemaining(order.startTime)}s left</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
