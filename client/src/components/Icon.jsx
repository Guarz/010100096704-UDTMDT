import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBatteryFull,
  faBolt,
  faBoxOpen,
  faCamera,
  faCartShopping,
  faCheck,
  faCircleCheck,
  faCircleExclamation,
  faClock,
  faComputerMouse,
  faDesktop,
  faGamepad,
  faHardDrive,
  faHeadphones,
  faHeadset,
  faKeyboard,
  faLaptop,
  faLocationDot,
  faLock,
  faMagnifyingGlass,
  faMemory,
  faMicrochip,
  faMinus,
  faMobileScreen,
  faPlug,
  faPlus,
  faPrint,
  faShieldHalved,
  faSliders,
  faStar,
  faStarHalfStroke,
  faStore,
  faTabletScreenButton,
  faTrashCan,
  faTruckFast,
  faTv,
  faVolumeHigh,
  faWifi,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarEmpty, faUser } from "@fortawesome/free-regular-svg-icons";
import { faFacebookF, faTiktok, faYoutube } from "@fortawesome/free-brands-svg-icons";

// Tên icon dùng trong toàn hệ thống -> icon Font Awesome.
// Giữ tên cũ (phone, cpu, headphone...) vì danh mục trong database lưu theo tên này.
const ICONS = {
  // giao diện chung
  search: faMagnifyingGlass,
  user: faUser,
  truck: faTruckFast,
  cart: faCartShopping,
  arrow: faArrowRight,
  star: faStar,
  "star-half": faStarHalfStroke,
  "star-empty": faStarEmpty,
  check: faCheck,
  "check-circle": faCircleCheck,
  warning: faCircleExclamation,
  filter: faSliders,
  close: faXmark,
  box: faBoxOpen,
  plus: faPlus,
  minus: faMinus,
  trash: faTrashCan,
  lock: faLock,
  store: faStore,
  location: faLocationDot,
  shield: faShieldHalved,
  support: faHeadset,
  facebook: faFacebookF,
  youtube: faYoutube,
  tiktok: faTiktok,
  // icon danh mục sản phẩm
  phone: faMobileScreen,
  laptop: faLaptop,
  cpu: faMicrochip,
  monitor: faDesktop,
  keyboard: faKeyboard,
  mouse: faComputerMouse,
  headphone: faHeadphones,
  tablet: faTabletScreenButton,
  camera: faCamera,
  gamepad: faGamepad,
  tv: faTv,
  watch: faClock,
  speaker: faVolumeHigh,
  storage: faHardDrive,
  memory: faMemory,
  network: faWifi,
  printer: faPrint,
  charger: faPlug,
  battery: faBatteryFull,
  accessory: faBolt,
};

// Icon admin có thể chọn cho danh mục
export const CATEGORY_ICONS = ["phone", "laptop", "tablet", "cpu", "monitor", "keyboard", "mouse", "headphone", "speaker", "camera", "gamepad", "tv", "watch", "storage", "memory", "network", "printer", "charger", "battery", "accessory", "box"];

export default function Icon({ name, size = 20, className }) {
  return <FontAwesomeIcon icon={ICONS[name] || faBoxOpen} className={className} style={{ fontSize: size }} aria-hidden="true" />;
}

// Hiển thị điểm đánh giá bằng sao đặc / nửa sao / sao rỗng
export function Stars({ value = 0, size = 13 }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="fa-stars" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => <Icon key={n} size={size} name={rounded >= n ? "star" : rounded >= n - 0.5 ? "star-half" : "star-empty"} />)}
    </span>
  );
}
