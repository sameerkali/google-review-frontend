"use client";

import { useState } from "react";
import { useAdmin } from "../_lib/context";
import type { Row } from "../_lib/types";
import { ListTab } from "../_components/ListTab";
import { BulkReviewUploadModal } from "../_components/BulkReviewUploadModal";
import { UploadIcon } from "../_lib/icons";

export default function ReviewsPage() {
  const { data, dataLoading, toast, create, token, refresh } = useAdmin();
  const [bulkOpen, setBulkOpen] = useState(false);
  return (
    <>
      <ListTab
        title="Review Suggestion Management"
        rows={(data.s as Row[]) || []}
        cols={["businessId", "reviewText", "status"]}
        onAdd={(body) => create("review-suggestions", body).then(Boolean)}
        addFields={["businessId", "reviewText"]}
        loading={dataLoading}
        toast={toast}
        secondaryAction={{ label: "Upload JSON", icon: <UploadIcon className="w-4 h-4" />, onClick: () => setBulkOpen(true) }}
      />
      <BulkReviewUploadModal
        open={bulkOpen}
        businesses={(data.b as Row[]) || []}
        token={token}
        onClose={() => setBulkOpen(false)}
        onRefresh={refresh}
        toast={toast}
      />
    </>
  );
}
