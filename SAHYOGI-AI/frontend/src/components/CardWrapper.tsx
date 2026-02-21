"use client";

export default function CardWrapper({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition duration-300 ${className}`}
    >
      {children}
    </div>
  );
}