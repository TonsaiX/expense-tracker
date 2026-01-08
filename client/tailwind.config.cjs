module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.30)",
        glow: "0 0 0 1px rgba(255,255,255,.10), 0 14px 44px rgba(0,0,0,.40)",
        cute: "0 12px 30px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.12)"
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.6rem"
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        pop: {
          "0%": { transform: "scale(0.98)" },
          "100%": { transform: "scale(1)" }
        }
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        pop: "pop .12s ease-out"
      }
    }
  },
  plugins: []
};
