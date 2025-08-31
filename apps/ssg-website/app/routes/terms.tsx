import type { Route } from "./+types/terms";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Terms of Service - Uni Feedback" },
    { name: "description", content: "Terms of service for Uni Feedback platform." },
  ];
}

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-lg max-w-none">
        <p>
          Welcome to Uni Feedback. By using our service, you agree to these terms.
        </p>
        <h2>Use of Service</h2>
        <p>
          You may use our service to share and read honest, anonymous course reviews.
        </p>
        <h2>Content Guidelines</h2>
        <p>
          All reviews must be honest, constructive, and relevant to the course content.
        </p>
        <h2>Privacy</h2>
        <p>
          We are committed to protecting your privacy. Please see our Privacy Policy for details.
        </p>
      </div>
    </div>
  )
}