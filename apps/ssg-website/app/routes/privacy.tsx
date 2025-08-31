import type { Route } from "./+types/privacy";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy - Uni Feedback" },
    { name: "description", content: "Privacy policy for Uni Feedback platform." },
  ];
}

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-lg max-w-none">
        <p>
          Your privacy is important to us. This policy explains how we collect, use, and protect your information.
        </p>
        <h2>Information We Collect</h2>
        <p>
          We collect anonymous course reviews and basic usage analytics.
        </p>
        <h2>How We Use Information</h2>
        <p>
          We use collected information to improve our service and provide better course recommendations.
        </p>
        <h2>Data Protection</h2>
        <p>
          We implement appropriate security measures to protect your information.
        </p>
      </div>
    </div>
  )
}