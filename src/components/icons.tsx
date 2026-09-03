"use client";

/* ─── Shared icon set - @phosphor-icons/react, re-exported under the app's
   existing icon names so every call site (`<XIcon className="w-4 h-4" />`)
   keeps working unchanged. Weight is fixed per-icon to keep a single
   consistent line weight across the app. ─── */
import type { SVGProps } from "react";
import {
  SquaresFour,
  Buildings,
  CreditCard,
  HardDrives,
  Star,
  ChartBar,
  Plus,
  X,
  CheckCircle,
  Warning,
  Info,
  Eye,
  PencilSimple,
  Trash,
  QrCode,
  Copy,
  ArrowSquareOut,
  ArrowsClockwise,
  List,
  SignOut,
  ShieldCheck,
  User,
  MagnifyingGlass,
  UploadSimple,
  Lock,
  Sun,
  Moon,
  Tray,
  DeviceMobile,
  ArrowRight,
  ArrowLeft,
  GoogleLogo,
  ChatCircleText,
  Storefront,
  Sparkle,
  ForkKnife,
  EyeSlashIcon as PhosphorEyeSlash,
  DownloadSimpleIcon as PhosphorDownloadSimple,
  type Icon,
} from "@phosphor-icons/react";

type IconProps = SVGProps<SVGSVGElement>;

function make(Base: Icon, weight: "regular" | "bold" | "duotone" | "fill" = "regular") {
  return function Wrapped(props: IconProps) {
    return <Base weight={weight} {...props} />;
  };
}

export const OverviewIcon = make(SquaresFour);
export const BusinessesIcon = make(Buildings);
export const PlansIcon = make(CreditCard);
export const HardwareIcon = make(HardDrives);
export const ReviewsIcon = make(Star);
export const StarIcon = make(Star, "bold");
export const StarFillIcon = make(Star, "fill");
export const AnalyticsIcon = make(ChartBar);
export const PlusIcon = make(Plus, "bold");
export const CloseIcon = make(X, "bold");
export const CheckIcon = make(CheckCircle, "bold");
export const AlertIcon = make(Warning, "bold");
export const InfoIcon = make(Info, "bold");
export const EyeIcon = make(Eye);
export const PencilIcon = make(PencilSimple);
export const TrashIcon = make(Trash);
export const QrIcon = make(QrCode);
export const CopyIcon = make(Copy);
export const ExternalLinkIcon = make(ArrowSquareOut, "bold");
export const RefreshIcon = make(ArrowsClockwise, "bold");
export const MenuIcon = make(List);
export const LogoutIcon = make(SignOut);
export const ShieldIcon = make(ShieldCheck);
export const UserIcon = make(User);
export const SearchIcon = make(MagnifyingGlass, "bold");
export const UploadIcon = make(UploadSimple, "bold");
export const LockIcon = make(Lock);
export const SunIcon = make(Sun, "bold");
export const MoonIcon = make(Moon, "bold");
export const TrayIcon = make(Tray);
export const DeviceMobileIcon = make(DeviceMobile);
export const ArrowRightIcon = make(ArrowRight, "bold");
export const ArrowLeftIcon = make(ArrowLeft, "bold");
export const GoogleLogoIcon = make(GoogleLogo);
export const ChatIcon = make(ChatCircleText);
export const StorefrontIcon = make(Storefront);
export const SparkleIcon = make(Sparkle, "bold");
export const MenuFoodIcon = make(ForkKnife);
export const EyeSlashIcon = make(PhosphorEyeSlash);
export const DownloadIcon = make(PhosphorDownloadSimple, "bold");

export const TAB_ICONS = {
  overview: OverviewIcon,
  businesses: BusinessesIcon,
  plans: PlansIcon,
  hardware: HardwareIcon,
  menu: MenuFoodIcon,
  analytics: AnalyticsIcon,
} as const;
