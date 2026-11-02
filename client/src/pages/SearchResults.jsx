import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { Breadcrumb, EmptyState, FilterGroup, Loading } from "../components/Common.jsx";
import { toQuery } from "../lib/api.js";
import { useApi, useCategories } from "../lib/hooks.js";
import { PRICE_RANGES, SORTS } from "./Catalog.jsx";

const sortName = (key) => Object.keys(SORTS).find((k) => SORTS[k] === key) || "Nổi bật";

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const categories = useCategories();
  const [sort, setSort] = useState(sortName(params.get("sort")));
  const [category, setCategory] = useState("");
  const [inStock, setInStock] = useState(false);
  const [price, setPrice] = useState("Tất cả");
  const path = useMemo(
    () => `/products${toQuery({ q: query, category, inStock: inStock ? 1 : "", ...PRICE_RANGES[price], sort: SORTS[sort], limit: 48 })}`,
    [query, category, inStock, price, sort]
  );
  const { data, loading } = useApi(path);
  const results = data?.items || [];

  return (
    <main className="shell search-page">
      <Breadcrumb items={[{ label: "Tìm kiếm" }]} />
      <div className="search-heading">
        <div><span>Kết quả tìm kiếm</span><h1>{query ? `Sản phẩm cho “${query}”` : "Tất cả sản phẩm"}</h1><p>Tìm thấy <b>{data?.total ?? 0}</b> sản phẩm phù hợp</p></div>
        {query && <button onClick={() => setParams({})}><Icon name="close" size={17} /> Xóa tìm kiếm</button>}
      </div>
      <div className="catalog-layout search-layout">
        <aside className="filters">
          <div className="filter-title"><b><Icon name="filter" size={18} /> Lọc kết quả</b><button onClick={() => { setCategory(""); setPrice("Tất cả"); setInStock(false); }}>Đặt lại</button></div>
          <FilterGroup title="Danh mục">
            {[{ _id: "", categoryName: "Tất cả" }, ...categories].map((c) => <label key={c._id || "all"}><input type="radio" name="search-category" checked={category === c._id} onChange={() => setCategory(c._id)} /><span>{c.categoryName}</span></label>)}
          </FilterGroup>
          <FilterGroup title="Khoảng giá">{Object.keys(PRICE_RANGES).map((x) => <label key={x}><input type="radio" name="search-price" checked={price === x} onChange={() => setPrice(x)} /><span>{x}</span></label>)}</FilterGroup>
          <FilterGroup title="Tình trạng"><label><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /><span>Chỉ sản phẩm còn hàng</span></label></FilterGroup>
        </aside>
        <div className="catalog-content">
          <div className="catalog-toolbar"><div><b>{results.length} sản phẩm</b><span>đang hiển thị</span></div><label>Sắp xếp: <select value={sort} onChange={(e) => setSort(e.target.value)}>{Object.keys(SORTS).map((x) => <option key={x}>{x}</option>)}</select></label></div>
          {loading && !data ? <Loading /> : results.length ? <div className="product-grid">{results.map((p) => <ProductCard key={p._id} product={p} />)}</div> : <EmptyState />}
        </div>
      </div>
    </main>
  );
}
