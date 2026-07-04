interface IconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export default function Icon({ name, className, style, title }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className || ""}`}
      style={{
        fontFamily: "'Material Symbols Outlined'", // Inline font override prevents text rendering bugs
        verticalAlign: "middle",
        ...style
      }}
      title={title}
    >
      {name}
    </span>
  );
}
