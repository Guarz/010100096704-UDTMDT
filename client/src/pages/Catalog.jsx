import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon, { Stars } from "../components/Icon.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { Breadcrumb, EmptyState, FilterGroup, Loading } from "../components/Common.jsx";
import { toQuery } from "../lib/api.js";
import { useApi, useCategories } from "../lib/hooks.js";

export const PRICE_RANGES = {
  "Tất cả": {},
  "Dưới 10 triệu": { maxPrice: 9999999 },
  "10 - 20 triệu": { minPrice: 10000000, maxPrice: 20000000 },
  "Trên 20 triệu": { minPrice: 20000001 },
};
export const SORTS = { "Nổi bật": "featured", "Bán chạy": "bestseller", "Giá tăng dần": "price_asc", "Giá giảm dần": "price_desc", "Mới nhất": "newest" };

export default function Catalog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const categories = useCategories();
  const category = categories.find((c) => c._id === id);
  const [sort, setSort] = useState("Nổi bật");
  const [brands, setBrands] = useState([]);
  const [price, setPrice] = useState("Tất cả");
  const [inStock, setInStock] = useState(false);
  const [rating, setRating] = useState(false);
  const [specs, setSpecs] = useState([]);
  const reset = () => { setBrands([]); setPrice("Tất cả"); setInStock(false); setRating(false); setSpecs([]); };
  useEffect(reset, [id]);

  // Không có id (/category) = tất cả sản phẩm
  const facets = useApi(`/products/facets${toQuery({ category: id })}`);
  const query = useMemo(
    () =>
      toQuery({
        category: id,
        brands: brands.join(","),
        ...PRICE_RANGES[price],
        inStock: inStock ? 1 : "",
        minRating: rating ? 4.5 : "",
        specs: specs.join("|"),
        sort: SORTS[sort],
        limit: 48,
      }),
    [id, brands, price, inStock, rating, specs, sort]
  );
  const { data, loading } = useApi(`/products${query}`);
  const visible = data?.items || [];
  const toggle = (setter) => (value) => setter((v) => (v.includes(value) ? v.filter((x) => x !== value) : [...v, value]));
  const name = id ? category?.categoryName || "Danh mục" : "Tất cả sản phẩm";

  return (
    <main className="shell catalog-page">
      <Breadcrumb items={id ? [{ label: "Danh mục sản phẩm", to: "/category" }, { label: name }] : [{ label: "Danh mục sản phẩm" }]} />
      <div className="catalog-title"><div><span>Danh mục sản phẩm</span><h1>{name}</h1><p>Có {facets.data?.total ?? 0} sản phẩm{id ? " trong danh mục" : ""}. {category?.description || "Khám phá thiết bị phù hợp tại NOVA."}</p></div></div>
      <div className="catalog-layout">
        <aside className="filters">
          <div className="filter-title"><b><Icon name="filter" size={18} /> Bộ lọc</b><button onClick={() => (id ? navigate("/category") : reset())}>Xóa tất cả</button></div>
          <FilterGroup title="Danh mục">
            {[{ _id: "", categoryName: "Tất cả" }, ...categories].map((c) => (
              <label key={c._id || "all"}><input type="radio" name="category" checked={(id || "") === c._id} onChange={() => navigate(c._id ? `/category/${c._id}` : "/category")} /><span>{c.categoryName}</span>{c._id && <small className="filter-count">{c.productCount}</small>}</label>
            ))}
          </FilterGroup>
          <FilterGroup title="Khoảng giá">{Object.keys(PRICE_RANGES).map((x) => <label key={x}><input type="radio" name="price" checked={price === x} onChange={() => setPrice(x)} /><span>{x}</span></label>)}</FilterGroup>
          <FilterGroup title="Thương hiệu">{(facets.data?.brands || []).map((x) => <label key={x}><input type="checkbox" checked={brands.includes(x)} onChange={() => toggle(setBrands)(x)} /><span>{x}</span></label>)}</FilterGroup>
          <FilterGroup title="Đánh giá"><label><input type="checkbox" checked={rating} onChange={(e) => setRating(e.target.checked)} /><span className="stars"><Stars value={5} size={11} /> <i>từ 4.5 sao</i></span></label></FilterGroup>
          <FilterGroup title="Tình trạng"><label><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /><span>Chỉ sản phẩm còn hàng</span></label></FilterGroup>
          <FilterGroup title="Thông số nổi bật">{(facets.data?.specs || []).map((x) => <label key={x}><input type="checkbox" checked={specs.includes(x)} onChange={() => toggle(setSpecs)(x)} /><span>{x.replace(": ", " ")}</span></label>)}</FilterGroup>
        </aside>
        <div className="catalog-content">
          <div className="catalog-toolbar">
            <div><b>{data?.total ?? 0} sản phẩm</b><span>phù hợp với lựa chọn của bạn</span></div>
            <label>Sắp xếp: <select value={sort} onChange={(e) => setSort(e.target.value)}>{Object.keys(SORTS).map((x) => <option key={x}>{x}</option>)}</select></label>
          </div>
          {loading && !data ? <Loading /> : visible.length ? <div className="product-grid">{visible.map((p) => <ProductCard key={p._id} product={p} />)}</div> : <EmptyState />}
          {id && <div className="other-categories"><b>Danh mục khác</b>{categories.filter((c) => c._id !== id).map((c) => <button key={c._id} onClick={() => navigate(`/category/${c._id}`)}>{c.categoryName}</button>)}</div>}
        </div>
      </div>
    </main>
  );
}
