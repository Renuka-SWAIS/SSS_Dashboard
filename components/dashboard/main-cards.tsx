import React from "react";
import Link from "next/link";
import { BookIcon, ClipboardIcon, TargetIcon } from "@/components/dashboard/icons";

const cards = [
  {
    title: "Study A:",
    subtitle: "Core Material",
    description: "Access and review your course materials, notes, videos and more.",
    button: "Go to Core Material",
    href: "/dashboard/core-material",
    className: "main-card-a",
    iconClassName: "main-card-icon-a",
    buttonClassName: "main-card-btn-a",
    Icon: BookIcon,
  },
  {
    title: "Study B:",
    subtitle: "Assignment",
    description: "View your assignments, submit work and track your progress.",
    button: "Go to Assignment",
    href: "/dashboard/assignments",
    className: "main-card-b",
    iconClassName: "main-card-icon-b",
    buttonClassName: "main-card-btn-b",
    Icon: ClipboardIcon,
  },
  {
    title: "Study C:",
    subtitle: "Assessment",
    description: "Attempt quizzes and tests to evaluate your learning and skills.",
    button: "Go to Assessment",
    href: "/dashboard/assessments",
    className: "main-card-c",
    iconClassName: "main-card-icon-c",
    buttonClassName: "main-card-btn-c",
    Icon: TargetIcon,
  },
];

export function DashboardMainCards() {
  return (
    <div className="dashboard-main-cards">
      {cards.map(({ Icon, ...card }) => (
        <section key={card.subtitle} className={`main-card ${card.className}`}>
          <div className={`main-card-icon ${card.iconClassName}`}>
            <Icon className="main-card-icon-svg" />
          </div>
          <h3 className="main-card-title">
            <span>{card.title}</span>
            <span>{card.subtitle}</span>
          </h3>
          <div className="main-card-underline" />
          <p className="main-card-desc">{card.description}</p>
          <Link href={card.href} className={`main-card-btn ${card.buttonClassName}`}>
            <span>{card.button}</span>
            <span aria-hidden="true">-&gt;</span>
          </Link>
        </section>
      ))}
    </div>
  );
}
