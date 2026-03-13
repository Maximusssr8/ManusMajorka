import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Search,
  TrendingUp,
  Flame,
  ShoppingBag,
  Star,
  BarChart3,
  ChevronDown,
  Plus,
  Mail,
  Loader2,
  PackageSearch,
  ArrowRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface WinningProduct {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  trendReason: string;
  platform: string;
  marginEstimate: string;
  competition: "Low" | "Medium" | "High";
  trendScore: number;
  category: string;
}

// ── Design Tokens ────────────────────────────────────────────────────────────

const colors = {
  pageBg: "#060608",
  cardBg: "#0c0c10",
  gold: "#d4af37",
  goldHover: "#e5c24a",
  textPrimary: "#f5f5f5",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  border: "rgba(255,255,255,0.06)",
  borderHover: "#d4af37",
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

const fonts = {
  heading: "Syne, sans-serif",
  body: "DM Sans, sans-serif",
};

// ── Filter Options ───────────────────────────────────────────────────────────

const CATEGORIES = [
  "All",
  "Fashion",
  "Beauty",
  "Home",
  "Tech",
  "Pets",
  "Fitness",
  "Health",
  "Electronics",
  "Jewellery",
];

const PRICE_RANGES = ["All", "Under $30", "$30-$60", "$60-$100", "$100+"];

const PLATFORMS = [
  "All",
  "TikTok",
  "Facebook",
  "Instagram",
  "Google Shopping",
];

const SORT_OPTIONS = ["Trend Score", "Margin", "Competition"];

const NICHES = [
  "General",
  "Fashion & Apparel",
  "Beauty & Skincare",
  "Health & Wellness",
  "Pet Products",
  "Home & Garden",
  "Tech & Gadgets",
  "Fitness & Sports",
  "Kids & Baby",
  "Jewellery & Accessories",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function competitionColor(level: string) {
  if (level === "Low") return colors.green;
  if (level === "Medium") return colors.yellow;
  return colors.red;
}

function platformColor(platform: string) {
  switch (platform) {
    case "TikTok":
      return "#00f2ea";
    case "Facebook":
      return "#1877f2";
    case "Instagram":
      return "#e1306c";
    case "Google Shopping":
      return "#4285f4";
    default:
      return colors.gold;
  }
}

// ── Select Component ─────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontFamily: fonts.body,
          fontSize: 11,
          fontWeight: 500,
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.textPrimary,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: "8px 32px 8px 12px",
            appearance: "none",
            outline: "none",
            cursor: "pointer",
            minWidth: 140,
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = colors.gold)}
          onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt} style={{ backgroundColor: "#111", color: "#fff" }}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: colors.textMuted,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          height: 20,
          width: "60%",
          backgroundColor: "rgba(255,255,255,0.04)",
          borderRadius: 6,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          height: 14,
          width: "90%",
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 6,
          animation: "pulse 1.5s ease-in-out infinite",
          animationDelay: "0.15s",
        }}
      />
      <div
        style={{
          height: 14,
          width: "75%",
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 6,
          animation: "pulse 1.5s ease-in-out infinite",
          animationDelay: "0.3s",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <div
          style={{
            height: 26,
            width: 70,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 20,
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: "0.45s",
          }}
        />
        <div
          style={{
            height: 26,
            width: 90,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 20,
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: "0.6s",
          }}
        />
      </div>
      <div
        style={{
          height: 8,
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 4,
          animation: "pulse 1.5s ease-in-out infinite",
          animationDelay: "0.75s",
        }}
      />
      <div
        style={{
          height: 36,
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 8,
          animation: "pulse 1.5s ease-in-out infinite",
          animationDelay: "0.9s",
        }}
      />
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onAddToResearch,
}: {
  product: WinningProduct;
  onAddToResearch: (p: WinningProduct) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${hovered ? colors.borderHover : colors.border}`,
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        boxShadow: hovered ? `0 0 20px rgba(212,175,55,0.06)` : "none",
      }}
    >
      {/* Title + Price */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3
          style={{
            fontFamily: fonts.heading,
            fontSize: 17,
            fontWeight: 700,
            color: colors.textPrimary,
            margin: 0,
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {product.name}
        </h3>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: 600,
            color: colors.gold,
            whiteSpace: "nowrap",
            marginLeft: 12,
          }}
        >
          {product.priceRange}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.textSecondary,
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {product.description}
      </p>

      {/* Trend Reason */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "10px 12px",
          backgroundColor: "rgba(212,175,55,0.04)",
          borderRadius: 10,
          border: `1px solid rgba(212,175,55,0.08)`,
        }}
      >
        <TrendingUp size={14} style={{ color: colors.gold, marginTop: 2, flexShrink: 0 }} />
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 1.5,
          }}
        >
          {product.trendReason}
        </span>
      </div>

      {/* Badges Row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {/* Platform Badge */}
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 11,
            fontWeight: 600,
            color: platformColor(product.platform),
            backgroundColor: `${platformColor(product.platform)}14`,
            padding: "4px 10px",
            borderRadius: 20,
            border: `1px solid ${platformColor(product.platform)}30`,
          }}
        >
          {product.platform}
        </span>

        {/* Margin Badge */}
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 11,
            fontWeight: 600,
            color: colors.green,
            backgroundColor: `${colors.green}14`,
            padding: "4px 10px",
            borderRadius: 20,
            border: `1px solid ${colors.green}30`,
          }}
        >
          {product.marginEstimate} margin
        </span>

        {/* Competition Badge */}
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 11,
            fontWeight: 600,
            color: competitionColor(product.competition),
            backgroundColor: `${competitionColor(product.competition)}14`,
            padding: "4px 10px",
            borderRadius: 20,
            border: `1px solid ${competitionColor(product.competition)}30`,
          }}
        >
          {product.competition} competition
        </span>
      </div>

      {/* Trend Score Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 11,
              fontWeight: 500,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Trend Score
          </span>
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 13,
              fontWeight: 700,
              color: colors.gold,
            }}
          >
            {product.trendScore}/100
          </span>
        </div>
        <div
          style={{
            height: 6,
            width: "100%",
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${product.trendScore}%`,
              background: `linear-gradient(90deg, ${colors.gold}, ${colors.goldHover})`,
              borderRadius: 3,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Add to Research Button */}
      <button
        onClick={() => onAddToResearch(product)}
        style={{
          fontFamily: fonts.body,
          fontSize: 13,
          fontWeight: 600,
          color: colors.gold,
          backgroundColor: "transparent",
          border: `1px solid ${colors.gold}`,
          borderRadius: 10,
          padding: "10px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "background-color 0.2s, color 0.2s",
          marginTop: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.gold;
          e.currentTarget.style.color = "#000";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = colors.gold;
        }}
      >
        <Plus size={14} />
        Add to Research
      </button>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function WinningProducts() {
  const { session } = useAuth();
  const token = session?.access_token;

  // Filters
  const [category, setCategory] = useState("All");
  const [priceRange, setPriceRange] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [sortBy, setSortBy] = useState("Trend Score");

  // Product data
  const [products, setProducts] = useState<WinningProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Daily subscription
  const [subEmail, setSubEmail] = useState("");
  const [subNiche, setSubNiche] = useState("General");
  const [subscribing, setSubscribing] = useState(false);

  // ── Fetch Products ───────────────────────────────────────────────────────

  const fetchProducts = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/tools/winning-products", {
        method: "POST",
        headers,
        body: JSON.stringify({
          category: category === "All" ? undefined : category,
          priceRange: priceRange === "All" ? undefined : priceRange,
          platform: platform === "All" ? undefined : platform,
          sortBy,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch winning products");

      const data = await res.json();
      setProducts(data.products ?? []);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Subscribe to Daily Products ──────────────────────────────────────────

  const handleSubscribe = async () => {
    if (!subEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setSubscribing(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/tools/daily-products-subscribe", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: subEmail.trim(), niche: subNiche }),
      });

      if (!res.ok) throw new Error("Subscription failed");

      toast.success("Subscribed! Check your inbox for daily winning products.");
      setSubEmail("");
    } catch (err: any) {
      toast.error(err.message || "Subscription failed");
    } finally {
      setSubscribing(false);
    }
  };

  // ── Add to Research ──────────────────────────────────────────────────────

  const handleAddToResearch = (product: WinningProduct) => {
    toast.success(`"${product.name}" added to your research list`);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.pageBg,
        fontFamily: fonts.body,
        color: colors.textPrimary,
      }}
    >
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <h1
              style={{
                fontFamily: fonts.heading,
                fontSize: 28,
                fontWeight: 800,
                color: colors.textPrimary,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Winning Products
            </h1>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                backgroundColor: colors.red,
                padding: "3px 10px",
                borderRadius: 20,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Flame size={12} />
              HOT
            </span>
          </div>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 15,
              color: colors.textSecondary,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            AI-powered product discovery for the Australian market
          </p>
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "flex-end",
            padding: 20,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            marginBottom: 28,
          }}
        >
          <FilterSelect label="Category" value={category} options={CATEGORIES} onChange={setCategory} />
          <FilterSelect label="Price Range" value={priceRange} options={PRICE_RANGES} onChange={setPriceRange} />
          <FilterSelect label="Platform" value={platform} options={PLATFORMS} onChange={setPlatform} />
          <FilterSelect label="Sort By" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />

          <button
            onClick={fetchProducts}
            disabled={loading}
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: 700,
              color: "#000",
              backgroundColor: colors.gold,
              border: "none",
              borderRadius: 10,
              padding: "10px 22px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background-color 0.2s, transform 0.1s",
              opacity: loading ? 0.7 : 1,
              marginLeft: "auto",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = colors.goldHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.gold;
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Find Products
          </button>
        </div>

        {/* ── Product Grid ────────────────────────────────────────────────── */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
              gap: 20,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
              gap: 20,
            }}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToResearch={handleAddToResearch}
              />
            ))}
          </div>
        ) : hasSearched ? (
          /* ── Empty State ──────────────────────────────────────────────── */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "64px 24px",
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <PackageSearch size={48} style={{ color: colors.textMuted, marginBottom: 16 }} />
            <h3
              style={{
                fontFamily: fonts.heading,
                fontSize: 18,
                fontWeight: 700,
                color: colors.textPrimary,
                margin: "0 0 8px",
              }}
            >
              No products found
            </h3>
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.textSecondary,
                margin: "0 0 24px",
                maxWidth: 400,
                lineHeight: 1.5,
              }}
            >
              Try adjusting your filters or broadening your search criteria to discover trending
              products.
            </p>
            <button
              onClick={() => {
                setCategory("All");
                setPriceRange("All");
                setPlatform("All");
                setSortBy("Trend Score");
                fetchProducts();
              }}
              style={{
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 600,
                color: "#000",
                backgroundColor: colors.gold,
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.goldHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.gold)}
            >
              <Search size={14} />
              Search All Products
            </button>
          </div>
        ) : (
          /* ── Initial State (before any search) ────────────────────────── */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "64px 24px",
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <ShoppingBag size={48} style={{ color: colors.gold, marginBottom: 16, opacity: 0.6 }} />
            <h3
              style={{
                fontFamily: fonts.heading,
                fontSize: 18,
                fontWeight: 700,
                color: colors.textPrimary,
                margin: "0 0 8px",
              }}
            >
              Discover Winning Products
            </h3>
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.textSecondary,
                margin: "0 0 24px",
                maxWidth: 420,
                lineHeight: 1.5,
              }}
            >
              Set your filters and hit "Find Products" to surface AI-curated trending products for
              the Australian ecommerce market.
            </p>
            <button
              onClick={fetchProducts}
              style={{
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 700,
                color: "#000",
                backgroundColor: colors.gold,
                border: "none",
                borderRadius: 10,
                padding: "12px 28px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.goldHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.gold)}
            >
              <Search size={14} />
              Find Products
            </button>
          </div>
        )}

        {/* ── Daily Subscription CTA ──────────────────────────────────────── */}
        <div
          style={{
            marginTop: 48,
            padding: 32,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "rgba(212,175,55,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mail size={22} style={{ color: colors.gold }} />
          </div>

          <div>
            <h3
              style={{
                fontFamily: fonts.heading,
                fontSize: 20,
                fontWeight: 700,
                color: colors.textPrimary,
                margin: "0 0 6px",
              }}
            >
              Get Daily Winning Products by Email
            </h3>
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.textSecondary,
                margin: 0,
                maxWidth: 480,
                lineHeight: 1.5,
              }}
            >
              Receive curated product picks tailored to your niche every morning. Stay ahead of
              trends without lifting a finger.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: 560,
            }}
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
              style={{
                fontFamily: fonts.body,
                fontSize: 13,
                color: colors.textPrimary,
                backgroundColor: colors.pageBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                padding: "10px 14px",
                outline: "none",
                flex: "1 1 200px",
                minWidth: 180,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = colors.gold)}
              onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
            />

            <div style={{ position: "relative", flex: "0 1 180px" }}>
              <select
                value={subNiche}
                onChange={(e) => setSubNiche(e.target.value)}
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.textPrimary,
                  backgroundColor: colors.pageBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  padding: "10px 32px 10px 14px",
                  appearance: "none",
                  outline: "none",
                  cursor: "pointer",
                  width: "100%",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = colors.gold)}
                onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
              >
                {NICHES.map((n) => (
                  <option key={n} value={n} style={{ backgroundColor: "#111", color: "#fff" }}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.textMuted,
                  pointerEvents: "none",
                }}
              />
            </div>

            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              style={{
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: 700,
                color: "#000",
                backgroundColor: colors.gold,
                border: "none",
                borderRadius: 10,
                padding: "10px 22px",
                cursor: subscribing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: subscribing ? 0.7 : 1,
                transition: "background-color 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!subscribing) e.currentTarget.style.backgroundColor = colors.goldHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.gold;
              }}
            >
              {subscribing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
