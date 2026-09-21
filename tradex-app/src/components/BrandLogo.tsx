import { branding } from "../config/branding";

interface BrandLogoProps {
  className?: string;
  accentClassName?: string;
  height?: number | string;
}

export default function BrandLogo({ className, accentClassName, height }: BrandLogoProps) {
  if (branding.logoUrl) {
    return (
      <img
        src={branding.logoUrl}
        alt={branding.appName}
        className={className}
        style={height ? { height, width: "auto" } : undefined}
      />
    );
  }

  return (
    <span className={className}>
      {branding.brandPrefix}
      {branding.accentText ? <span className={accentClassName}>{branding.accentText}</span> : null}
    </span>
  );
}
