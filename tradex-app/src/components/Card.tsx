import React from "react";
import Icon from "./Icon";
import styles from "./Card.module.css";

interface CardProps {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function Card({ children, disabled, className }: CardProps) {
  const cardClassName = `${styles.card} ${disabled ? styles.disabled : ""} ${className || ""}`;
  return <div className={cardClassName}>{children}</div>;
}

interface CardIconProps {
  name: string;
  color?: string;
  className?: string;
}

Card.Icon = function CardIcon({ name, color, className }: CardIconProps) {
  return (
    <div className={`${styles.icon} ${className || ""}`} style={color ? { color } : undefined}>
      <Icon name={name} style={{ fontSize: "28px" }} />
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

Card.Title = function CardTitle({ children, className }: CardTitleProps) {
  return <h3 className={`${styles.title} ${className || ""}`}>{children}</h3>;
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

Card.Body = function CardBody({ children, className }: CardBodyProps) {
  return <div className={`${styles.text} ${className || ""}`}>{children}</div>;
};

interface CardActionsProps {
  children: React.ReactNode;
  className?: string;
}

Card.Actions = function CardActions({ children, className }: CardActionsProps) {
  return <div className={`${styles.buttonContainer} ${className || ""}`}>{children}</div>;
};

interface CardActionBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

Card.ActionBtn = function CardActionBtn({ children, className, ...props }: CardActionBtnProps) {
  return (
    <button className={`${styles.cta} ${className || ""}`} {...props}>
      {children}
    </button>
  );
};
