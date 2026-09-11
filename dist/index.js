"use strict";
const base = "http://localhost:4100";
const app = document.querySelector("#app");
let shops = [];
let selected = "";
let view = "overview";
class Api {
    token() { return sessionStorage.getItem("inteligent-token") ?? ""; }
    async request(path, method = "GET", body) { const response = await fetch(base + path, { method, headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(this.token() ? { Authorization: `Bearer ${this.token()}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); if (!response.ok)
        throw new Error(String(response.status)); return response.json(); }
}
const api = new Api();
function escape(value) { const div = document.createElement("div"); div.textContent = String(value ?? ""); return div.innerHTML; }
function money(value, currency = "USD") { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value); }
function login() { app.innerHTML = `<main class="login"><form class="panel form" id="login"><p class="eyebrow">Seller workspace</p><h1>Inteligent Shop</h1><p class="muted">Manage every connected storefront in one place.</p><label>Email<input name="email" type="email" required></label><label>Password<input name="password" type="password" minlength="10" required></label><button class="button">Sign in</button><button class="button secondary" type="button" id="register">Create seller account</button><p class="status"></p></form></main>`; const form = document.querySelector("#login"); form.onsubmit = async (e) => { e.preventDefault(); const data = new FormData(form); try {
    const result = await api.request("/accounts/login", "POST", { email: data.get("email"), password: data.get("password") });
    sessionStorage.setItem("inteligent-token", result.accessToken);
    await boot();
}
catch {
    form.querySelector(".status").textContent = "Unable to sign in.";
} }; document.querySelector("#register").onclick = async () => { const data = new FormData(form); const email = String(data.get("email") ?? ""); const password = String(data.get("password") ?? ""); const displayName = prompt("Seller or company name")?.trim(); if (!displayName)
    return; try {
    await api.request("/accounts/register", "POST", { email, password, displayName });
    form.requestSubmit();
}
catch {
    form.querySelector(".status").textContent = "Check the details or use a different email.";
} }; }
function shell(content) { return `<div class="shell"><aside class="sidebar"><div class="brand">◈ Inteligent Shop</div><nav>${[["overview", "Overview"], ["products", "Products"], ["orders", "Orders"], ["buyers", "Accounts"], ["promotions", "Promotions"], ["recommendations", "Recommendations"]].map(([id, label]) => `<button data-view="${id}" class="${view === id ? "active" : ""}">${label}</button>`).join("")}</nav></aside><main class="main"><header class="top"><div><p class="eyebrow">Commerce control center</p><h1>${view[0]?.toUpperCase() + view.slice(1)}</h1></div><div class="toolbar"><select id="shop-select">${shops.map(s => `<option value="${s.id}" ${s.id === selected ? "selected" : ""}>${escape(s.name)}</option>`).join("")}</select><button class="button secondary" id="new-shop">+ Shop</button><button class="button secondary" id="logout">Sign out</button></div></header>${content}</main></div><div id="modal" class="modal hidden"></div>`; }
async function render() { if (!shops.length) {
    app.innerHTML = shell(`<section class="panel"><h2>Connect your first shop</h2><p class="muted">Create a channel for Nix-Shop or any other storefront.</p><button class="button" id="empty-shop">Create shop</button></section>`);
    bind();
    document.querySelector("#empty-shop").onclick = shopModal;
    return;
} if (!selected)
    selected = shops[0].id; let content = ""; if (view === "overview") {
    const [products, orders, buyers] = await Promise.all([getProducts(), getOrders(), api.request(`/shops/${selected}/buyers`)]);
    content = `<div class="grid"><article class="card metric"><span class="muted">Products</span><strong>${products.length}</strong></article><article class="card metric"><span class="muted">Orders</span><strong>${orders.length}</strong></article><article class="card metric"><span class="muted">Buyers</span><strong>${buyers.length}</strong></article></div>`;
}
else if (view === "products") {
    const products = await getProducts();
    content = `<div class="toolbar"><button class="button" id="new-product">+ Add product</button></div><div class="list">${products.map(p => `<article class="row"><div><strong>${escape(p.name)}</strong><div class="muted">${escape(p.sku)} · ${escape(p.source?.provider ?? "Manual")}</div></div><span>${money(p.price)}</span><span>${p.quantity} available</span><button class="button secondary" data-edit="${p.id}">Edit</button></article>`).join("") || `<section class="panel">No products yet.</section>`}</div>`;
}
else if (view === "orders") {
    const orders = await getOrders();
    content = `<div class="list">${orders.map(o => `<article class="row"><div><strong>#${escape(o.externalOrderId)}</strong><div class="muted">${escape(o.buyer.name)} · ${new Date(o.placedAt).toLocaleDateString()}</div></div><span>${money(o.total, o.currency)}</span><span>${escape(o.status)}</span><button class="button secondary" data-order="${o.id}">Manage</button></article>`).join("") || `<section class="panel">Connected-shop orders will appear here.</section>`}</div>`;
}
else if (view === "buyers") {
    const buyers = await api.request(`/shops/${selected}/buyers`);
    content = `<div class="list">${buyers.map(b => `<article class="row"><strong>${escape(b.name)}</strong><span>${escape(b.email)}</span><span>${escape(b.phone || "—")}</span><span></span></article>`).join("") || `<section class="panel">Buyer details appear after order ingestion.</section>`}</div>`;
}
else {
    content = `<section class="panel"><h2>${view === "promotions" ? "Product promotions" : "Homepage recommendations"}</h2><p class="muted">This API is ready. Use product IDs to ${view === "promotions" ? "create channel promotions" : "control storefront display order"}.</p><button class="button" id="configure">Configure</button></section>`;
} app.innerHTML = shell(content); bind(); document.querySelector("#new-product")?.addEventListener("click", () => productModal()); document.querySelectorAll("[data-edit]").forEach(button => button.onclick = async () => productModal((await getProducts()).find(p => p.id === button.dataset.edit))); }
async function getProducts() { return api.request(`/shops/${selected}/products`); }
async function getOrders() { return api.request(`/shops/${selected}/orders`); }
function bind() { document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => { view = b.dataset.view ?? "overview"; void render(); }); document.querySelector("#shop-select")?.addEventListener("change", e => { selected = e.target.value; void render(); }); document.querySelector("#new-shop")?.addEventListener("click", shopModal); document.querySelector("#logout")?.addEventListener("click", () => { sessionStorage.clear(); login(); }); document.querySelectorAll("[data-order]").forEach(button => button.onclick = () => void orderModal(button.dataset.order ?? "")); document.querySelector("#configure")?.addEventListener("click", () => view === "promotions" ? promotionModal() : recommendationModal()); }
function modal(html, onSubmit) { const root = document.querySelector("#modal"); root.classList.remove("hidden"); root.innerHTML = `<form class="panel form" id="modal-form">${html}<div class="toolbar"><button class="button">Save</button><button class="button secondary" type="button" id="cancel">Cancel</button></div><p class="status"></p></form>`; document.querySelector("#cancel").onclick = () => root.classList.add("hidden"); document.querySelector("#modal-form").onsubmit = async (e) => { e.preventDefault(); try {
    await onSubmit(new FormData(e.currentTarget));
    root.classList.add("hidden");
    await render();
}
catch {
    root.querySelector(".status").textContent = "Please check all fields.";
} }; }
function shopModal() { modal(`<h2>Connect shop</h2><div class="form-grid"><label>Name<input name="name" required></label><label>Slug<input name="slug" required></label><label>Channel type<select name="channelType"><option>custom</option><option>shopify</option><option>woocommerce</option></select></label><label>Currency<input name="currency" value="USD" maxlength="3" required></label></div><label>Website URL<input name="externalUrl" type="url"></label>`, async (d) => { const shop = await api.request("/shops", "POST", Object.fromEntries(d)); shops.push(shop); selected = shop.id; }); }
function productModal(product) { modal(`<h2>${product ? "Edit" : "Add"} product</h2><p class="muted">Paste normalized information from any approved supplier source, then edit before publishing.</p><div class="form-grid"><label>Name<input name="name" value="${escape(product?.name)}" required></label><label>SKU<input name="sku" value="${escape(product?.sku)}" required></label><label>Price<input name="price" type="number" min="0" step=".01" value="${product?.price ?? 0}" required></label><label>Quantity<input name="quantity" type="number" min="0" value="${product?.quantity ?? 0}" required></label><label>Currency<input name="currency" value="USD" required></label><label>Status<select name="status"><option>draft</option><option ${product?.status === "active" ? "selected" : ""}>active</option><option>archived</option></select></label></div><label>Description<textarea name="description"></textarea></label><label>Image URL<input name="imageUrl" type="url"></label><label>Shipping information<textarea name="shippingSummary"></textarea></label><div class="form-grid"><label>Source provider<input name="provider" placeholder="AliExpress"></label><label>Source product ID<input name="externalId"></label></div><label>Source URL<input name="sourceUrl" type="url"></label>`, async (d) => { const values = Object.fromEntries(d); const body = { ...values, price: Number(values.price), quantity: Number(values.quantity), compareAtPrice: null, source: values.provider ? { provider: values.provider, externalId: values.externalId, sourceUrl: values.sourceUrl } : undefined }; await api.request(`/shops/${selected}/products${product ? `/${product.id}` : ""}`, product ? "PUT" : "POST", body); }); }
async function orderModal(id) { const order = (await getOrders()).find(item => item.id === id); if (!order)
    return; modal(`<h2>Manage order #${escape(order.externalOrderId)}</h2><p>${escape(order.buyer.name)} · ${escape(order.buyer.email)}</p><label>Order status<select name="status">${["paid", "processing", "shipped", "delivered", "cancelled", "refunded"].map(value => `<option ${order.status === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><hr><h3>Incident</h3><label>Incident type<input name="incidentType" placeholder="shipping_delay"></label><label>Message<textarea name="message"></textarea></label><h3>Refund request</h3><label>Amount<input name="refundAmount" type="number" min="0" max="${order.total}" step=".01"></label><label>Reason<textarea name="reason"></textarea></label>`, async (data) => { const status = String(data.get("status")); if (status !== order.status)
    await api.request(`/shops/${selected}/orders/${id}`, "PUT", { status }); if (data.get("incidentType"))
    await api.request(`/shops/${selected}/orders/${id}/incidents`, "POST", { type: data.get("incidentType"), message: data.get("message") }); if (data.get("refundAmount"))
    await api.request(`/shops/${selected}/orders/${id}/refunds`, "POST", { amount: Number(data.get("refundAmount")), reason: data.get("reason") }); }); }
function promotionModal() { modal(`<h2>Create promotion</h2><div class="form-grid"><label>Name<input name="name" required></label><label>Code<input name="code" required></label><label>Product ID<input name="productId" placeholder="Optional"></label><label>Type<select name="kind"><option>percentage</option><option>fixed</option></select></label><label>Value<input name="value" type="number" min=".01" step=".01" required></label><label>Starts at<input name="startsAt" type="datetime-local" required></label><label>Ends at<input name="endsAt" type="datetime-local" required></label></div>`, async (data) => { const values = Object.fromEntries(data); await api.request(`/shops/${selected}/promotions`, "POST", { ...values, value: Number(values.value), active: true }); }); }
function recommendationModal() { modal(`<h2>Homepage recommendations</h2><p class="muted">Enter product IDs in display order, separated by commas.</p><label>Product IDs<textarea name="ids" required></textarea></label>`, async (data) => { const productIds = String(data.get("ids")).split(",").map(value => value.trim()).filter(Boolean); await api.request(`/shops/${selected}/recommendations`, "PUT", { productIds }); }); }
async function boot() { try {
    shops = await api.request("/shops");
    await render();
}
catch {
    sessionStorage.removeItem("inteligent-token");
    login();
} }
void boot();
//# sourceMappingURL=index.js.map