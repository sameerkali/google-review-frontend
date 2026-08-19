"use client";

import { useAdmin } from "../_lib/context";
import type { Row } from "../_lib/types";
import { ListTab } from "../_components/ListTab";

export default function PlansPage() {
  const { data, dataLoading, toast, create } = useAdmin();
  return (
    <ListTab
      title="Plan Management"
      rows={(data.p as Row[]) || []}
      cols={["name", "billingType", "price"]}
      onAdd={(body) => create("plans", body).then(Boolean)}
      addFields={["name", "billingType", "price"]}
      loading={dataLoading}
      toast={toast}
    />
  );
}
