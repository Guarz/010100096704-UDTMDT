import Icon from "./Icon.jsx";

export const emptyShopAddress = { label: "", phone: "", street: "", city: "" };

// Nhập nhiều địa chỉ cửa hàng / kho hàng (SHOP.addresses)
export default function ShopAddressesEditor({ value, onChange }) {
  const set = (i, key, v) => onChange(value.map((a, j) => (j === i ? { ...a, [key]: v } : a)));
  return (
    <div className="wide shop-address-editor">
      <span>Địa chỉ cửa hàng / kho hàng</span>
      {value.map((a, i) => (
        <div key={i}>
          <input value={a.label} onChange={(e) => set(i, "label", e.target.value)} placeholder="Tên chi nhánh (VD: Kho chính)" />
          <input value={a.phone} onChange={(e) => set(i, "phone", e.target.value)} placeholder="Số điện thoại" />
          <input value={a.street} onChange={(e) => set(i, "street", e.target.value)} placeholder="Số nhà, đường, phường, quận" />
          <input value={a.city} onChange={(e) => set(i, "city", e.target.value)} placeholder="Tỉnh / Thành phố" />
          <button type="button" disabled={value.length === 1} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Xóa địa chỉ"><Icon name="trash" size={14} /></button>
        </div>
      ))}
      <button type="button" className="text-action" onClick={() => onChange([...value, emptyShopAddress])}><Icon name="plus" size={12} /> Thêm địa chỉ</button>
    </div>
  );
}

export const toEditable = (addresses) =>
  addresses?.length ? addresses.map(({ label = "", phone, street, city }) => ({ label, phone, street, city })) : [emptyShopAddress];
