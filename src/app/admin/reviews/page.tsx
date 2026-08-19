"use client";

import { useAdmin } from "../_lib/context";
import type { Row } from "../_lib/types";
import { ListTab } from "../_components/ListTab";

export default function ReviewsPage() {
  const { data, dataLoading, toast, create } = useAdmin();
  return (
    <ListTab
      title="Review Suggestion Management"
      rows={(data.s as Row[]) || []}
      cols={["businessId", "reviewText", "status"]}
      onAdd={(body) => create("review-suggestions", body).then(Boolean)}
      addFields={["businessId", "reviewText"]}
      loading={dataLoading}
      toast={toast}
    />
  );
}
