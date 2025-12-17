import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Leads, Customers } from "../../lib/api";

type Point = { label: string; count: number };

export default function LeadsCustomersChart({ token }: { token: string }) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [leadPage, custPage] = await Promise.all([
          Leads.list(token, 1, 500),
          Customers.list(token, 1, 500),
        ]);

        const leadCount = leadPage.meta.total ?? leadPage.data.length;
        const customerCount = custPage.meta.total ?? custPage.data.length;

        setData([
          { label: "Leads", count: leadCount },
          { label: "Customers", count: customerCount },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
