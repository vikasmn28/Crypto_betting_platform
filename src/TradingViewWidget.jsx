// src/components/TradingViewWidget.jsx

import React, { useEffect, useRef } from "react";

function TradingViewWidget() {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;

    script.onload = () => {
      new window.TradingView.widget({
        container_id: "tradingview_widget",
        autosize: true,
        symbol: "BINANCE:BTCUSDT",
        interval: "1",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        studies: ["MACD@tv-basicstudies"],
      });
    };

    container.current.appendChild(script);
  }, []);

  return <div id="tradingview_widget" ref={container} className="h-full w-full" />;
}

export default TradingViewWidget;
