import { branding } from "../config/branding";

interface BrandLogoProps {
  className?: string;
  accentClassName?: string;
  height?: number | string;
}

/**
 * Brand mark + two-tone wordmark. The mark scales with the surrounding
 * font-size (1.4em) unless an explicit height is passed.
 */
export default function BrandLogo({ className, accentClassName, height }: BrandLogoProps) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: "0.4em" }}>
      {branding.logoUrl ? (
        <img
          src={branding.logoUrl}
          alt=""
          aria-hidden="true"
          style={{ height: height ?? "1.4em", width: "auto", display: "block" }}
        />
      ) : null}
      <span>
        {branding.brandPrefix}
        {branding.accentText ? <span className={accentClassName}>{branding.accentText}</span> : null}
      </span>
    </span>
  );
}
