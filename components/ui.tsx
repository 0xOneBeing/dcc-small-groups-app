"use client";

import { CSSProperties, ReactNode, useState } from "react";
import Link from "next/link";
import { colors } from "@/lib/tokens";

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
  radius = 12,
  padding = "13px 14px",
  fontSize = 14.5,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  radius?: number;
  padding?: string;
  fontSize?: number;
  style?: CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      type={type}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: `1.5px solid ${focused ? colors.red : colors.borderStrong}`,
        borderRadius: radius,
        padding,
        fontSize,
        outline: "none",
        background: focused ? "#fff" : colors.fieldBg,
        fontFamily: mono ? "var(--font-plex-mono), monospace" : "inherit",
        ...style,
      }}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  minHeight = 150,
  fontSize = 14,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  fontSize?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        width: "100%",
        minHeight,
        border: `1.5px solid ${focused ? colors.red : colors.borderStrong}`,
        borderRadius: 12,
        padding: 14,
        fontSize,
        lineHeight: 1.55,
        outline: "none",
        resize: "vertical",
        background: focused ? "#fff" : colors.fieldBg,
      }}
    />
  );
}

type BtnVariant = "primary" | "secondary" | "dark" | "danger-outline" | "ghost";

export function Button({
  children,
  onClick,
  variant = "secondary",
  fullWidth = false,
  style,
  padding = "13px 20px",
  fontSize = 14,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  fullWidth?: boolean;
  style?: CSSProperties;
  padding?: string;
  fontSize?: number;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);

  const base: CSSProperties = {
    cursor: disabled ? "default" : "pointer",
    fontWeight: 600,
    padding,
    fontSize,
    borderRadius: 12,
    letterSpacing: "-0.01em",
    width: fullWidth ? "100%" : undefined,
    opacity: disabled ? 0.6 : 1,
  };

  const variants: Record<BtnVariant, CSSProperties> = {
    primary: {
      border: "none",
      background: hover ? colors.redDark : colors.red,
      color: "#fff",
    },
    dark: {
      border: "none",
      background: colors.ink,
      color: "#fff",
    },
    secondary: {
      border: `1.5px solid ${hover ? colors.ink : colors.borderStrong}`,
      background: "#fff",
      color: colors.ink,
    },
    "danger-outline": {
      border: `1.5px solid ${hover ? colors.red : colors.borderStrong}`,
      background: "#fff",
      color: hover ? colors.red : colors.ink,
    },
    ghost: {
      border: "none",
      background: "transparent",
      color: colors.faint,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

const BTN_VARIANT_STYLE: Record<BtnVariant, CSSProperties> = {
  primary: { border: "none", background: colors.red, color: "#fff" },
  dark: { border: "none", background: colors.ink, color: "#fff" },
  secondary: { border: `1.5px solid ${colors.borderStrong}`, background: "#fff", color: colors.ink },
  "danger-outline": { border: `1.5px solid ${colors.borderStrong}`, background: "#fff", color: colors.ink },
  ghost: { border: "none", background: "transparent", color: colors.faint },
};

/** Same look as {@link Button}, but a real anchor — safe to use where a `<button>` would nest inside a `<Link>`. */
export function LinkButton({
  children,
  href,
  variant = "secondary",
  fullWidth = false,
  style,
  padding = "13px 20px",
  fontSize = 14,
}: {
  children: ReactNode;
  href: string;
  variant?: BtnVariant;
  fullWidth?: boolean;
  style?: CSSProperties;
  padding?: string;
  fontSize?: number;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        textAlign: "center",
        cursor: "pointer",
        fontWeight: 600,
        padding,
        fontSize,
        borderRadius: 12,
        letterSpacing: "-0.01em",
        width: fullWidth ? "100%" : undefined,
        minHeight: 44,
        boxSizing: "border-box",
        ...BTN_VARIANT_STYLE[variant],
        ...style,
      }}
    >
      {children}
    </Link>
  );
}

export function Chip({
  label,
  active,
  onClick,
  activeBg = colors.ink,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  activeBg?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? activeBg : colors.borderStrong}`,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        padding: "8px 12px",
        borderRadius: 9,
        whiteSpace: "nowrap",
        background: active ? activeBg : "#fff",
        color: active ? "#fff" : colors.muted,
      }}
    >
      {label}
    </button>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div style={{ background: "#fff", borderBottom: `1px solid ${colors.border}`, padding: "22px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div>
          {eyebrow && <div style={{ fontSize: 11.5, color: colors.faint, marginBottom: 6 }}>{eyebrow}</div>}
          <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.15 }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: colors.muted, marginTop: 5 }}>{sub}</div>}
        </div>
        {right && <div style={{ display: "flex", gap: 9, alignItems: "center", flexShrink: 0 }}>{right}</div>}
      </div>
    </div>
  );
}
