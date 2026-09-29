import AdminPanel from "@/components/admin/panel";
export default function AdminPage() {
  return <AdminPanel publicUrl={process.env.PUBLIC_URL || "/"} />;
}
