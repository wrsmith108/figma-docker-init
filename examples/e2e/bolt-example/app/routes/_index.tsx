import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Bolt Dashboard App" },
    { name: "description", content: "A modern dashboard built with Bolt and Remix" },
  ];
};

export default function Index() {
  const [metrics] = useState([
    { label: "Total Users", value: "12,345", change: "+12.5%", trend: "up" },
    { label: "Revenue", value: "$54,321", change: "+8.3%", trend: "up" },
    { label: "Active Sessions", value: "892", change: "-2.1%", trend: "down" },
    { label: "Conversion Rate", value: "3.24%", change: "+0.5%", trend: "up" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bolt Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {metric.label}
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {metric.value}
                      </dd>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium ${
                        metric.trend === "up"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activity
              </h3>
              <div className="mt-5 border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {[
                    { user: "John Doe", action: "Signed up", time: "2 minutes ago" },
                    { user: "Jane Smith", action: "Made a purchase", time: "15 minutes ago" },
                    { user: "Bob Johnson", action: "Updated profile", time: "1 hour ago" },
                    { user: "Alice Williams", action: "Left a review", time: "2 hours ago" },
                  ].map((activity, index) => (
                    <li key={index} className="py-4">
                      <div className="flex space-x-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{activity.user}</h3>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                          </div>
                          <p className="text-sm text-gray-500">{activity.action}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
