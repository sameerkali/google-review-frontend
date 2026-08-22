export type Row = Record<string, any>;

export interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  msg: string;
}

export type ToastFn = (kind: Toast["kind"], msg: string) => void;
